import express, { Application } from "express";
import cors from "cors";
import morgan from "morgan";

const middleware = (app: Application) => {
  app.use(morgan("dev"));
  app.use( cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:8002",
      "http://127.0.0.1:3000",
    ],
    credentials: true,
  }));
  app.use(express.json());
};

export default middleware;
