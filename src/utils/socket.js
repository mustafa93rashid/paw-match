const { Server } = require("socket.io");

let io;
// خريطة لربط الـ UserID بالـ SocketID
const userSocketMap = new Map(); 

const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*" } // يمكنك تحديد النطاق الخاص بك لاحقاً للأمان
  });

  io.on("connection", (socket) => {
    // استقبال معرف المستخدم عند اتصال العميل
    const userId = socket.handshake.query.userId;
    if (userId) {
      userSocketMap.set(userId, socket.id);
    }

    socket.on("disconnect", () => {
      if (userId) userSocketMap.delete(userId);
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error("Socket.io لم يتم تهيئته بعد!");
  return io;
};

const getSocketId = (userId) => userSocketMap.get(userId);

module.exports = { initSocket, getIo, getSocketId };