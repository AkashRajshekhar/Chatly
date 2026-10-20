import express from "express"
import { getCurrentUser, getUsers, updateCurrentUser } from "../controllers/user.controller.js";
import isAuth from "../middlewares/isAuth.js";
import uploadProfileImage from "../middlewares/profileImageUpload.js";

const userRouter = express.Router(); 


userRouter.get("/current" , isAuth ,getCurrentUser )
userRouter.patch("/current", isAuth, uploadProfileImage, updateCurrentUser)
userRouter.get("/", isAuth, getUsers)

export default userRouter; 