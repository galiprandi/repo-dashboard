import { createFileRoute } from '@tanstack/react-router';
import { useRef, useState, useEffect } from 'react';
import { Blocks, RefreshCw } from 'lucide-react';
import { useDockerAccess } from '@/hooks/useDockerAccess';
import { useQuery } from '@tanstack/react-query';
import { ContainerList, type ContainerListRef } from '@/components/ContainerList';
import { FilterBar } from '@/components/shared/FilterBar';
import { getContainers } from '@/api/docker';
import { queryKeys, applyCachePolicy } from '@/lib/queryKeys';

export const Route = createFileRoute('/docker')({
  component: DockerManagerPage,
});

function DockerManagerPage() {
  const containerListRef = useRef<ContainerListRef>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { data: access, isLoading: checkingAccess } = useDockerAccess();
  const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'stopped' | 'exited'>('running');
  const [searchQuery, setSearchQuery] = useState('');

  // Obtener contenedores para calcular contadores
  const { data: containers } = useQuery({
    queryKey: queryKeys.docker.containers(),
    queryFn: getContainers,
    ...applyCachePolicy('docker'),
  });

  // Calcular contadores para los filtros
  const filterCounts = {
    all: containers?.length || 0,
    running: containers?.filter(c => c.status.toLowerCase().startsWith('up')).length || 0,
    stopped: containers?.filter(c => !c.status.toLowerCase().startsWith('up')).length || 0,
    exited: containers?.filter(c => c.status.toLowerCase().includes('exited')).length || 0,
  };

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

  const filters = [
    { value: 'all' as const, label: `Todos (${filterCounts.all})` },
    { value: 'running' as const, label: `Running (${filterCounts.running})` },
    { value: 'stopped' as const, label: `Stopped (${filterCounts.stopped})` },
    { value: 'exited' as const, label: `Exited (${filterCounts.exited})` },
  ];

  const handleFilterChange = (value: string) => {
    setStatusFilter(value as 'all' | 'running' | 'stopped' | 'exited');
  };

  return (
    <div className="space-y-6">
      {/* Filtros y búsqueda */}
      <FilterBar
        filters={filters}
        activeFilter={statusFilter}
        onFilterChange={handleFilterChange}
        searchPlaceholder="Buscar contenedor... (Cmd+F)"
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
        rightContent={
          <button
            type="button"
            onClick={handleRefresh}
            className="flex items-center justify-center gap-2 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Recargar
          </button>
        }
      />

      {/* Contenido */}
      {checkingAccess ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Blocks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Verificando acceso a Docker...</p>
        </div>
      ) : access?.hasAccess ? (
        <ContainerList ref={containerListRef} statusFilter={statusFilter} searchQuery={searchQuery} />
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <Blocks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se tiene acceso a Docker</p>
          <p className="text-sm text-gray-400 mt-1">Asegúrate de que Docker esté instalado y en ejecución</p>
        </div>
      )}
    </div>
  );
}
