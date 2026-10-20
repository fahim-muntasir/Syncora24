import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";
import cookieParser from "cookie-parser";

const middleware = (app: Application) => {
  const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS ?? "0");
  if (
    !Number.isSafeInteger(trustProxyHops) ||
    trustProxyHops < 0 ||
    trustProxyHops > 10
  ) {
    throw new Error("TRUST_PROXY_HOPS must be an integer between 0 and 10.");
  }
  app.set("trust proxy", trustProxyHops);
  app.use(cookieParser());
  app.use(morgan("dev"));
  app.use( cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8002",
      "http://127.0.0.1:3000",
      "https://syncora24-frontend.vercel.app",
    ],
    credentials: true,
  }));
  app.use(express.json());
};

export default middleware;
