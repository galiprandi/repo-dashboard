# Requisitos del Usuario - Rama feat/k8s

## Comandos CLI Requeridos

Esta rama introduce funcionalidades que requieren las siguientes herramientas CLI instaladas en el sistema del usuario:

### 1. kubectl (Kubernetes CLI)

**Propósito**: Acceso a clusters de Kubernetes para ver deployments, pods y logs.

**Comandos utilizados**:
- `kubectl get deployments -n <namespace>`
- `kubectl get pods -n <namespace>`
- `kubectl logs <pod-name> -n <namespace> --tail=<n>`
- `kubectl logs -l <label-selector> -n <namespace> --tail=<n>`
- `kubectl auth can-i get pods -n <namespace>`
- `kubectl auth can-i get deployments -n <namespace>`
- `kubectl auth can-i get pods/logs -n <namespace>`

**Instalación**:
```bash
# macOS
brew install kubectl

# Linux
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Windows
winget install -e --id Kubernetes.kubectl
```

**Verificación**:
```bash
kubectl version --client
```

**Configuración requerida**:
- El usuario debe tener acceso configurado a uno o más clusters de Kubernetes
- El archivo `~/.kube/config` debe estar configurado con los contextos apropiados
- Permisos necesarios: `get pods`, `get deployments`, `get pods/logs` en los namespaces correspondientes

---

### 2. gh (GitHub CLI)

**Propósito**: Acceso a la API de GitHub para obtener commits, tags, branches, pull requests, y más.

**Comandos utilizados**:
- `gh api repos/<org>/<repo>/commits`
- `gh api repos/<org>/<repo>/tags`
- `gh api repos/<org>/<repo>/actions/runs`
- `gh api repos/<org>/<repo>/branches/main/protection`
- `gh api user`
- `gh auth status`
- `gh auth token`
- `gh api /user/memberships/orgs`

**Instalación**:
```bash
# macOS
brew install gh

# Linux
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update
sudo apt install gh

# Windows
winget install -e --id GitHub.cli
```

**Verificación**:
```bash
gh --version
gh auth status
```

**Configuración requerida**:
- Autenticación con GitHub: `gh auth login`
- Permisos necesarios en los repositorios:
  - Lectura de commits y tags
  - Lectura de workflows de GitHub Actions
  - Lectura de branch protection (opcional para funcionalidad de freeze/promote)
  - Lectura de pull requests

---

### 3. jq (JSON Processor)

**Propósito**: Procesamiento de JSON en línea de comandos para filtrar y transformar respuestas de APIs.

**Comandos utilizados**:
- `gh api ... --jq '.[] | {hash: .sha, ...}'`
- `gh api ... --jq '{name: .name, email: .email}'`

**Instalación**:
```bash
# macOS
brew install jq

# Linux
sudo apt-get install jq

# Windows
winget install -e --id jqlang.jq
```

**Verificación**:
```bash
jq --version
```

---

## Resumen de Requisitos

| Herramienta | Versión mínima | Propósito | Obligatoria |
|-------------|---------------|-----------|-------------|
| kubectl | 1.20+ | Acceso a Kubernetes | No (solo para K8sSection) |
| gh (GitHub CLI) | 2.0+ | API de GitHub | Sí |
| jq | 1.6+ | Procesamiento JSON | Sí |

## Permisos de GitHub

Para utilizar todas las funcionalidades de la aplicación, el usuario necesita los siguientes permisos en GitHub:

1. **Repositorios**:
   - `repo` (acceso completo a repositorios privados) o
   - `public_repo` (solo para repositorios públicos)

2. **Organizaciones** (si usa repositorios de org):
   - `read:org` (lectura de organizaciones)
   - `read:project` (lectura de proyectos, si aplica)

3. **GitHub Actions**:
   - `actions:read` (lectura de workflows y runs)

## Configuración de Kubernetes

Para la funcionalidad K8sSection, el usuario necesita:

1. **Contexto de Kubernetes configurado**:
   ```bash
   kubectl config current-context
   ```

2. **Permisos RBAC en el namespace**:
   - `get pods`
   - `get deployments`
   - `get pods/logs`

3. **Cluster accesible desde la máquina del usuario**:
   - Si el cluster es remoto, VPN o túnel configurado
   - Si el cluster es local (minikube, kind, etc.), debe estar running

## Verificación de Setup

Para verificar que el usuario tiene todo configurado correctamente, puede ejecutar:

```bash
# Verificar kubectl
kubectl version --client
kubectl config current-context

# Verificar gh
gh --version
gh auth status

# Verificar jq
jq --version

# Verificar acceso a un repo de prueba
gh api repos/github/github --jq '{name, private}'
```

## Notas Importantes

1. **K8sSection es opcional**: Si el usuario no tiene kubectl configurado o no tiene acceso a clusters de Kubernetes, la sección K8sSection simplemente no aparecerá (siguiendo la política de features no disponibles).

2. **GitHub CLI es obligatorio**: La mayoría de las funcionalidades dependen de gh. Sin gh autenticado, la aplicación no funcionará correctamente.

3. **jq es obligatorio**: Es necesario para procesar las respuestas JSON de la API de GitHub.

4. **Tokens de autenticación**: 
   - GitHub CLI maneja la autenticación automáticamente después de `gh auth login`
   - No es necesario configurar tokens manualmente en la aplicación
