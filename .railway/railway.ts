import { defineRailway, github, preserve, project, service, volume } from "railway/iac";

// Equivalent of the root railway.toml (builder nixpacks, healthcheck /api/health),
// plus the live service's existing source and variables so `railway config plan`
// retains every currently configured service variable. Railway keeps their values,
// so no secret is stored in this file.
// Install the SDK outside application dependencies; review a fresh pinned plan before apply.
export const partial = "Continuum";

const preservedVariables = [
  "API_URL",
  "AWS_ACCESS_KEY_ID",
  "AWS_BUCKET_NAME",
  "AWS_ENDPOINT_URL",
  "AWS_REGION_NAME",
  "AWS_SECRET_ACCESS_KEY",
  "BIFROST_BASE_URL",
  "BIFROST_VIRTUAL_KEY",
  "CORS_ORIGINS",
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  "ENVIRONMENT",
  "FRONTEND_URL",
  "JWT_SECRET_KEY",
  "NIXPACKS_NODE_VERSION",
  "NIXPACKS_PROVIDERS",
  "OPENROUTER_API_KEY",
  "ORIGIN",
  "POSTMARK_WEBHOOK_SECRET",
  "PRIVATE_ACCESS_USER_ID",
  "PYTHONPATH",
  "RP_ID",
  "S3_ENABLED",
  "SECRET_KEY",
  "UPLOAD_DIR",
  "VITE_OPENROUTER_API_KEY",
];

export default defineRailway(() => {
  const Continuum = service("Continuum", {
    source: github("jonathanhollander/Continuum", { checkSuites: true }),
    build: { builder: "NIXPACKS" },
    deploy: { healthcheckPath: "/api/health", sleepApplication: true },
    volumeMounts: { "/data": volume("continuum-volume") },
    variables: Object.fromEntries(preservedVariables.map((name) => [name, preserve()])),
  });
  return project("continuum-saas", {
    resources: [Continuum],
  });
});
