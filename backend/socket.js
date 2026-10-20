import jwt from "jsonwebtoken";

const onlineConnections = new Map();

const getUserIdFromCookie = (cookieHeader) => {
  const tokenCookie = cookieHeader
    ?.split(";")
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith("token="));

  if (!tokenCookie) {
    return null;
  }

  const token = decodeURIComponent(tokenCookie.slice("token=".length));
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  return decoded.id || decoded.userId || null;
};

const publishOnlineUsers = (io) => {
  io.emit("presence:update", Array.from(onlineConnections.keys()));
};

const configureSocket = (io) => {
  io.use((socket, next) => {
    try {
      const userId = getUserIdFromCookie(socket.handshake.headers.cookie);
      if (!userId) {
        return next(new Error("Unauthorized"));
      }

      socket.data.userId = String(userId);
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId;
    const connectionCount = onlineConnections.get(userId) || 0;
    onlineConnections.set(userId, connectionCount + 1);
    socket.join(userId);
    socket.emit("presence:update", Array.from(onlineConnections.keys()));

    if (connectionCount === 0) {
      publishOnlineUsers(io);
    }

    socket.on("disconnect", () => {
      const remainingConnections = (onlineConnections.get(userId) || 1) - 1;
      if (remainingConnections <= 0) {
        onlineConnections.delete(userId);
        publishOnlineUsers(io);
      } else {
        onlineConnections.set(userId, remainingConnections);
      }
    });
  });
};

export default configureSocket;
