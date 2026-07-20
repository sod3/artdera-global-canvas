// Vite's React transform reads NODE_ENV while it creates both the client and
// React-server bundles. A development value during `vite build` emits jsxDEV,
// which is intentionally unavailable from React's production server runtime.
// Pin the build process to production even if a hosting dashboard inherited a
// local NODE_ENV value.
process.env.NODE_ENV = "production";

const { build } = await import("vite");

await build({ mode: "production" });
