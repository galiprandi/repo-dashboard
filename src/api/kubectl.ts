import { runCommand } from '@/api/exec';

export interface DeploymentInfo {
  namespace: string;
  name: string;
  ready: string;
  upToDate: string;
  available: string;
  age: string;
  images: string[];
}

export interface PodInfo {
  namespace: string;
  name: string;
  ready: string;
  status: string;
  restarts: string;
  age: string;
  node?: string;
}

/**
 * Sanitiza nombres de recursos de Kubernetes para prevenir command injection.
 * Kubernetes names deben cumplir con: RFC 1123 subdomain (DNS subdomain)
 * - Deben consistir de caracteres alfanuméricos minúsculos, '-' o '.'
 * - Deben empezar y terminar con carácter alfanumérico
 * - Longitud máxima: 253 caracteres
 */
function sanitizeK8sName(name: string): string {
  if (!name) {
    throw new Error('Kubernetes name cannot be empty');
  }

  if (name.length > 253) {
    throw new Error(`Kubernetes name exceeds maximum length of 253 characters: ${name}`);
  }

  // Validar formato de nombre de Kubernetes (RFC 1123 subdomain)
  const k8sNameRegex = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?(\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*$/;
  
  if (!k8sNameRegex.test(name)) {
    throw new Error(`Invalid Kubernetes name format: ${name}. Names must consist of lowercase alphanumeric characters, '-' or '.', and must start and end with an alphanumeric character.`);
  }

  return name;
}

/**
 * Sanitiza nombres de namespace de Kubernetes.
 * Los namespaces siguen las mismas reglas que los nombres de recursos.
 */
function sanitizeNamespace(namespace: string): string {
  return sanitizeK8sName(namespace);
}

/**
 * Verifica que kubectl esté instalado y accesible.
 */
export async function checkKubectlInstalled(): Promise<boolean> {
  try {
    const result = await runCommand('kubectl version --client --output=json');
    return result.stdout.includes('clientVersion');
  } catch {
    return false;
  }
}

function parseDeployments(output: string): DeploymentInfo[] {
  const lines = output.trim().split('\n');
  const deployments: DeploymentInfo[] = [];
  
  // Detectar si tiene columna NAMESPACE (all-namespaces) o solo NAME
  const hasNamespace = lines[0]?.includes('NAMESPACE');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('NAME')) continue;
    const parts = trimmed.split(/\s+/);
    
    if (hasNamespace) {
      // Formato: NAMESPACE NAME READY UP-TO-DATE AVAILABLE AGE
      if (parts.length >= 6) {
        deployments.push({
          namespace: parts[0],
          name: parts[1],
          ready: parts[2],
          upToDate: parts[3],
          available: parts[4],
          age: parts[5] || '',
          images: [],
        });
      }
    } else {
      // Formato: NAME READY UP-TO-DATE AVAILABLE AGE
      if (parts.length >= 5) {
        deployments.push({
          namespace: '',
          name: parts[0],
          ready: parts[1],
          upToDate: parts[2],
          available: parts[3],
          age: parts[4] || '',
          images: [],
        });
      }
    }
  }
  return deployments;
}

function parsePods(output: string): PodInfo[] {
  const lines = output.trim().split('\n');
  const pods: PodInfo[] = [];
  
  // Detectar si tiene columna NAMESPACE (all-namespaces) o solo NAME
  const hasNamespace = lines[0]?.includes('NAMESPACE');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('NAME')) continue;
    const parts = trimmed.split(/\s+/);
    
    if (hasNamespace) {
      // Formato: NAMESPACE NAME READY STATUS RESTARTS AGE NODE
      if (parts.length >= 6) {
        pods.push({
          namespace: parts[0],
          name: parts[1],
          ready: parts[2],
          status: parts[3],
          restarts: parts[4],
          age: parts[5] || '',
          node: parts[6] || '',
        });
      }
    } else {
      // Formato: NAME READY STATUS RESTARTS AGE NODE
      if (parts.length >= 5) {
        pods.push({
          namespace: '',
          name: parts[0],
          ready: parts[1],
          status: parts[2],
          restarts: parts[3],
          age: parts[4] || '',
          node: parts[5] || '',
        });
      }
    }
  }
  return pods;
}

export async function getDeployments(namespace?: string): Promise<DeploymentInfo[]> {
  try {
    const nsFlag = namespace ? `-n ${sanitizeNamespace(namespace)}` : '--all-namespaces';
    const result = await runCommand(`kubectl get deployments ${nsFlag}`);
    return parseDeployments(result.stdout);
  } catch {
    return [];
  }
}

export async function getPods(namespace?: string): Promise<PodInfo[]> {
  try {
    const nsFlag = namespace ? `-n ${sanitizeNamespace(namespace)}` : '--all-namespaces';
    const result = await runCommand(`kubectl get pods ${nsFlag}`);
    return parsePods(result.stdout);
  } catch {
    return [];
  }
}

export async function getPodsForDeployment(deploymentName: string, namespace?: string): Promise<PodInfo[]> {
  try {
    const sanitizedDeploymentName = sanitizeK8sName(deploymentName);
    const nsFlag = namespace ? `-n ${sanitizeNamespace(namespace)}` : '';
    const selectorResult = await runCommand(`kubectl get deployment ${sanitizedDeploymentName} ${nsFlag} -o jsonpath='{.spec.selector.matchLabels}'`);
    const selector = selectorResult.stdout.trim();
    if (!selector) {
      return [];
    }
    // Convertir selector JSON a formato -l key=value,key2=value2
    try {
      const labels = JSON.parse(selector);
      const labelSelector = Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',');
      const result = await runCommand(`kubectl get pods ${nsFlag} -l ${labelSelector}`);
      return parsePods(result.stdout);
    } catch {
      return [];
    }
  } catch {
    return [];
  }
}

export async function getResourceLogs(resourceType: 'deployment' | 'pod', name: string, namespace?: string, tail = 100): Promise<string> {
  try {
    const sanitizedName = sanitizeK8sName(name);
    const nsFlag = namespace ? `-n ${sanitizeNamespace(namespace)}` : '';
    if (resourceType === 'deployment') {
      // Obtener selector del deployment y usar label selector para logs
      const selectorResult = await runCommand(`kubectl get deployment ${sanitizedName} ${nsFlag} -o jsonpath='{.spec.selector.matchLabels}'`);
      const selector = selectorResult.stdout.trim();
      if (!selector) {
        return 'Error: No se pudo obtener selector del deployment';
      }
      // Convertir selector JSON a formato -l key=value,key2=value2
      try {
        const labels = JSON.parse(selector);
        const labelSelector = Object.entries(labels).map(([k, v]) => `${k}=${v}`).join(',');
        const result = await runCommand(`kubectl logs ${nsFlag} -l ${labelSelector} --tail=${tail}`);
        return result.stdout;
      } catch {
        return `Error: Selector inválido: ${selector}`;
      }
    }
    const result = await runCommand(`kubectl logs ${sanitizedName} ${nsFlag} --tail=${tail}`);
    return result.stdout;
  } catch (error) {
    if (error instanceof Error) {
      return `Error: ${error.message}`;
    }
    return 'Error fetching logs';
  }
}
