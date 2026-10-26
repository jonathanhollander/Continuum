import { defineRailway, project, service } from "railway/iac";

// Equivalent of the root railway.toml (builder nixpacks, healthcheck /api/health).
// Generated from `railway config migrate --service Continuum` (dry-run output).
export const partial = "Continuum";

export default defineRailway(() => {
  const Continuum = service("Continuum", {
    healthcheck: "/api/health",
    // builder from CaC: "nixpacks"
  });
  return project("continuum-saas", {
    resources: [Continuum],
  });
});
