# Políticas de Caché e Invalidación de Queries

**Fecha:** 2026-05-06
**Estado:** Activo

## Resumen

Este documento define las políticas de caché e invalidación para todas las queries de TanStack Query en ReleaseHub. El objetivo es tener un sistema consistente, tipado y documentado que facilite el mantenimiento y la depuración.

## Arquitectura

### Archivo Centralizado

Todas las políticas están definidas en `src/lib/queryKeys.ts`:

1. **Tipos TypeScript** - QueryKeys tipadas por dominio
2. **Helper Functions** - Generadores de queryKeys con autocompletado
3. **Políticas de Caché** - `staleTime`, `gcTime`, persistencia en LS por dominio
4. **Políticas de Invalidación** - Reglas de invalidación por trigger

### Uso en el Código

```typescript
import { queryKeys, cachePolicies, applyCachePolicy } from "@/lib/queryKeys";

// Usar helper function para generar queryKey
const { data } = useQuery({
  queryKey: queryKeys.kubectl.deployments(namespace, context),
  queryFn: () => getDeployments(namespace, context),
  ...applyCachePolicy("kubectl"), // Aplica política del dominio
});
```

---

## Políticas de Caché por Dominio

### Estrategias de Caché

| Estrategia | staleTime | gcTime | Persistencia LS | Caso de Uso |
|------------|-----------|--------|------------------|-------------|
| **NO cachear** | 0 | 0 | ❌ | Datos que cambian constantemente o dependen de estado externo |
| **Cachear corto** | < 5 min | 5-10 min | ❌ | Datos que cambian frecuentemente |
| **Cachear medio** | 5-15 min | 10-30 min | ❌ | Datos que cambian ocasionalmente |
| **Cachear largo** | > 15 min | 30-60 min | ❌ | Datos que cambian raramente |
| **Persistir LS** | Infinity | Infinity | ✅ | Datos que deben sobrevivir refresh de página |

---

### Dominios Específicos

#### kubectl - Kubernetes

**Política:** NO cachear ni persistir

```typescript
{
  staleTime: 0,
  gcTime: 0,
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 0,
}
```

**Razón:** El acceso a k8s depende de la VPN conectada. Cachear datos cuando la VPN está desconectada es problemático porque:
- Los datos pueden estar stale cuando la VPN se reconecta
- No hay forma de detectar cambios en el cluster sin re-ejecutar el comando
- Los permisos pueden cambiar entre sesiones de VPN

**Cuándo invalidar:**
- Al cambiar contexto k8s: `invalidateByDomain(queryClient, "kubectl")`
- Al conectar/desconectar VPN: `invalidateByDomain(queryClient, "kubectl")`

---

#### git - Git/GitHub

**Política:** Cachear medio, no persistir

```typescript
{
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 2,
}
```

**Razón:** Los datos de Git (commits, tags, diff) cambian ocasionalmente pero no tan frecuentemente como para justificar polling constante. No se persiste porque:
- Los datos pueden cambiar en el repo remoto
- Es rápido re-fetch desde GitHub API
- No afecta la experiencia del usuario si se recarga

**Cuándo invalidar:**
- Al crear tag: `invalidateByTrigger(queryClient, "git:tag-created")`
- Al hacer push: `invalidateByTrigger(queryClient, "git:commit-push")`

---

#### pipeline - CI/CD

**Política:** Cachear corto con polling manual, no persistir

```typescript
{
  staleTime: 30 * 1000, // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false, // Polling manual por componente
  retry: 2,
}
```

**Razón:** Los pipelines cambian frecuentemente durante ejecución. Se usa polling manual en lugar de automático porque:
- No todos los componentes necesitan polling
- El usuario puede querer pausar el polling
- Diferentes pipelines pueden tener diferentes intervalos

**NO persistir pipelines en progreso porque:**
- El estado puede cambiar rápidamente
- Persistir un estado intermedio puede confundir al usuario
- Es mejor mostrar estado actual que estado cacheado

**Cuándo invalidar:**
- Al refrescar manualmente: `invalidateByTrigger(queryClient, "pipeline:refresh")`
- Al cambiar proveedor: `invalidateByTrigger(queryClient, "pipeline:provider-change")`

---

#### github-actions - GitHub Actions

**Política:** Cachear medio, no persistir

```typescript
{
  staleTime: 5 * 60 * 1000, // 5 minutos
  gcTime: 10 * 60 * 1000, // 10 minutos
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 2,
}
```

