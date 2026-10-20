import express from "express";
import { getChatAttachment, getConversation, getInbox, markConversationRead, sendMessage } from "../controllers/message.controller.js";
import isAuth from "../middlewares/isAuth.js";
import uploadChatFile from "../middlewares/chatFileUpload.js";

const messageRouter = express.Router();

messageRouter.use(isAuth);
messageRouter.get("/inbox", getInbox);
messageRouter.get("/files/:filename", getChatAttachment);
messageRouter.patch("/:userId/read", markConversationRead);
messageRouter.get("/:userId", getConversation);
messageRouter.post("/", uploadChatFile, sendMessage);

export default messageRouter;
