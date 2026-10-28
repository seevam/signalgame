import express from "express";
import fs from "fs";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Serve static files from dist/public in production
  const staticPath =
    process.env.NODE_ENV === "production"
      ? path.resolve(__dirname, "public")
      : path.resolve(__dirname, "..", "dist", "public");

  const indexHtml = path.join(staticPath, "index.html");
  if (!fs.existsSync(indexHtml)) {
    console.warn(`Warning: ${indexHtml} not found. Run "pnpm build" before starting the server.`);
  }

  app.use(express.static(staticPath));

  // The game is a single page at "/" whose asset URLs are relative (so the same build also runs from a
  // subfolder, e.g. on itch.io). Serving index.html at a nested path would make those URLs resolve under
  // it and load HTML in place of the scripts, so send unknown pages back to the root, keeping ?stage=…
  // A request for a missing file gets a 404 rather than the page.
  app.get("*", (req, res) => {
    if (path.extname(req.path)) {
      res.status(404).end();
      return;
    }
    // express.static already serves "/" when the build exists, so reaching here at "/" means it doesn't.
    // Redirecting "/" to itself would loop forever.
    if (req.path === "/") {
      res.status(404).type("text/plain").send(`Game files not found in ${staticPath}. Run "pnpm build" first.`);
      return;
    }
    const queryStart = req.originalUrl.indexOf("?");
    res.redirect(302, `/${queryStart >= 0 ? req.originalUrl.slice(queryStart) : ""}`);
  });

  const port = process.env.PORT || 3000;

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
