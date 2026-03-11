import Conversation from '../model/conversation.js'
import mongoose from "mongoose";


export const createNewGroup = async (req, res) => {
    try {
        const { name, userIds } = req.body; 
        const creatorId = req.user._id;

        if (!name || !userIds || userIds.length < 2) {
            return res.status(400).json({ message: "Tên nhóm và ít nhất 2 thành viên khác là bắt buộc" });
        }

        const uniqueMemberIds = [...new Set([...userIds, creatorId.toString()])];

        const participants = uniqueMemberIds.map(id => ({
            userId: new mongoose.Types.ObjectId(id),
            joinedAt: new Date()
        }));

        const unreadCount = new Map();
        uniqueMemberIds.forEach(id => unreadCount.set(id, 0));

        const newGroup = await Conversation.create({
            type: "group",
            participants,
            group: { name, createdBy: creatorId },
            unreadCount,
            lastMessageAt: new Date(),
            seenBy: [creatorId]
        });

       
        const fullGroupInfo = await Conversation.findById(newGroup._id)
            .populate("participants.userId", "displayName avatarUrl username")
            .lean();

        // Gửi thông báo đến từng thành viên trong nhóm
        uniqueMemberIds.forEach(memberId => {
            // Server.js của bạn đã có socket.join(socket.userId), 
            // nên ta emit vào room có tên là ID của user đó.
            req.io.to(memberId).emit("new-conversation", fullGroupInfo);
        });
        // ----------------------------

        res.status(201).json(fullGroupInfo);
    } catch (error) {
        res.status(500).json({ message: "Lỗi server khi tạo nhóm", error: error.message });
    }
};