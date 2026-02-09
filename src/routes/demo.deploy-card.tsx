import { createFileRoute } from "@tanstack/react-router";
import type { PipelineStatusResponse } from "@/api/seki.type";
import { DeployPipelineCard } from "@/components/DeployPipelineCard";
import { DeployStatusCard } from "@/components/DeployStatusCard";

export const Route = createFileRoute("/demo/deploy-card")({
	component: DeployCardDemo,
});

// Mock events para demo
const mockEventsStaging = [
	{
		id: "1",
		label: { es: "Checkout" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 100000).toISOString(),
		updated_at: new Date(Date.now() - 95000).toISOString(),
	},
	{
		id: "2",
		label: { es: "Build" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 94000).toISOString(),
		updated_at: new Date(Date.now() - 80000).toISOString(),
	},
	{
		id: "3",
		label: { es: "Test" },
		state: "RUNNING",
		created_at: new Date(Date.now() - 79000).toISOString(),
		updated_at: new Date().toISOString(),
	},
	{
		id: "4",
		label: { es: "Deploy" },
		state: "PENDING",
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	},
];

const mockEventsProd = [
	{
		id: "1",
		label: { es: "Checkout" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 200000).toISOString(),
		updated_at: new Date(Date.now() - 195000).toISOString(),
	},
	{
		id: "2",
		label: { es: "Build" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 194000).toISOString(),
		updated_at: new Date(Date.now() - 180000).toISOString(),
	},
	{
		id: "3",
		label: { es: "Test" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 179000).toISOString(),
		updated_at: new Date(Date.now() - 160000).toISOString(),
	},
	{
		id: "4",
		label: { es: "Deploy" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 159000).toISOString(),
		updated_at: new Date(Date.now() - 140000).toISOString(),
	},
];

const mockEventsFailed = [
	{
		id: "1",
		label: { es: "Checkout" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 300000).toISOString(),
		updated_at: new Date(Date.now() - 295000).toISOString(),
	},
	{
		id: "2",
		label: { es: "Build" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 294000).toISOString(),
		updated_at: new Date(Date.now() - 280000).toISOString(),
	},
	{
		id: "3",
		label: { es: "Test" },
		state: "FAILED",
		created_at: new Date(Date.now() - 279000).toISOString(),
		updated_at: new Date(Date.now() - 260000).toISOString(),
	},
];

const mockEventsWarn = [
	{
		id: "1",
		label: { es: "Checkout" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 400000).toISOString(),
		updated_at: new Date(Date.now() - 395000).toISOString(),
	},
	{
		id: "2",
		label: { es: "Build" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 394000).toISOString(),
		updated_at: new Date(Date.now() - 380000).toISOString(),
	},
	{
		id: "3",
		label: { es: "Test" },
		state: "WARN",
		created_at: new Date(Date.now() - 379000).toISOString(),
		updated_at: new Date(Date.now() - 360000).toISOString(),
	},
	{
		id: "4",
		label: { es: "Deploy" },
		state: "SUCCESS",
		created_at: new Date(Date.now() - 359000).toISOString(),
		updated_at: new Date(Date.now() - 340000).toISOString(),
	},
];

