import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// /api/my/user

// Endpoint to get the current logged-in user
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser);

// Endpoint to create the user
router.post("/", jwtCheck, jwtParse, MyUserController.createCurrentUser);

// Endpoint to update the user
router.put(
  "/",
  validateMyUserRequest,
  jwtCheck,
  jwtParse,
  MyUserController.updateCurrentUser
);

export default router;
