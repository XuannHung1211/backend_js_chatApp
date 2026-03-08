import express from "express"
import { 
    sendFriend 
    ,acceptFriendRequest
    , declineFriendRequest 
    , getAllListFriend ,
     getListFriendRequest 
} from "../controller/friendController.js"
import authMiddleware from "../middlewares/authMiddlewares.js"

const router = express.Router()

router.post("/request" ,authMiddleware , sendFriend)
router.post("/request/:requestId/accept" ,authMiddleware , acceptFriendRequest)
router.post("/request/:requestId/decline" , authMiddleware, declineFriendRequest)
router.get("/request" ,authMiddleware , getListFriendRequest)
router.get("/" ,authMiddleware , getAllListFriend)


export default router