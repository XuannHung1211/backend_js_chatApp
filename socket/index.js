import { createServer } from "http";
import { Server } from "socket.io";
import { socketMiddlewareIo } from "../middlewares/socketMiddleware";
import { getOnlineUsers } from "./onlineUser";

const httpServer = createServer();


const io = new Server(httpServer, {
    cors:{
        origin:["http://locallhost:3000"],
        //methods:['GET' , 'POST' , 'PUT' , 'PATCH' , 'DELETE' , 'OPTIONS']
    }
});

// nen de sau config  
io.use(socketMiddlewareIo)


io.on("connection", (socket) => {
  console.log("kết nối thành công")

  io.emit("online-users", getOnlineUsers())

  socket.on("send-message", (data) => {
    io.to(data.recipientId).emit("new-message", message)
  })

  socket.on("test-online" , (data) => {
    console.log("data...")
  })
});



httpServer.listen(3000);