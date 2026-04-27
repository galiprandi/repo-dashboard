import { createFileRoute, Link } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { Activity, RefreshCw, Trash2, ExternalLink, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';
import { useHealthMonitor } from '@/hooks/useHealthMonitor';
import { useFavorites } from '@/hooks/useFavorites';

export const Route = createFileRoute('/health')({
  component: HealthMonitorPage,
});

function HealthStatusIndicator({ isHealthy, isChecking }: { isHealthy: boolean | null; isChecking: boolean }) {
  if (isChecking) {
    return (
      <div className="w-4 h-4 rounded-full border-2 border-gray-300 border-t-green-500 animate-spin" />
    );
  }

  if (isHealthy === null) {
    return <div className="w-4 h-4 rounded-full bg-gray-300" />;
  }

  return isHealthy ? (
    <div className="w-4 h-4 rounded-full bg-green-500" title="Healthy" />
  ) : (
    <div className="w-4 h-4 rounded-full bg-red-500" title="Unhealthy" />
  );
}

function InfoBanner() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-blue-100/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-blue-600" />
          <span className="font-medium text-blue-800">Cómo funciona</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-blue-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-blue-600" />
        )}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4">
          <div className="text-sm text-blue-800 pt-2 border-t border-blue-200">
            <ul className="space-y-1 list-disc list-inside">
              <li>Los endpoints se detectan automáticamente desde los pipelines de deploy</li>
              <li>Se verifica el endpoint <code className="bg-blue-100 px-1 rounded">/health</code> en cada URL</li>
              <li>Los servicios se eliminan automáticamente cuando quitas un repo de favoritos</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function EndpointRow({
  endpoint,
  isChecking,
  onCheck,
  onRemove,
}: {
  endpoint: ReturnType<typeof useHealthMonitor>['endpoints'][number];
  isChecking: boolean;
  onCheck: () => void;
  onRemove: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(endpoint.url);
      setCopied(true);
    } catch {
      // Silently fail if clipboard API not available
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (copied) {
      timeout = setTimeout(() => setCopied(false), 2000);
    }
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [copied]);

  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-50 transition-colors">
      {/* Status indicator */}
      <HealthStatusIndicator isHealthy={endpoint.isHealthy} isChecking={isChecking} />

      {/* Service name */}
      <span className="font-medium text-sm">{endpoint.service === '/' ? '/' : `/${endpoint.service}`}</span>

      {/* Environment badge */}
      <span
        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide ${
          endpoint.environment === 'production'
            ? 'bg-purple-100 text-purple-700'
            : 'bg-blue-100 text-blue-700'
        }`}
      >
        {endpoint.environment}
      </span>

      {/* Response time */}
      {endpoint.responseTime !== undefined && (
        <span className={`text-xs ${endpoint.isHealthy ? 'text-green-600' : 'text-red-600'}`}>
          {endpoint.responseTime}ms
        </span>
      )}

      {/* URL - truncado */}
      <span className="flex-1 text-xs text-gray-500 truncate min-w-0">
        {endpoint.url}
      </span>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={onCheck}
          disabled={isChecking}
          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
          title="Verificar ahora"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={copyUrl}
          className={`p-1.5 rounded transition-colors ${
            copied
              ? 'text-green-600 bg-green-50'
              : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
          }`}
          title={copied ? 'Copiado!' : 'Copiar URL'}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>

        <a
          href={endpoint.url}
          target="_blank"
          rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
          title="Abrir URL"
        >
          <ExternalLink className="w-3.5 h-3.5" />
        </a>

        <button
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
          title="Eliminar del monitoreo"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

function ProductSection({
  product,
  endpoints,
  isChecking,
  onCheckEndpoint,
  onRemoveEndpoint,
}: {
  product: string;
  endpoints: ReturnType<typeof useHealthMonitor>['endpoints'];
  isChecking: boolean;
  onCheckEndpoint: (id: string) => void;
  onRemoveEndpoint: (id: string) => void;
}) {
  const [, productName] = product.split('/');

  // Separar endpoints con error primero
  const unhealthy = endpoints.filter((ep) => ep.isHealthy === false);
  const healthy = endpoints.filter((ep) => ep.isHealthy === true);
  const pending = endpoints.filter((ep) => ep.isHealthy === null);

  // Ordenar cada grupo por ambiente y luego por ruta
  const sortByEnvAndPath = (a: typeof endpoints[0], b: typeof endpoints[0]) => {
    // Primero por ambiente
    if (a.environment !== b.environment) {
      return a.environment === 'production' ? 1 : -1;
    }
    // Luego por ruta alfabéticamente
    return a.url.localeCompare(b.url);
  };

  const sortedEndpoints = [...unhealthy, ...pending, ...healthy].sort(sortByEnvAndPath);

  return (
    <div className="bg-white rounded-lg border overflow-hidden">
      {/* Header del producto */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-800">{productName}</span>
          <span className="text-sm text-gray-500">({endpoints.length} endpoints)</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          {healthy.length > 0 && (
            <span className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              {healthy.length} OK
            </span>
          )}
          {pending.length > 0 && (
            <span className="flex items-center gap-1 text-gray-500">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              {pending.length} Pendientes
            </span>
          )}
          {unhealthy.length > 0 && (
            <span className="flex items-center gap-1 text-red-600 font-medium">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              {unhealthy.length} Error
            </span>
          )}
        </div>
      </div>

      {/* Endpoints del producto */}
      <div className="divide-y">
        {sortedEndpoints.map((endpoint) => (
          <EndpointRow
            key={endpoint.id}
            endpoint={endpoint}
            isChecking={isChecking}
            onCheck={() => onCheckEndpoint(endpoint.id)}
            onRemove={() => onRemoveEndpoint(endpoint.id)}
          />
        ))}
      </div>
    </div>
  );
}

function HealthMonitorPage() {
  const {
    endpoints,
    checkAllEndpoints,
    checkEndpoint,
    removeEndpoint,
    removeProductEndpoints,
    isChecking,
    stats,
  } = useHealthMonitor();

  const { favorites } = useFavorites();

  // Auto-check on mount
  useEffect(() => {
    const pending = endpoints.filter((ep) => ep.isHealthy === null);
    if (pending.length > 0) {
      pending.forEach((ep) => checkEndpoint(ep.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup endpoints from removed favorites
  useEffect(() => {
    const productsWithEndpoints = new Set(endpoints.map((ep) => ep.product));
    const favoriteSet = new Set(favorites);

    productsWithEndpoints.forEach((product) => {
      if (!favoriteSet.has(product)) {
        removeProductEndpoints(product);
      }
    });
  }, [favorites, endpoints, removeProductEndpoints]);

  // Agrupar endpoints por producto
  const endpointsByProduct = endpoints.reduce((acc, ep) => {
    if (!acc[ep.product]) {
      acc[ep.product] = [];
    }
    acc[ep.product].push(ep);
    return acc;
  }, {} as Record<string, typeof endpoints>);

  // Ordenar productos: primero los que tienen endpoints con error
  const sortedProducts = Object.keys(endpointsByProduct).sort((a, b) => {
    const aHasErrors = endpointsByProduct[a].some((ep) => ep.isHealthy === false);
    const bHasErrors = endpointsByProduct[b].some((ep) => ep.isHealthy === false);
    if (aHasErrors && !bHasErrors) return -1;
    if (!aHasErrors && bHasErrors) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-6">
      {/* Stats + Action buttons */}
      <div className="flex items-center gap-4">
        <div className="grid grid-cols-3 gap-4 flex-1">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-500">Total endpoints</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{stats.healthy}</div>
            <div className="text-sm text-gray-500">Healthy</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-red-600">{stats.unhealthy}</div>
            <div className="text-sm text-gray-500">Unhealthy</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* CTA Principal: Verificar solo los con fallo */}
          {stats.unhealthy > 0 && (
            <button
              onClick={() => {
                const unhealthy = endpoints.filter((ep) => ep.isHealthy === false);
                unhealthy.forEach((ep) => checkEndpoint(ep.id));
              }}
              disabled={isChecking}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando...' : `Verificar ${stats.unhealthy} con fallo`}
            </button>
          )}

          {/* CTA Secundario: Verificar todos */}
          <button
            onClick={checkAllEndpoints}
            disabled={isChecking}
            className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Verificando...' : 'Verificar todos'}
          </button>
        </div>
      </div>

      {/* Info banner - expandible */}
      <InfoBanner />

      {/* Endpoints by product */}
      {endpoints.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No hay endpoints configurados</p>
          <p className="text-sm text-gray-400 mt-1">
            Navega a un producto favorito para detectar servicios automáticamente
          </p>
          <Link
            to="/"
            className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Ir al inicio
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProducts.map((product) => (
            <ProductSection
              key={product}
              product={product}
              endpoints={endpointsByProduct[product]}
              isChecking={isChecking}
              onCheckEndpoint={checkEndpoint}
              onRemoveEndpoint={removeEndpoint}
            />
          ))}
        </div>
      )}
    </div>
  );
}
