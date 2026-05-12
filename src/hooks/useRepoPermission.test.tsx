import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useRepoPermission } from './useRepoPermission';
import { runCommand } from '@/api/exec';

vi.mock('@/api/exec', () => ({
	runCommand: vi.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false } },
	});
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

describe('useRepoPermission', () => {
	it('debe retornar permisos cuando el comando es exitoso', async () => {
		const mockData = { permissions: { admin: true }, viewerPermission: 'ADMIN' };
		vi.mocked(runCommand).mockResolvedValueOnce({
			stdout: JSON.stringify(mockData),
			stderr: '',
			success: true,
		});

		const { result } = renderHook(() => useRepoPermission({ repo: 'owner/repo' }), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual(mockData);
	});

	it('debe retornar objeto vacío si el JSON es inválido', async () => {
		vi.mocked(runCommand).mockResolvedValueOnce({
			stdout: 'invalid-json',
			stderr: '',
			success: true,
		});

		const { result } = renderHook(() => useRepoPermission({ repo: 'owner/repo' }), { wrapper });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toEqual({});
	});
});
