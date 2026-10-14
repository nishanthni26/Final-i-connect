import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { generateCleanDeviceCopy } from "../contentEngine";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

async function startServer() {
  const app = express();
  app.set("trust proxy", 1);
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.post("/api/content/generate-clean-copy", async (req, res) => {
    try {
      const { deviceBrand, deviceModel, conditionScore, spec, branch } = req.body ?? {};
      if (!deviceBrand || !deviceModel) {
        return res.status(400).json({
          success: false,
          error: "Missing required properties: deviceBrand and deviceModel.",
        });
      }
      const result = await generateCleanDeviceCopy({
        deviceBrand: String(deviceBrand),
        deviceModel: String(deviceModel),
        conditionScore: conditionScore ? String(conditionScore) : "Excellent",
        spec: spec ? String(spec) : "",
        branch: branch ? String(branch) : "RT Nagar",
      });
      return res.status(200).json({
        success: true,
        cleanCopy: result.cleanCopy,
        whatsappUrl: result.whatsappUrl,
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        error: err instanceof Error ? err.message : "Failed to generate store copy.",
      });
    }
  });
  app.get("/robots.txt", (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
    res
      .type("text/plain")
      .send(
        [
          "User-agent: *",
          "Allow: /",
          "Allow: /shop",
          "Allow: /sell",
          "Allow: /repair",
          "Allow: /track",
          "Disallow: /admin",
          "Disallow: /api/",
          "",
          `Sitemap: ${baseUrl}/sitemap.xml`,
        ].join("\n")
      );
  });
  app.get("/sitemap.xml", (req, res) => {
    const baseUrl = (process.env.APP_URL || `${req.protocol}://${req.get("host")}`).replace(/\/+$/, "");
    const today = new Date().toISOString().split("T")[0];
    const routes = [
      { path: "/", priority: "1.0", changefreq: "daily" },
      { path: "/shop", priority: "0.9", changefreq: "daily" },
      { path: "/sell", priority: "0.8", changefreq: "weekly" },
      { path: "/repair", priority: "0.8", changefreq: "weekly" },
      { path: "/track", priority: "0.6", changefreq: "weekly" },
    ];
    const xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
      ...routes.map(
        r =>
          `  <url><loc>${baseUrl}${r.path}</loc><lastmod>${today}</lastmod><changefreq>${r.changefreq}</changefreq><priority>${r.priority}</priority></url>`
      ),
      "</urlset>",
    ].join("\n");
    res.type("application/xml").send(xml);
  });
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });
  registerOAuthRoutes(app);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => { console.error("Server failed:", error.message); process.exit(1); });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => { console.error(error); process.exit(1); });
