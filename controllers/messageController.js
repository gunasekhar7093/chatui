const Message=require("../models/Message");
const Chat=require("../models/Chat");


// Send Message
const sendMessage=async(req,res)=>{

const{content,chatId}=req.body;

if(!content||!chatId){

return res.status(400).json({
message:"Invalid data"
});

}

try{

let message=await Message.create({

sender:req.user._id,
content:content,
chat:chatId,
status:"sent"

});

message=await message.populate(
"sender",
"name email"
);

message=await message.populate(
"chat"
);


await Chat.findByIdAndUpdate(
chatId,
{
latestMessage:message._id
}
);


res.status(200).json(message);


}catch(error){

res.status(500).json({
message:"Server Error"
});

}

};



// Get Messages
const allMessages=async(req,res)=>{

try{

const messages=await Message.find({

chat:req.params.chatId

})
.populate("sender","name email")
.sort({createdAt:1});


res.status(200).json(messages);

}catch(error){

res.status(500).json({
message:"Server Error"
});

}

};


module.exports={
sendMessage,
allMessages
};