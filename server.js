import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { createServer } from "http"
import { Server } from "socket.io"

import ConnectDB from './db/db.js'
import User from "./model/user.js"

// Route Imports
import authRouter from "./router/authRouter.js"
import friendRouter from './router/friendRouter.js'
import userRouter from './router/userRouter.js'
import messageRouter from './router/messageRouter.js'
import conversationRouter from './router/conversationRouter.js'
import checkCookieRouter from './router/checkCookieRouter.js'
import groupRouter from './router/groupRouter.js' // << ĐÃ SỬA: Import đúng file

import authMiddleware from './middlewares/authMiddlewares.js'
import { socketMiddlewareIo } from './middlewares/socketMiddleware.js'

dotenv.config()
const app = express()
const server = createServer(app)

// 1. Khởi tạo Socket.io
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true
  }
})

// 2. Middleware cơ bản
app.use(cors({
  origin: "http://localhost:3000",
  credentials: true
}))
app.use(cookieParser())
app.use(express.json())

// 3. QUAN TRỌNG: Gắn io vào req TRƯỚC khi định nghĩa routes
app.use((req, res, next) => {
  req.io = io;
  next();
});

// 4. Định nghĩa Routes
app.use("/api/auth", authRouter)
app.use("/api/friend", authMiddleware, friendRouter)
app.use("/api/users", userRouter)
app.use("/api/message", authMiddleware, messageRouter)
app.use("/api/conversation", authMiddleware, conversationRouter)
app.use("/api/group", authMiddleware, groupRouter) // << Đã có authMiddleware
app.use("/api", checkCookieRouter)

// 5. Logic Socket.io
io.use(socketMiddlewareIo)

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id)
  
  socket.join(socket.userId)

  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId)
  })

  socket.on("send-message", async (data) => {
    const { conversationId, content, tempId } = data
    const user = await User.findById(socket.userId).select("_id displayName avatarUrl username")

    const fullMessage = {
      _id: Date.now().toString(),
      conversationId,
      content,
      senderId: socket.userId,
      createdAt: new Date(),
      temp: false,
      tempId,
      senderInfor: {
        _id: user._id,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        username: user.username
      }
    }

    io.to(conversationId).emit("receive-message", fullMessage)
    io.to(conversationId).emit("last-message", { conversationId, message: fullMessage })
  })

  // Các event friend request giữ nguyên...
  socket.on("disconnect", () => console.log("❌ User disconnected"))
})

const PORT = process.env.PORT || 5001
server.listen(PORT, () => {
  ConnectDB()
  console.log("🚀 Server running on", PORT)
})