import jwt from "jsonwebtoken"
import cookie from "cookie"

const socketMiddlewareIo = (socket, next) => {

  const rawCookie = socket.request.headers.cookie

  if (!rawCookie) {
    return next(new Error("No cookie"))
  }

  const parsed = cookie.parse(rawCookie)

  const token = parsed.accessToken  

  if (!token) {
    return next(new Error("No token"))
  }

  try {
    const decoded = jwt.verify(token, process.env.SECRET_TOKEN_KEY)
    socket.userId = decoded.userId
    next()
  } catch {
    next(new Error("Invalid token"))
  }
}

export { socketMiddlewareIo }