import type { ApiHealth } from "../../lib/types";

export function ApiHealthStatus({ health }: { health: ApiHealth }) {
  if (health === "online") return null;
  return (
    <p className="api-health-status" aria-live="polite">
      <span className="api-health-dot" aria-hidden="true" />
      <span>Offline</span>
    </p>
  );
}
