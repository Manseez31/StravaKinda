import { fork } from "node:child_process";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const server = fork("scripts/preview-server.mjs", [], { silent: true });
let started = false;
server.stderr.pipe(process.stderr);
server.stdout.on("data", (chunk) => {
  if (started || !chunk.toString().includes("Preview:")) return;
  started = true;
  const tests = fork(require.resolve("@playwright/test/cli"), ["test"], {
    stdio: "inherit",
  });
  tests.on("exit", (code) => {
    server.kill();
    process.exitCode = code ?? 1;
  });
  tests.on("error", (error) => {
    process.stderr.write(String(error));
    server.kill();
    process.exitCode = 1;
  });
});
server.on("exit", (code) => {
  if (!started && code) process.exitCode = code;
});
process.on("SIGINT", () => {
  server.kill();
  process.exit(130);
});
