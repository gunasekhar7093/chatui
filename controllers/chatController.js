const Chat = require("../models/Chat");
const User = require("../models/User");
const Message = require("../models/Message");


// Create or Access Chat
const accessChat = async (req,res)=>{

try{

const { userId } = req.body;

if(!userId){
return res.status(400).json({
message:"UserId missing"
});
}


let chat = await Chat.findOne({

isGroupChat:false,
users:{ $all:[req.user._id,userId] }

})
.populate("users","-password")
.populate("latestMessage");


if(chat){

return res.status(200).json(chat);

}


const newChat = await Chat.create({

chatName:"sender",
isGroupChat:false,
users:[req.user._id,userId]

});


const fullChat = await Chat.findById(newChat._id)
.populate("users","-password")
.populate("latestMessage");


res.status(201).json(fullChat);

}
catch(error){

res.status(500).json({
message:"Server Error"
});

}

};




// Fetch Chats + Unread Count

const fetchChats = async (req,res)=>{

try{

const chats = await Chat.find({

users:{ $in:[req.user._id] }

})
.populate("users","-password")
.populate({
path:"latestMessage",
populate:{
path:"sender",
select:"name email"
}
})
.sort({updatedAt:-1});


const chatsWithUnread = await Promise.all(

chats.map(async(chat)=>{

const unreadCount = await Message.countDocuments({

chat:chat._id,
sender:{ $ne:req.user._id },
status:{ $ne:"seen" }

});

return{

...chat.toObject(),
unreadCount

};

})

);


res.status(200).json(chatsWithUnread);

}
catch(error){

res.status(500).json({
message:"Server Error"
});

}

};



module.exports={
accessChat,
fetchChats
};