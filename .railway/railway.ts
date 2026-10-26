import { defineRailway, github, preserve, project, service } from "railway/iac";

// Equivalent of the root railway.toml (builder nixpacks, healthcheck /api/health),
// plus the live service's existing source and variables so `railway config plan`
// shows no changes. Variables use preserve(): Railway keeps the values it holds,
// so no secret is stored in this file.
// Run the plan with the SDK installed untracked: `npm install --no-save railway`.
export const partial = "Continuum";

const preservedVariables = [
  "AWS_ACCESS_KEY_ID",
  "AWS_BUCKET_NAME",
  "AWS_ENDPOINT_URL",
  "AWS_REGION_NAME",
  "AWS_SECRET_ACCESS_KEY",
  "DATABASE_URL",
  "ENCRYPTION_KEY",
  "NIXPACKS_NODE_VERSION",
  "NIXPACKS_PROVIDERS",
  "OPENROUTER_API_KEY",
  "POSTMARK_WEBHOOK_SECRET",
  "PYTHONPATH",
  "S3_ENABLED",
  "VITE_OPENROUTER_API_KEY",
];

export default defineRailway(() => {
  const Continuum = service("Continuum", {
    source: github("jonathanhollander/Continuum", { checkSuites: true }),
    build: { builder: "NIXPACKS" },
    deploy: { healthcheckPath: "/api/health", sleepApplication: true },
    variables: Object.fromEntries(preservedVariables.map((name) => [name, preserve()])),
  });
  return project("continuum-saas", {
    resources: [Continuum],
  });
});
