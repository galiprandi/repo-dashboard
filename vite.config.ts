import { exec } from "node:child_process";
import { promisify } from "node:util";
import type { Connect } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const execAsync = promisify(exec);

// Handler for /local/exec endpoint - works in both dev and preview
const execHandler: Connect.NextHandleFunction = async (req, res) => {
	if (req.method !== "POST" && req.method !== "GET") {
		res.statusCode = 405;
		res.end("Method not allowed");
		return;
	}

	let command = "";

	if (req.method === "POST") {
		let body = "";
		await new Promise((resolve) => {
			req.on("data", (chunk) => {
				body += chunk;
			});
			req.on("end", resolve);
		});
		try {
			const parsed = JSON.parse(body);
			command = parsed.command;
		} catch {
			res.statusCode = 400;
			res.end(JSON.stringify({ error: "Invalid JSON body" }));
			return;
		}
	} else {
		// GET method - command from query param
		const url = new URL(req.url || "", `http://localhost`);
		command = url.searchParams.get("command") || "";
	}

	if (!command || typeof command !== "string") {
		res.statusCode = 400;
		res.end(JSON.stringify({ error: "Missing command" }));
		return;
	}

	console.log(`RUN: ${command}`);

	try {
		const { stdout, stderr } = await execAsync(command);

		res.setHeader("Content-Type", "application/json");
		res.end(JSON.stringify({ stdout, stderr, success: true }));
	} catch (error) {
		res.statusCode = 500;
		res.end(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Command failed",
				stderr:
					error instanceof Error && "stderr" in error
						? (error as { stderr: string }).stderr
						: "",
				success: false,
			}),
		);
	}
};

// Handler for /local/script endpoint - executes scripts based on action
const scriptHandler: Connect.NextHandleFunction = async (req, res) => {
	if (req.method !== "POST") {
		res.statusCode = 405;
		res.end("Method not allowed");
		return;
	}

	let body = "";
	await new Promise((resolve) => {
		req.on("data", (chunk) => {
			body += chunk;
		});
		req.on("end", resolve);
	});

	let repo = "Cencosud-xlabs/yumi-ticket-control";
	let action = "trigger-staging-redeploy";

	try {
		const parsed = JSON.parse(body);
		repo = parsed.repo || repo;
		action = parsed.action || action;
	} catch {
		// Use defaults if body is invalid
	}

	const scriptPath = `./scripts/${action}.sh`;
	const command = `${scriptPath} ${repo}`;

	console.log(`RUN: ${command}`);

	try {
		const { stdout, stderr } = await execAsync(command);

		// Extract PR URL from output
		const prUrlMatch = stdout.match(/https:\/\/github\.com\/[^/]+\/[^/]+\/pull\/\d+/);
		const prUrl = prUrlMatch ? prUrlMatch[0] : null;

		res.setHeader("Content-Type", "application/json");
		res.end(
			JSON.stringify({
				prUrl,
				stdout,
				stderr,
				success: true,
			}),
		);
	} catch (error) {
		res.statusCode = 500;
		res.end(
			JSON.stringify({
				error: error instanceof Error ? error.message : "Script execution failed",
				stderr:
					error instanceof Error && "stderr" in error
						? (error as { stderr: string }).stderr
						: "",
				success: false,
			}),
		);
	}
};

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tanstackRouter(),
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		tailwindcss(),
		{
			name: "cmd",
			configureServer(server) {
				// Generic exec endpoint - executes any bash command
				server.middlewares.use("/local/exec", execHandler);
				// Script endpoint - executes scripts based on action
				server.middlewares.use("/local/script", scriptHandler);
			},
			configurePreviewServer(server) {
				// Same endpoint for preview mode
				server.middlewares.use("/local/exec", execHandler);
				server.middlewares.use("/local/script", scriptHandler);
			},
		},
	],
	resolve: {
		alias: {
			"@": "/src",
		},
	},
	build: {
		chunkSizeWarningLimit: 1000,
		rollupOptions: {
			output: {
				manualChunks: (id) => {
					// React ecosystem
					if (id.includes("react") || id.includes("react-dom")) {
						return "react";
					}
					// TanStack ecosystem
					if (id.includes("@tanstack/react-query") || id.includes("@tanstack/react-router")) {
						return "tanstack";
					}
					// UI components
					if (id.includes("lucide-react")) {
						return "ui";
					}
				},
			},
		},
	},
	server: {
		proxy: {
			"/api": {
				target: "https://seki-bff-api.cencosudx.com",
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ""),
			},
		},
	},
	preview: {
		port: 30779,
		strictPort: true,
	},
});
