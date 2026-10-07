import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import env from "./config/env.js";
import { UPLOAD_DIR } from "./controllers/uploads.controller.js";
import sendResponse from "./helpers/sendResponse.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import notFoundMiddleware from "./middlewares/notFound.middleware.js";
import apiRoutes from "./routes/index.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(
  cors({
    origin: env.frontendOrigins,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan(env.nodeEnv === "production" ? "combined" : "dev"));

app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "30d", immutable: true }));

app.get("/health", (_req, res) => {
  return sendResponse(res, { message: "Backend is healthy", data: { uptime: process.uptime() } });
});

app.use("/api", apiRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
