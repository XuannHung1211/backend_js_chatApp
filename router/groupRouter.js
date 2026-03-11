import express from "express";
const router = express.Router();
import { createNewGroup } from "../controller/groupController.js";
import authMiddleware from "../middlewares/authMiddlewares.js";

// Endpoint tạo nhóm mới
router.post("/create", authMiddleware, createNewGroup);

export default router;