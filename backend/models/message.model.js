import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: {
      type: String,
      default: "",
      trim: true,
      maxlength: 4000,
    },
    attachment: {
      url: { type: String },
      originalName: { type: String },
      mimeType: { type: String },
      size: { type: Number },
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
messageSchema.index({ recipient: 1, readAt: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);

export default Message;
