import express from "express";
import MyUserController from "../controllers/MyUserController";
import { jwtCheck, jwtParse, /* jwtParse */ } from "../middleware/auth";
import { validateMyUserRequest } from "../middleware/validation";

const router = express.Router();

// /api/my/user

//EndPoint to get the current logged in user
router.get("/", jwtCheck, jwtParse, MyUserController.getCurrentUser);

//EndPoint to create the user
router.post("/",jwtCheck, MyUserController.createCurrentUser);

//EndPoint to update the user
router.put(
  "/",
  jwtCheck,
  jwtParse,
  validateMyUserRequest,
  MyUserController.updateCurrentUser
); 

export default router;
