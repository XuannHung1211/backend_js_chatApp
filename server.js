import express from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import ConnectDB from './db/db.js'
import authRouter from "./router/authRouter.js"
import friendRouter from './router/friendRouter.js'
import userRouter from './router/userRouter.js'
import authMiddleware from './middlewares/authMiddlewares.js'
import messageRouter from './router/messageRouter.js'
import conversationRouter from './router/conversationRouter.js'
import checkCookieRouter from './router/checkCookieRouter.js'
import cookieParser from 'cookie-parser'
import { createServer } from "http"
import { Server } from "socket.io"
import { socketMiddlewareIo } from './middlewares/socketMiddleware.js'
import User from "./model/user.js"

dotenv.config()
const app = express()

app.use(cors({ origin: "http://localhost:3000", credentials: true }))
app.use(cookieParser())
app.use(express.json())

app.use("/api/auth", authRouter)
app.use("/api/friend", authMiddleware, friendRouter)
app.use("/api/users", userRouter)
app.use("/api/message", authMiddleware, messageRouter)
app.use("/api/conversation", authMiddleware, conversationRouter)
app.use("/api", checkCookieRouter)

const server = createServer(app)
const io = new Server(server, {
  cors: { origin: "http://localhost:3000", credentials: true }
})

io.use(socketMiddlewareIo)

io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id)

  // 1. Khi FE mở chat, bắt buộc phải Join Room
  socket.on("join-conversation", (conversationId) => {
    socket.join(conversationId)
  })

  // 2. Sửa lại event "send-messsage-to-friend" của bạn
  socket.on("send-messsage-to-friend", (data) => {
    // Lấy đúng dữ liệu bạn gửi từ FooterWindowChat
    const { conversationId, content, tempId , displayName } = data

   

    const fullMessage = {
      _id: Date.now().toString(), // Tạm thời dùng ID này, thực tế sẽ lấy từ DB
      conversationId,
      content,
      senderId: socket.userId,
      createdAt: new Date(),
      temp: false,
      tempId: tempId ,
      displayName :displayName
      // Gửi lại để FE xóa tin nhắn tạm
    }

    console.log(socket.userId)
   
    // Gửi cho người khác trong phòng
    socket.to(conversationId).emit("receive-message", fullMessage)
  })

  socket.on("disconnect", () => {
    console.log("❌ User disconnected")
  })
})

const PORT = process.env.PORT || 5001
server.listen(PORT, () => {
  ConnectDB()
  console.log("🚀 Server running on", PORT)
})