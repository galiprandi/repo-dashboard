import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, useEffect } from 'react';
import { Blocks, RefreshCw, Search } from 'lucide-react';
import { useDockerAccess } from '@/hooks/useDockerAccess';
import { ContainerList, type ContainerListRef } from '@/components/ContainerList';

export const Route = createFileRoute('/docker')({
  component: DockerManagerPage,
});

function DockerManagerPage() {
  const containerListRef = useRef<ContainerListRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: access, isLoading: checkingAccess } = useDockerAccess();
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'exited'>('running');
  const [searchQuery, setSearchQuery] = useState('');

  const handleRefresh = () => {
    containerListRef.current?.refetch();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="flex flex-col h-full space-y-6 relative">
      {/* Header */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <Blocks className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Docker Manager</h1>
      </div>

      {/* Filtros y búsqueda */}
      <div className="flex items-center justify-between gap-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-600">Filtrar:</span>
          {[
            { value: 'all' as const, label: 'Todos' },
            { value: 'running' as const, label: 'Running' },
            { value: 'stopped' as const, label: 'Stopped' },
            { value: 'exited' as const, label: 'Exited' },
          ].map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                statusFilter === filter.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Buscar contenedor... (Cmd+F)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-80 pl-9 pr-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-200 rounded-md transition-colors"
            title="Recargar lista de contenedores"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Contenido con scroll */}
      <div className="flex-1 overflow-auto">
        {checkingAccess ? (
          <div className="flex items-center justify-center p-8 text-muted-foreground">
            Verificando acceso a Docker...
          </div>
        ) : access?.hasAccess ? (
          <ContainerList ref={containerListRef} statusFilter={statusFilter} searchQuery={searchQuery} />
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-muted-foreground bg-gray-50 rounded-lg border-2 border-dashed">
            <Blocks className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg font-medium">No se tiene acceso a Docker</p>
            <p className="text-sm mt-2">Asegúrate de que Docker esté instalado y en ejecución</p>
          </div>
        )}
      </div>
    </div>
  );
}
