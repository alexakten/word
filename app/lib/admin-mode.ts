export function isAdminMode() {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname.toLowerCase();
  return host === "admin.spellsurf.com"
    || host === "admin.localhost"
    || window.location.pathname === "/admin";
}
