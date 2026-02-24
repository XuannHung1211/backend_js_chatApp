const onlineUsers = new Map()

export const addOnlineUser = (userId, socketId) => {
  onlineUsers.set(userId, socketId)
}

export const removeOnlineUser = (socketId) => {
  for (const [userId, sId] of onlineUsers.entries()) {
    if (sId === socketId) {
      onlineUsers.delete(userId)
      break
    }
  }
}

export const getOnlineUsers = () => {
  return Array.from(onlineUsers.keys())
}

export const getSocketId = (userId) => {
  return onlineUsers.get(userId)
}