**Razón:** Similar a git, los workflows y runs cambian ocasionalmente. No se persiste porque:
- Los datos pueden cambiar en GitHub
- Es rápido re-fetch desde GitHub API
- No afecta la experiencia del usuario si se recarga

---

#### pr - Pull Requests

**Política:** Cachear corto, no persistir

```typescript
{
  staleTime: 2 * 60 * 1000, // 2 minutos
  gcTime: 5 * 60 * 1000, // 5 minutos
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 2,
}
```

**Razón:** Los PRs cambian frecuentemente (comentarios, aprobaciones, checks). Cachear por poco tiempo porque:
- Los usuarios esperan ver cambios rápidamente
- Los comentarios y aprobaciones cambian a menudo
- Los checks pueden actualizar en cualquier momento

---

#### repo - Repositorio

**Política:** Cachear largo, no persistir

```typescript
{
  staleTime: 30 * 60 * 1000, // 30 minutos
  gcTime: 60 * 60 * 1000, // 1 hora
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 2,
}
```

**Razón:** Los metadatos del repo (permisos, branch protection) cambian raramente. Cachear por largo tiempo porque:
- Los permisos no cambian frecuentemente
- Los branch rules se modifican ocasionalmente
- Reducir llamadas a GitHub API

**Cuándo invalidar:**
- Al cambiar branch protection: `invalidateByTrigger(queryClient, "repo:branch-protection-change")`

---

#### user - Usuario

**Política:** Cachear infinito, PERSISTIR en LS

```typescript
{
  staleTime: Infinity,
  gcTime: Infinity,
  persistInLocalStorage: true,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 0,
}
```

**Razón:** Las preferencias del usuario (favorites, projects) deben persistir entre sesiones. Persistir en LS porque:
- El usuario espera que sus favoritos se mantengan
- Los proyectos son datos locales del usuario
- Mejora la experiencia al no tener que reconfigurar

**Cuándo invalidar:**
- Al toggle favorite: `invalidateByTrigger(queryClient, "user:favorite-toggle")`
- Al modificar proyectos: `invalidateByTrigger(queryClient, "user:project-change")`

---

#### settings - Configuración

**Política:** Cachear infinito, PERSISTIR en LS

```typescript
{
  staleTime: Infinity,
  gcTime: Infinity,
  persistInLocalStorage: true,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 0,
}
```

**Razón:** Las settings de la app (Seki token, Discord webhook) deben persistir entre sesiones. Persistir en LS porque:
- El usuario no quiere reconfigurar tokens cada refresh
- Los tokens son sensibles y deben persistir localmente
- Mejora la experiencia al mantener configuración

---

#### tools - Herramientas CLI

**Política:** Cachear largo, no persistir

```typescript
{
  staleTime: 60 * 60 * 1000, // 1 hora
  gcTime: 24 * 60 * 60 * 1000, // 24 horas
  persistInLocalStorage: false,
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: 1,
}
```

**Razón:** Las versiones de CLI (jq, gh-cli) cambian muy raramente. Cachear por muy largo tiempo porque:
- La versión de una herramienta no cambia durante una sesión
- Es rápido verificar la versión
- Reducir llamadas al sistema

---

## Políticas de Invalidación

### Cuándo Invalidar Queries

#### 1. Invalidación Automática (React Query)

React Query invalida automáticamente cuando:
- `staleTime` expira y la query se vuelve activa
- Se llama a `invalidateQueries()`
- Se llama a `refetchQueries()`

#### 2. Invalidación Manual por Acción del Usuario

Invalidar cuando el usuario realiza una acción que modifica datos:

| Acción | Trigger | Queries Invalidadas | Razón |
|--------|---------|---------------------|-------|
| Cambiar contexto k8s | `k8s:context-change` | `["kubectl", "deployments"]`, `["kubectl", "pods"]`, `["kubectl", "logs"]` | Los recursos dependen del contexto |
| Desconectar VPN | `k8s:vpn-disconnect` | `["kubectl"]` | Forzar re-check de acceso |
| Crear tag | `git:tag-created` | `["git", "tags"]`, `["repo", "permission"]` | Tags y permisos pueden cambiar |
| Push commit | `git:commit-push` | `["git", "commits"]`, `["pipeline", "staging"]` | Commits y pipelines staging cambian |
| Refrescar pipeline | `pipeline:refresh` | `["pipeline"]` | Refrescar manual todos los pipelines |
| Cambiar proveedor | `pipeline:provider-change` | `["pipeline", "detection"]`, `["pipeline", "unified"]` | Detección y unified dependen del proveedor |
| Cambiar branch protection | `repo:branch-protection-change` | `["repo", "branch-protection"]` | Solo invalidar esa query específica |
| Toggle favorite | `user:favorite-toggle` | `["user", "collections"]` | Optimistic update de collections |
| Modificar proyectos | `user:project-change` | `["user", "collections"]` | Collections incluyen proyectos |