const pipelineWarnReal: PipelineStatusResponse = {
	state: "WARN",
	created_at: "2026-02-06T16:36:31.017Z",
	updated_at: "2026-02-06T16:46:23.674Z",
	events: [
		{
			id: "VA",
			label: { es: "Validación", en: "", br: "" },
			state: "WARN",
			created_at: "2026-02-06T16:36:31.017Z",
			updated_at: "2026-02-06T16:36:42.370Z",
			markdown: "",
			subevents: [
				{
					id: "CONFIG_validation_config",
					label: "validation: config",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:37.315Z",
					updated_at: "2026-02-06T16:36:39.310Z",
					markdown: [
						"# Event: Config validation",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The configuration is OK",
						"",
						"## Information",
						"",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
						"**Environment**: staging",
					].join("\n"),
				},
				{
					id: "JIRA_validation_jira",
					label: "validation: jira",
					state: "WARN",
					created_at: "2026-02-06T16:36:37.326Z",
					updated_at: "2026-02-06T16:36:37.385Z",
					markdown: [
						"# Event: Jira validation",
						"",
						"## Status: **FAIL**",
						"",
						"## Details",
						"",
						"```terminal",
						"❌ El ID del issue de Jira no se encontró en el mensaje del pull request.",
						"",
						"El mensaje del pull request debe contener el ID del issue de Jira entre corchetes.",
						"Por ejemplo: [CCMR-1234] reporte de ventas",
						"```",
						"",
						"## Information",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
						"**Environment**: staging",
					].join("\n"),
				},
				{
					id: "NAMESPACE_validation_kubernets",
					label: "validation: kubernets",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:37.314Z",
					updated_at: "2026-02-06T16:36:42.370Z",
					markdown: [
						"# Event: Namespace validation",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The namespace check was successful",
						"",
						"## Information",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
						"**Environment**: staging",
					].join("\n"),
				},
				{
					id: "SECRETS_validation_secrets",
					label: "validation: secrets",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:37.313Z",
					updated_at: "2026-02-06T16:36:40.333Z",
					markdown: [
						"# Event: Secrets validation",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"Secrets found in Secret Manager",
						"",
						"## Information",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
						"**Environment**: staging",
					].join("\n"),
				},
				{
					id: "WORKSPACE_workspace_info",
					label: "workspace: info",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:31.017Z",
					updated_at: "2026-02-06T16:36:31.017Z",
					markdown: [
						"# Task: Workspace Validation",
						"",
						"This task validate the correct workspace structure in product. The workspace structure is the base of the Seki CI.",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The workspace structure is valid.",
						"",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
					].join("\n"),
				},
			],
		},
		{
			id: "BS",
			label: { es: "Imagen de dependencias", en: "", br: "" },
			state: "SUCCESS",
			created_at: "2026-02-06T16:36:44.308Z",
			updated_at: "2026-02-06T16:36:50.754Z",
			markdown: "",
			subevents: [
				{
					id: "GOLDEN_DEPENDENCIES_golden_dockerize",
					label: "golden: dockerize",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:44.308Z",
					updated_at: "2026-02-06T16:36:50.754Z",
					markdown: [
						"# Event: Build Golden Image",
						"",
						"This event build a **golden image** to be used as base image when the project source image is created.",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The **golden image** was built by cloud servers without any problem.",
						"",
						"## Information",
						"**Product**: argentina-arcus",
						"**Commit**: 2c495a249aa028ebe91d3762c68d19febb352969",
						"**Environment**: staging",
						"**Docker Image**: us-east1-docker.pkg.dev/cencosudx/argentina-arcus/build/nodejs:a760fc3dc6c4894a03723b182b3fe309",
					].join("\n"),
				},
			],
		},
		{
			id: "GD",
			label: { es: "Imagen de proyectos", en: "", br: "" },
			state: "SUCCESS",
			created_at: "2026-02-06T16:36:56.328Z",
			updated_at: "2026-02-06T16:42:35.099Z",
			markdown: "",
			subevents: [
				{
					id: "BUILD_api_scheduler",
					label: "api: scheduler",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:56.328Z",
					updated_at: "2026-02-06T16:42:35.099Z",
					markdown: [
						"# Event: Build Api Image",
						"",
						"This event build a **api image** with argentina-arcus source code to be used in the deployment.",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The **api image** was built by cloud servers without any problem.",
						"",
						"## Information",
						"**Docker Image**: us-east1-docker.pkg.dev/cencosudx/argentina-arcus/app/scheduler/api:951b087d904481e8f8c0b82510b84504",
					].join("\n"),
				},
				{
					id: "BUILD_subscriber_storage-shelves",
					label: "subscriber: storage-shelves",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:56.33Z",
					updated_at: "2026-02-06T16:37:04.429Z",
					markdown: [
						"# Event: Build Subscriber Image",
						"",
						"This event build a **subscriber image** with argentina-arcus source code to be used in the deployment.",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The **subscriber image** was built by cloud servers without any problem.",
						"",
						"## Information",
						"**Docker Image**: us-east1-docker.pkg.dev/cencosudx/argentina-arcus/app/storage-shelves/subscriber:cc5abc119cb84eddbd732037a276698f",
					].join("\n"),
				},
			],
		},
		{
			id: "CI",
			label: { es: "Infraestructura", en: "", br: "" },
			state: "SUCCESS",
			created_at: "2026-02-06T16:36:44.304Z",
			updated_at: "2026-02-06T16:37:09.951Z",
			markdown: "",
			subevents: [
				{
					id: "CREATE_kafka_default",
					label: "kafka: default",
					state: "SUCCESS",
					created_at: "2026-02-06T16:36:44.308Z",
					updated_at: "2026-02-06T16:36:53.455Z",
					markdown: [
						"# Terraform: kafka",
						"",
						"This task create a **kafka** using Terraform technology and save the outputs in GCP Secret Manager.",
						"",
						"## Status: **SUCCESS**",
						"",
						"## Details",
						"",
						"The **kafka** was created successfully in cloud using terraform via Seki.",
						"",
						"## Information",
						"Terraform log available in Secret Manager",
					].join("\n"),
				},
			],
		},
	],
	git: {
		organization: "cencosud-xlab",
		product: "argentina-arcus",
		commit: "2c495a249aa028ebe91d3762c68d19febb352969",
		commit_message: "chore(re-deploy): redeploy the app",
		commit_author: "Yoan Perez",
		stage: "staging",
		event: "commit",
		ref: "2c495a249aa028ebe91d3762c68d19febb352969",
	},
};

