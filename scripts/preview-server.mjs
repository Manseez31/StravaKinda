import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
const root = path.resolve("dist");
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".json": "application/json",
};
http
  .createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
      let filename = path.resolve(root, "." + pathname);
      if (filename !== root && !filename.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      if (!path.extname(filename)) filename = path.join(root, "index.html");
      const body = await readFile(filename);
      res.writeHead(200, {
        "Content-Type":
          mime[path.extname(filename)] ?? "application/octet-stream",
      });
      res.end(body);
    } catch {
      res.writeHead(404).end("Not found");
    }
  })
  .listen(4173, "127.0.0.1", () =>
    process.stdout.write("Preview: http://127.0.0.1:4173\n"),
  );
