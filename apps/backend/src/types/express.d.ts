import * as express from "express";
import { UserType } from "./user";

declare global{
  namespace Express {
    interface Request {
      user?: UserType;
    }
  }
}