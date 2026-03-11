import Conversation from "../model/conversation.js"
import Message from "../model/message.js"

const createConversation = async (req , res) => {
    try {
        const {type , name , memberIds} = req.body
        const userId = req.user._id

        if(!type || (type === 'group' && !name) || !memberIds || !Array.isArray(memberIds) || memberIds.length === 0){
            return res.status(400).json({message:"Bat buoc phai co ten nhom va ds thanhf vien"})
        }

        let conversation 

        if(type === 'direct'){
            const participantId = memberIds[0]
            conversation = await Conversation.findOne({
                type:'direct',
                "participants.userId":{$all:[userId , participantId]} 
            })
        
            if(!conversation){
                conversation = new Conversation({
                    type:"direct",
                    participants:[{userId} , {userId :participantId}],
                    lastMessageAt:new Date()
                })
                await conversation.save()
            }
        }

        if(type === "group"){
            conversation = new Conversation({
                type:"group",
                participants:[
                    {userId} ,
                    ...memberIds.map((id) => ({userId:id}))
                ],
                group:{
                    name,
                    createdBy:userId
                },
                lastMessageAt:new Date()
            }) 
            await conversation.save()
        }

        if(!conversation){
            return res.status(400).json({message:'Conversation khong hop le'})
        }

        await conversation.populate([
            {path:'participants.userId' , select: 'displayName avatarUrl'},
            {path:'seenBy' , select:'displayName avatarUrl'},
            {path:'lastMessage.senderId' , select:'displayName avatarUrl'}
        ])

        return res.status(201).json({conversation})
    } catch (error) {
            console.log(error)
            return res.status(500).json({message:"Looix he thong"})
    }
}

const getConversation = async (req , res) => {
    try {
        const userId = req.user._id
        const conversations = await Conversation.find({
            'participants.userId':userId 
        })  
        .sort({lastMessageAt:-1 , updateAt:-1})
        .populate({ path:'participants.userId', select:'displayName avatarUrl' })
        .populate({ path:'lastMessage.senderId', select:'displayName avatarUrl' })
        .populate({ path:'seenBy', select:'displayName avatarUrl' })

        const formatted = conversations.map((convo) => {
            const participants = (convo.participants || []).map((p) => ({
                _id:p.userId?._id,
                displayName:p.userId?.displayName,
                avatarUrl:p.userId?.avatarUrl ?? null,
                joinedAt:p.joinedAt
            }))

             return {
                ...convo.toObject(),
                unreadCounts:convo.unreadCounts || {},
                participants
             }
        })
        return res.status(200).json({conversations:formatted})
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Looix lay danh sach conversation"})
    }
}

const getMessage = async (req , res) => {
    try {
        const {conversationId} = req.params
        const {limit = 50 , cursor} = req.query
        const query = {conversationId}

        if(cursor){
            query.createdAt = {$lt:new Date(cursor)}
        }

        let messages = await Message.find(query)
        .sort({createdAt:-1})
        .limit(Number(limit) + 1)

        let nextCursor = null
        if(messages.length > Number(limit)){
            const nextMessage = messages[messages.length - 1]
            nextCursor = nextMessage.createdAt.toISOString()
            messages.pop()
        }
        messages = messages.reverse()
        return res.status(200).json({ messages, nextCursor })
    } catch (error) {
        console.log(error)
        return res.status(500).json({message:"Looix lay message"})
    }
}


const deleteConversation = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({ message: "Không tìm thấy cuộc hội thoại" });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.userId.toString() === userId.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({ message: "Bạn không có quyền xóa hội thoại này" });
    }

    await Conversation.findByIdAndDelete(conversationId);
    // Optional: Xóa toàn bộ tin nhắn thuộc hội thoại này nếu muốn dọn dẹp sạch sẽ
    // await Message.deleteMany({ conversationId });

    return res.status(200).json({ message: "Xóa cuộc hội thoại thành công" });
  } catch (error) {
    console.error("Lỗi xóa hội thoại:", error);
    return res.status(500).json({ message: "Lỗi server khi xóa" });
  }
};



export {createConversation , getConversation , getMessage , deleteConversation}