import { spawn, type ChildProcess } from "child_process";
import http from "http";

/**
 * Wait for the dev server to respond to HTTP requests.
 */
function waitForServer(port: number, timeoutMs = 60_000): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const check = () => {
      const req = http.get(`http://localhost:${port}`, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Dev server did not start within ${timeoutMs}ms`));
        } else {
          setTimeout(check, 500);
        }
      });
      req.end();
    };

    check();
  });
}

/**
 * Start the Next.js dev server on the given port.
 * Returns the child process (call .kill() when done).
 */
export async function startDevServer(
  port: number,
  cwd: string
): Promise<ChildProcess> {
  const devServer = spawn("npx", ["next", "dev", "-p", String(port)], {
    cwd,
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, NODE_ENV: "development" },
  });

  // Capture output for debugging
  devServer.stdout?.on("data", () => {});
  devServer.stderr?.on("data", () => {});

  await waitForServer(port);
  return devServer;
}
