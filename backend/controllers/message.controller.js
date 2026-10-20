import mongoose from "mongoose";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { unlink } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { basename, join } from "node:path";

const chatUploadDirectory = fileURLToPath(new URL("../uploads/chat-files/", import.meta.url));

const removeUploadedFile = async (file) => {
  if (!file) return;
  try {
    await unlink(file.path);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
};

export const getInbox = async (req, res) => {
  try {
    const currentUserId = new mongoose.Types.ObjectId(req.userId);
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: currentUserId }, { recipient: currentUserId }],
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", currentUserId] }, "$recipient", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", currentUserId] },
                    { $eq: [{ $ifNull: ["$readAt", null] }, null] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    return res.status(200).json({
      conversations: conversations.map(({ _id, lastMessage, unreadCount }) => ({
        userId: String(_id),
        lastMessage,
        unreadCount,
      })),
    });
  } catch (error) {
    return res.status(500).json({ message: `Unable to load inbox: ${error.message}` });
  }
};

export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: userId },
        { sender: userId, recipient: req.userId },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();

    await Message.updateMany(
      { sender: userId, recipient: req.userId, readAt: null },
      { $set: { readAt: new Date() } }
    );

    return res.status(200).json({ messages: messages.reverse() });
  } catch (error) {
    return res.status(500).json({ message: `Unable to load conversation: ${error.message}` });
  }
};

export const markConversationRead = async (req, res) => {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    return res.status(400).json({ message: "Invalid user id" });
  }

  try {
    const result = await Message.updateMany(
      { sender: userId, recipient: req.userId, readAt: null },
      { $set: { readAt: new Date() } }
    );
    return res.status(200).json({ modifiedCount: result.modifiedCount });
  } catch (error) {
    return res.status(500).json({ message: `Unable to mark messages as read: ${error.message}` });
  }
};

export const getChatAttachment = async (req, res) => {
  const { filename } = req.params;
  if (!/^[a-f\d-]{36}\.(jpg|png|webp|pdf|txt|doc|docx|xls|xlsx|ppt|pptx)$/i.test(filename)) {
    return res.status(404).json({ message: "Attachment not found" });
  }

  try {
    const attachmentUrl = `/api/messages/files/${basename(filename)}`;
    const message = await Message.findOne({
      "attachment.url": attachmentUrl,
      $or: [{ sender: req.userId }, { recipient: req.userId }],
    }).select("attachment");

    if (!message) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    const filePath = join(chatUploadDirectory, filename);
    const isImage = message.attachment.mimeType?.startsWith("image/");
    const onSendError = (error) => {
      if (error && !res.headersSent) {
        return res.status(404).json({ message: "Attachment not found" });
      }
    };
    if (!isImage) {
      const downloadName = basename(String(message.attachment.originalName || "attachment").replaceAll("\\", "/"))
        .replace(/[\r\n"]/g, "_") || "attachment";
      return res.download(filePath, downloadName, onSendError);
    }

    return res.sendFile(filePath, onSendError);
  } catch (error) {
    return res.status(500).json({ message: `Unable to load attachment: ${error.message}` });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { recipientId, text } = req.body || {};
    const messageText = typeof text === "string" ? text.trim() : "";

    if (!mongoose.isValidObjectId(recipientId)) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: "A valid recipient is required" });
    }

    if ((!messageText && !req.file) || messageText.length > 4000) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: "Message must be between 1 and 4000 characters" });
    }

    if (recipientId === String(req.userId)) {
      await removeUploadedFile(req.file);
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

    const recipientExists = await User.exists({ _id: recipientId });
    if (!recipientExists) {
      await removeUploadedFile(req.file);
      return res.status(404).json({ message: "Recipient not found" });
    }

    const messageData = {
      sender: req.userId,
      recipient: recipientId,
      text: messageText,
    };
    if (req.file) {
      messageData.attachment = {
        url: `/api/messages/files/${req.file.filename}`,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      };
    }

    const message = await Message.create(messageData);

    const serializedMessage = message.toObject();
    req.app.get("io").to(recipientId).emit("message:new", serializedMessage);

    return res.status(201).json({ message: serializedMessage });
  } catch (error) {
    try {
      await removeUploadedFile(req.file);
    } catch (cleanupError) {
      console.error("Unable to clean up chat attachment:", cleanupError);
    }
    return res.status(500).json({ message: `Unable to send message: ${error.message}` });
  }
};
