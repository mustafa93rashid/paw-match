const { Server } = require("socket.io");

const jwtService = require("../utils/jwtService");

let io;

/*
|--------------------------------------------------------------------------
| Socket.IO Configuration
|--------------------------------------------------------------------------
*/

// ==================================================
// Initialize Socket Server
// ==================================================
const initializeSocket = (httpServer) => {
  // • Creates the Socket.IO server.
  // • Authenticates every socket connection.
  // • Places every connected user in a private room.
  // ==================================================

  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // Authenticate socket connections before allowing
  // the client to join a private user room.
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization
          ?.replace(/^Bearer\s+/i, "")
          .trim();

      if (!token) {
        return next(new Error("Authentication token is required"));
      }

      const decoded = jwtService.verifyAccessToken(token);

      if (!decoded?.id) {
        return next(new Error("Invalid authentication token"));
      }

      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };

      next();
    } catch (error) {
      next(new Error("Invalid or expired authentication token"));
    }
  });

  io.on("connection", (socket) => {
    const userRoom = `user:${socket.user.id}`;

    // Join a private room that belongs only
    // to the authenticated user.
    socket.join(userRoom);

    socket.emit("socket:connected", {
      success: true,
      message: "Socket connected successfully",
    });

    socket.on("disconnect", () => {
      // Socket.IO automatically removes the socket
      // from all rooms after disconnection.
    });
  });

  return io;
};

// ==================================================
// Get Socket Server
// ==================================================
const getIO = () => {
  // • Returns the initialized Socket.IO instance.
  // • Prevents using Socket.IO before initialization.
  // ==================================================

  if (!io) {
    throw new Error("Socket.IO has not been initialized");
  }

  return io;
};

module.exports = {
  initializeSocket,
  getIO,
};
