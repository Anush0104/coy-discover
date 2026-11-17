
import { build } from "esbuild";
import { readFile, mkdir, writeFile } from "fs/promises";

const envFile = await readFile(".env", "utf8").catch(() => "");
const envMatch = envFile.match(/^VITE_API_URL=(.*)$/m);

const apiUrl =
  process.env.VITE_API_URL ||
  envMatch?.[1]?.trim().replace(/^["']|["']$/g, "") ||
  "";

await mkdir("dist", { recursive: true });

await build({
  entryPoints: ["src/main.jsx"],
  bundle: true,
  outfile: "dist/app.js",
  platform: "browser",
  format: "esm",
  jsx: "automatic",
  minify: true,
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

await writeFile("dist/index.html", `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Coy Discover</title>
  <link rel="stylesheet" href="/app.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/app.js"></script>
</body>
</html>
`);

console.log("Production build completed successfully!");

