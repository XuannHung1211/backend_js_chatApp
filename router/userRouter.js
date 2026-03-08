import express from "express"
import { getUser , getUsersByKeyword, getUserDetail } from "../controller/userController.js"
import authMiddleware from "../middlewares/authMiddlewares.js"

const router = express.Router()

router.get("/" , getUser)
router.get("/me" ,authMiddleware , getUserDetail)
router.get("/search" ,authMiddleware , getUsersByKeyword)


export default router