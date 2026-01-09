import { defineConfig } from "@trigger.dev/sdk/v3";

export default defineConfig({
  project: "trigger-stream-stringify-example",
  runtime: "node",
  logLevel: "log",
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 1,
    },
  },
  maxDuration: 120,
  dirs: ["./src"],
});