#### 3. Invalidación por Dominio (Grupos)

Usar prefijos para invalidar grupos completos de queries:

```typescript
// Invalidar todo k8s
queryClient.invalidateQueries({ queryKey: ["kubectl"] });

// Invalidar todos los pipelines
queryClient.invalidateQueries({ queryKey: ["pipeline"] });

// Invalidar todo lo del repo
queryClient.invalidateQueries({ queryKey: ["repo"] });
```

**Cuándo usar invalidación por dominio:**
- Cuando un cambio afecta todas las queries de un dominio
- Cuando no se sabe exactamente qué queries invalidar
- Cuando se quiere invalidar por categoría (ej: todo git)

---

## Helper Functions

### applyCachePolicy

Aplica la política de caché de un dominio a una query:

```typescript
const { data } = useQuery({
  queryKey: queryKeys.kubectl.deployments(namespace),
  queryFn: () => getDeployments(namespace),
  ...applyCachePolicy("kubectl"), // Aplica staleTime, gcTime, retry, etc.
});
```

### invalidateByDomain

Invalida todas las queries de un dominio:

```typescript
invalidateByDomain(queryClient, "kubectl");
```

### invalidateByTrigger

Invalida queries basándose en un trigger predefinido:

```typescript
invalidateByTrigger(queryClient, "k8s:context-change");
```

---

## Mejores Prácticas

### 1. Usar Helper Functions

Siempre usar `queryKeys.*` en lugar de arrays literales:

```typescript
// ✅ Bien - tipado, autocompletado
queryKey: queryKeys.kubectl.deployments(namespace, context)

// ❌ Mal - no tipado, propenso a errores
queryKey: ["kubectl", "deployments", namespace, context]
```

### 2. Aplicar Políticas de Caché

Siempre aplicar `applyCachePolicy()` cuando sea posible:

```typescript
const { data } = useQuery({
  queryKey: queryKeys.git.commits(repo),
  queryFn: () => getCommits(repo),
  ...applyCachePolicy("git"), // Aplica política del dominio
});
```

### 3. Invalidar por Dominio cuando sea Apropiado

Preferir invalidación por dominio sobre invalidación específica:

```typescript
// ✅ Bien - invalida todo k8s al cambiar contexto
invalidateByDomain(queryClient, "kubectl");

// ❌ Mal - hay que recordar todas las queries
queryClient.invalidateQueries({ queryKey: ["kubectl", "deployments", namespace] });
queryClient.invalidateQueries({ queryKey: ["kubectl", "pods", namespace] });
queryClient.invalidateQueries({ queryKey: ["kubectl", "logs", namespace] });
```

### 4. NO Persistir Datos que Dependen de Estado Externo

Nunca persistir en localStorage datos que dependen de:
- Conexión VPN (kubectl)
- Tokens que pueden expirar
- Servicios externos que pueden no estar disponibles

### 5. Usar Optimistic Updates para User Data

Para datos del usuario (favorites, projects), usar optimistic updates:

```typescript
const mutate = useMutation({
  mutationFn: (next) => Promise.resolve(next),
  onMutate: async (next) => {
    await queryClient.cancelQueries({ queryKey: queryKeys.user.collections() });
    const previous = queryClient.getQueryData(queryKeys.user.collections());
    queryClient.setQueryData(queryKeys.user.collections(), next);
    return { previous };
  },
  onError: (_err, _vars, context) => {
    if (context?.previous) {
      queryClient.setQueryData(queryKeys.user.collections(), context.previous);
    }
  },
});
```

---

## Referencias

- [TanStack Query Docs - Caching](https://tanstack.com/query/latest/docs/framework/react/guides/caching)
- [TanStack Query Docs - Invalidations](https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation)
- [Archivo de implementación](../../src/lib/queryKeys.ts)
