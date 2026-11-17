
import { build } from "esbuild";
import { createServer } from "http";
import { readFile } from "fs/promises";

const envFile = await readFile(".env", "utf8").catch(() => "");

const envMatch = envFile.match(/^VITE_API_URL=(.*)$/m);

const apiUrl =
  process.env.VITE_API_URL ||
  envMatch?.[1]?.trim().replace(/^["']|["']$/g, "") ||
  "";

const port = 5173;

await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  outfile: "dist/app.js",
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  sourcemap: true,
  define: {
  "import.meta.env.VITE_API_URL": JSON.stringify(apiUrl)
},
  loader: {
  ".jsx": "jsx",
  ".js": "js",
  ".css": "css",
  ".svg": "dataurl",
  ".png": "dataurl",
  ".jpg": "dataurl",
  ".jpeg": "dataurl",
  ".webp": "dataurl"
}
});

const server = createServer(async (req, res) => {
  try {
    if (req.url === "/app.js") {
      res.setHeader("Content-Type", "application/javascript");
      res.end(await readFile("dist/app.js"));
      return;
    }

    if (req.url === "/app.css") {
      res.setHeader("Content-Type", "text/css");
      res.end(await readFile("dist/app.css"));
      return;
    }

    res.setHeader("Content-Type", "text/html");
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>Coy Discover</title>
          <link rel="stylesheet" href="/app.css">
        </head>
        <body>
          <div id="root"></div>
          <script type="module" src="/app.js"></script>
        </body>
      </html>
    `);
  } catch {
    res.statusCode = 500;
    res.end("Server error");
  }
});

server.listen(port, () => {
  console.log(`App running at http://localhost:${port}`);
});
