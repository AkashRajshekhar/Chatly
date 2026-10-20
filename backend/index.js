
import express from "express";
import dotenv from "dotenv";
import connectToDb from "./config/db.js";
import authRouter from "./routes/auth.routes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import userRouter from "./routes/user.routes.js";
import messageRouter from "./routes/message.routes.js";
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { Server } from "socket.io";
import configureSocket from "./socket.js";

dotenv.config();

const port = process.env.PORT || 5000;

const profileImagesDirectory = fileURLToPath(
  new URL("./uploads/profile-images/", import.meta.url)
);

const app = express();
const server = createServer(app);

const frontendUrl = "https://chatly-1-dqsq.onrender.com";

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

const io = new Server(server, {
  cors: {
    origin: frontendUrl,
    credentials: true,
  },
});

app.set("io", io);
configureSocket(io);

app.use(express.json());
app.use(cookieParser());

app.use(
  "/uploads/profile-images",
  express.static(profileImagesDirectory)
);

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/messages", messageRouter);

server.listen(port, () => {
  connectToDb();
  console.log(`server started on ${port}`);
});
