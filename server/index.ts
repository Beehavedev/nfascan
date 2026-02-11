import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { runInitialSync, startPeriodicSync } from "./sync";
import { syncBap578Agents } from "./bap578-sync";
import { storage } from "./storage";

const app = express();
const httpServer = createServer(app);
const apiRateLimitWindowMs = 60_000;
const apiRateLimitMax = 120;
const apiRateLimitStore = new Map<string, { count: number; resetAt: number }>();

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  if (!req.path.startsWith("/api")) return next();

  const now = Date.now();
  const forwardedFor = req.headers["x-forwarded-for"];
  const clientIp = typeof forwardedFor === "string"
    ? forwardedFor.split(",")[0].trim()
    : req.ip || req.socket.remoteAddress || "unknown";
  const entry = apiRateLimitStore.get(clientIp);

  if (!entry || entry.resetAt <= now) {
    apiRateLimitStore.set(clientIp, { count: 1, resetAt: now + apiRateLimitWindowMs });
    res.setHeader("X-RateLimit-Limit", apiRateLimitMax.toString());
    res.setHeader("X-RateLimit-Remaining", (apiRateLimitMax - 1).toString());
    return next();
  }

  entry.count += 1;
  apiRateLimitStore.set(clientIp, entry);

  const remaining = Math.max(0, apiRateLimitMax - entry.count);
  res.setHeader("X-RateLimit-Limit", apiRateLimitMax.toString());
  res.setHeader("X-RateLimit-Remaining", remaining.toString());
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000).toString());

  if (entry.count > apiRateLimitMax) {
    return res.status(429).json({ message: "Rate limit exceeded. Try again shortly." });
  }

  return next();
});

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );

  const lastSynced = await storage.getLastSyncedBlock();
  if (lastSynced === 0) {
    log("No data found. Clearing old seed data and starting live BSC sync...", "sync");
    await storage.clearAllData();
  }

  runInitialSync().then(async () => {
    startPeriodicSync();
    try {
      await syncBap578Agents();
      log("BAP-578 agent discovery complete", "sync");
    } catch (err: any) {
      console.error("BAP-578 sync failed:", err.message);
    }
  }).catch((err) => {
    console.error("Initial sync failed:", err);
    startPeriodicSync();
  });
})();
