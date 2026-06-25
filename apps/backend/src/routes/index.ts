import { Router, Request, Response } from "express";
const router = Router();

// middleware import
import { auth } from "../middleware/auth";

// controller import
import { signUpController, signInController } from "../api/v1/auth";

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

router.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({
    health: "Ok",
    msg: "Hello world! This is new text!",
  });
});

// aut route SignIn and SignUp
router.route("/v1/auth/signup").post(signUpController);
router.route("/v1/auth/signin").post(signInController);

// routes for rooms
router
  .route("/v1/rooms")
  .get(getRoomsController)
  .post(auth, createRoomController);
router.route("/v1/rooms/:roomId").get(auth, getSingleRoomController);
router.route("/v1/rooms/:roomId/members/add").post(auth, addMembersController);
router
  .route("/v1/rooms/:roomId/members/remove")
  .post(auth, removeMembersController);

// routes for room chats
router.route("/v1/rooms/:roomId/chat").post(auth, createChatController);

export default router;
