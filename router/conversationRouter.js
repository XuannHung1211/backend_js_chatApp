import express from 'express'
import { createConversation , deleteConversation, getConversation , getMessage } from '../controller/conversationController.js'
import authMiddleware from '../middlewares/authMiddlewares.js'

const router = express.Router()


router.post("/" , createConversation)
router.get("/" , getConversation)
router.get("/:conversationId/message" , getMessage)
router.delete("/:conversationId/delete" ,authMiddleware , deleteConversation)

export default router