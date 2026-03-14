// This file is a dev placeholder. In Docker it is overwritten at startup
// by docker-entrypoint.sh with the real API_BASE_URL.
// For local dev, set VITE_API_BASE_URL in admin-portal/.env.local instead.
window.__ENV__ = { "API_BASE_URL": "" };
