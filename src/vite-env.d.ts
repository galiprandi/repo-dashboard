/// <reference types="vite/client" />

// Used by api.ts and seki.ts via import.meta.env.VITE_SEKI_API_URL and import.meta.env.VITE_SEKI_API_TOKEN
export interface ImportMetaEnv {
	readonly VITE_SEKI_API_URL: string;
	readonly VITE_SEKI_API_TOKEN: string;
}
