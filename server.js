const express=require("express");
const dotenv=require("dotenv");
const cors=require("cors");

const connectDB=require("./config/db");

   // routes

const authRoutes=require("./routes/authRoutes");
const chatRoutes=require("./routes/chatRoutes");
const messageRoutes=require("./routes/messageRoutes");
const userRoutes=require("./routes/userRoutes");
const adminRoutes=require("./routes/adminRoutes");

const protect=require("./middleware/authMiddleware");

const Message=require("./models/Message");
const Chat=require("./models/Chat");



dotenv.config();
connectDB();

const app=express();

app.use(cors());
app.use(express.json());

app.use(express.static("public"));

  //api
app.use("/api/auth",authRoutes);
app.use("/api/chat",chatRoutes);
app.use("/api/message",messageRoutes);
app.use("/api/users",userRoutes);
app.use("/api/admin",adminRoutes);

app.get("/api/dashboard",protect,(req,res)=>{
res.json({
message:"Welcome to Dashboard",
user:req.user
});
});

const PORT=process.env.PORT||5000;

const server=app.listen(PORT,()=>{
console.log(`Server running on port ${PORT}`);
});


const io=require("socket.io")(server,{
pingTimeout:60000,
cors:{origin:"*"}
});


let onlineUsers={};
let lastSeen={};
let typingUsers={};
let activeChats={};


io.on("connection",(socket)=>{


// USER LOGIN

socket.on("setup",async(userData)=>{

const userId=userData._id.toString();

onlineUsers[userId]=socket.id;

// ✅ FIXED LAST SEEN (DO NOT DELETE HISTORY)

if(lastSeen[userId]){
console.log("User came online:",userId);
}

socket.join(userId);


// AUTO DELIVER OLD MESSAGES

const chats=await Chat.find({
users:userId
});

for(const chat of chats){

await Message.updateMany(
{
chat:chat._id,
sender:{$ne:userId},
status:"sent"
},
{
status:"delivered"
}
);

}


// Refresh Senders

io.emit("status refresh");


io.emit("status update",{
onlineUsers:Object.keys(onlineUsers),
lastSeen:lastSeen,
typingUsers:Object.keys(typingUsers)
});

});



// JOIN CHAT

socket.on("join chat",(chatId,userId)=>{

socket.join(chatId.toString());

activeChats[userId]=chatId;

});



// LEAVE CHAT

socket.on("leave chat",(userId)=>{

delete activeChats[userId];

});



// TYPING

socket.on("typing",(data)=>{

typingUsers[data.userId]=true;

io.emit("status update",{
onlineUsers:Object.keys(onlineUsers),
lastSeen:lastSeen,
typingUsers:Object.keys(typingUsers)
});

});


socket.on("stop typing",(userId)=>{

delete typingUsers[userId];

io.emit("status update",{
onlineUsers:Object.keys(onlineUsers),
lastSeen:lastSeen,
typingUsers:Object.keys(typingUsers)
});

});



// NEW MESSAGE

socket.on("new message",(message)=>{

const roomId=message.chat._id.toString();

io.to(roomId).emit("message received",message);

});



// MESSAGE DELIVERED

socket.on("message delivered",async(messageId)=>{

const message=await Message.findById(messageId)
.populate("chat");

if(!message) return;

const users=message.chat.users;

let receiverId=null;

users.forEach(u=>{
if(u.toString()!==message.sender.toString())
receiverId=u.toString();
});


if(onlineUsers[receiverId]){

await Message.findByIdAndUpdate(
messageId,
{status:"delivered"}
);

io.to(onlineUsers[message.sender.toString()])
.emit("status refresh");

}

});



// MESSAGES SEEN

socket.on("messages seen",async(chatId,userId)=>{

if(activeChats[userId]!==chatId)
return;


const messages=await Message.find({
chat:chatId,
sender:{$ne:userId},
status:{$ne:"seen"}
});


await Message.updateMany(
{
chat:chatId,
sender:{$ne:userId},
status:{$ne:"seen"}
},
{
status:"seen"
}
);


// Refresh senders

messages.forEach(msg=>{

const senderId=msg.sender.toString();

if(onlineUsers[senderId]){

io.to(onlineUsers[senderId])
.emit("status refresh");

}

});

});



// USER DISCONNECT

socket.on("disconnect",()=>{

for(let userId in onlineUsers){

if(onlineUsers[userId]===socket.id){

delete onlineUsers[userId];

delete activeChats[userId];

delete typingUsers[userId];

// ✅ SAVE LAST SEEN

lastSeen[userId]=Date.now();

console.log("Last Seen Saved:",userId);

break;

}

}


io.emit("status update",{
onlineUsers:Object.keys(onlineUsers),
lastSeen:lastSeen,
typingUsers:Object.keys(typingUsers)
});

});


});