const pipelineFailedReal: PipelineStatusResponse = {
	state: "FAILED",
	created_at: "2026-02-06T17:08:10.511Z",
	updated_at: "2026-02-06T17:15:42.987Z",
	events: [
		{
			id: "GD",
			label: { es: "Imagen de proyectos", en: "", br: "" },
			state: "FAILED",
			created_at: "2026-02-06T17:08:10.511Z",
			updated_at: "2026-02-06T17:12:40.400Z",
			markdown: "",
			subevents: [
				{
					id: "BUILD_api_users",
					label: "api: users",
					state: "FAILED",
					created_at: "2026-02-06T17:08:10.511Z",
					updated_at: "2026-02-06T17:12:40.400Z",
					markdown: [
						"# Event: Build Api Image",
						"",
						"This event build a **api image** with argentina-arcus source code to be used in the deployment.",
						"",
						"## Status: **FAIL**",
						"",
						"```terminal",
						"Error: npm run build salió con código 1",
						"```",
					].join("\n"),
				},
			],
		},
		{
			id: "CD",
			label: { es: "Despliegue", en: "", br: "" },
			state: "PENDING",
			created_at: "2026-02-06T17:12:45.000Z",
			updated_at: "2026-02-06T17:15:42.987Z",
			markdown: "",
			subevents: [
				{
					id: "DEPLOY_api_users",
					label: "api: users",
					state: "PENDING",
					created_at: "2026-02-06T17:12:45.000Z",
					updated_at: "2026-02-06T17:15:42.987Z",
					markdown: "",
				},
			],
		},
	],
	git: {
		organization: "cencosud-xlab",
		product: "argentina-arcus",
		commit: "4f7d9b08b10f322cb0fcfe66d655682ce428bc6c",
		commit_message: "feat: deploy argentina-arcus",
		commit_author: "Equipo Arcus",
		stage: "staging",
		event: "commit",
		ref: "4f7d9b08b10f322cb0fcfe66d655682ce428bc6c",
	},
};

function DeployCardDemo() {
	return (
		<div className="p-8 max-w-4xl mx-auto space-y-10">
			<h1 className="text-2xl font-bold mb-8">DeployStatusCard - Demo</h1>

			<div>
				<h2 className="text-sm text-muted-foreground mb-4">
					Staging - Deploying
				</h2>
				<DeployStatusCard
					org="cencosud-xlab"
					product="seki-web"
					stage="staging"
					events={mockEventsStaging}
				/>
			</div>

			<div>
				<h2 className="text-sm text-muted-foreground mb-4">
					Production - Ready
				</h2>
				<DeployStatusCard
					org="cencosud-xlab"
					product="seki-web"
					stage="production"
					events={mockEventsProd}
				/>
			</div>

			<div>
				<h2 className="text-sm text-muted-foreground mb-4">Failed Build</h2>
				<DeployStatusCard
					org="cencosud-xlab"
					product="seki-web"
					stage="staging"
					events={mockEventsFailed}
				/>
			</div>
			<div>
				<h2 className="text-sm text-muted-foreground mb-4">
					Completed with Warnings
				</h2>
				<DeployStatusCard
					org="cencosud-xlab"
					product="seki-web"
					stage="production"
					events={mockEventsWarn}
				/>
			</div>

			<div className="space-y-6">
				<h2 className="text-sm text-muted-foreground uppercase tracking-wide">
					Pipeline Monitor (datos reales)
				</h2>
				<DeployPipelineCard pipeline={pipelineWarnReal} stage="staging" />
				<DeployPipelineCard pipeline={pipelineFailedReal} stage="staging" />
			</div>
		</div>
	);
}
