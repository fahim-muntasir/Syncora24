import { Router, Request, Response } from "express";
const router = Router();

// controller import
import {
  signUpController,
  signInController,
  refreshTokenController,
  logoutController,
} from "../api/v1/auth";

// rooms controller import
import {
  getRoomsController,
  createRoomController,
  addMembersController,
  getSingleRoomController,
  removeMembersController,
} from "../api/v1/room";

// room chats controller import
import { createChatController } from "../api/v1/chat";

import { getIceServersController } from "../api/v1/webrtc";

// middleware import
import { auth } from "../middleware/auth";
import {
  createRoomRateLimit,
  httpChatRateLimit,
  refreshRateLimit,
  roomMutationRateLimit,
  signInRateLimit,
  signUpRateLimit,
} from "../middleware/rateLimits";

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    health: "Ok",
    msg: "Hello world! This is new text!",
  });
});

// aut route SignIn and SignUp
router.route("/v1/auth/signup").post(signUpRateLimit, signUpController);
router.route("/v1/auth/signin").post(signInRateLimit, signInController);
router.route("/v1/auth/refresh").post(refreshRateLimit, refreshTokenController);
router.route("/v1/auth/logout").post(logoutController);

// routes for rooms
router
  .route("/v1/rooms")
  .get(getRoomsController)
  .post(auth, createRoomRateLimit, createRoomController);
router.route("/v1/rooms/:roomId").get(auth, getSingleRoomController);
router
  .route("/v1/rooms/:roomId/members/add")
  .post(auth, roomMutationRateLimit, addMembersController);
router
  .route("/v1/rooms/:roomId/members/remove")
  .post(auth, roomMutationRateLimit, removeMembersController);

// routes for room chats
router
  .route("/v1/rooms/:roomId/chat")
  .post(auth, httpChatRateLimit, createChatController);

router.route("/v1/webrtc/ice-servers").get(auth, getIceServersController);

export default router;
