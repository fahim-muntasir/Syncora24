import dotenv from "dotenv";
dotenv.config();
import express from "express";
import middleware from "../middleware";
import routes from "../routes";
import { globalErrorHandler, notFountError } from "./errors";

const app = express();

middleware(app);

// api routes
app.use("/api", routes);

// error handler
app.use(notFountError);
app.use(globalErrorHandler);

export default app;
