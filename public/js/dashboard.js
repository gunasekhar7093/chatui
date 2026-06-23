const token = localStorage.getItem("token");

let selectedChatId=null;
let socket=io();

let onlineUsers=[];
let lastSeen={};
let typingUsers=[];

let myId=null;
let currentChatUserId=null;

if(!token){
window.location="index.html";
}

let activeSidebarTab = "chatsSection";
let showingProfile = true;

// Tab Highlighting helper
function highlightTab(tabBtnId) {
  document.getElementById("tabChatsBtn").classList.remove("active");
  document.getElementById("tabUsersBtn").classList.remove("active");
  document.getElementById("tabProfileBtn").classList.remove("active");
  if (tabBtnId) {
    document.getElementById(tabBtnId).classList.add("active");
  }
}

// Back to sidebar layout on mobile
function backToSidebar() {
  document.body.classList.remove("chat-open");
  document.body.classList.remove("profile-open");
  
  if (activeSidebarTab === "chatsSection") {
    showChats();
  } else {
    showUsers();
  }
}

// Manage welcome splash screen display state
function updateWelcomeScreen() {
  const profileSection = document.getElementById("profileSection");
  const chatSection = document.getElementById("chatSection");
  const welcomeSection = document.getElementById("welcomeSection");
  
  if (!welcomeSection) return;
  
  const profileVisible = profileSection && profileSection.style.display !== "none" && profileSection.style.display !== "";
  const chatVisible = chatSection && chatSection.style.display !== "none" && chatSection.style.display !== "";
  
  if (profileVisible || chatVisible) {
    welcomeSection.style.display = "none";
  } else {
    welcomeSection.style.display = "flex";
  }
}

showProfile();


// Tabs

function showProfile(){
  showingProfile = true;
  hideAll();
  document.getElementById("profileSection").style.display="flex";
  highlightTab("tabProfileBtn");
  
  document.body.classList.add("profile-open");
  document.body.classList.remove("chat-open");
  updateWelcomeScreen();
}

function showChats(){
  showingProfile = false;
  activeSidebarTab = "chatsSection";
  hideAll();
  document.getElementById("chatsSection").style.display="block";
  highlightTab("tabChatsBtn");
  
  document.body.classList.remove("profile-open");
  document.body.classList.remove("chat-open");
  updateWelcomeScreen();
  loadChats();
}

function showUsers(){
  showingProfile = false;
  activeSidebarTab = "usersSection";
  hideAll();
  document.getElementById("usersSection").style.display="block";
  highlightTab("tabUsersBtn");
  
  document.body.classList.remove("profile-open");
  document.body.classList.remove("chat-open");
  updateWelcomeScreen();
  loadUsers();
}


// Leave Chat

function hideAll(){

if(myId){
socket.emit("leave chat",myId);
}

document.getElementById("profileSection").style.display="none";
document.getElementById("chatSection").style.display="none";

if (window.innerWidth <= 768) {
  document.getElementById("usersSection").style.display="none";
  document.getElementById("chatsSection").style.display="none";
} else {
  document.getElementById("usersSection").style.display = activeSidebarTab === "usersSection" ? "block" : "none";
  document.getElementById("chatsSection").style.display = activeSidebarTab === "chatsSection" ? "block" : "none";
}

updateWelcomeScreen();

}



// Load Profile

async function loadProfile(){

const response=await fetch(
"http://localhost:5000/api/dashboard",
{
headers:{Authorization:"Bearer "+token}
});

const data=await response.json();

myId=data.user._id;

// Populate profile name in header and display
document.getElementById("sidebarDisplayName").innerText = data.user.name;

document.getElementById("profileData").innerHTML=`

<p>Name: ${data.user.name}</p>
<p>Email: ${data.user.email}</p>

`;

socket.emit("setup",data.user);

}

loadProfile();


// Socket Updates

socket.on("status update",(data)=>{

onlineUsers=data.onlineUsers;
lastSeen=data.lastSeen;
typingUsers=data.typingUsers;

loadUsers();
loadChats();
updateChatHeader();

});


socket.on("status refresh",()=>{

loadMessages();
loadChats();

});



// Status Text

function getStatus(userId){

if(typingUsers.includes(userId))
return `<span class="typingText">typing...</span>`;

if(onlineUsers.includes(userId))
return `<span class="onlineText">online</span>`;

if(lastSeen[userId]){

const time=new Date(lastSeen[userId])
.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit',
hour12:true
});

return `<span class="offlineText">
last seen ${time}
</span>`;

}

return `<span class="offlineText">offline</span>`;

}



// Status Icons

function getStatusIcon(status){

if(status==="sent")
return `<span class="statusGray">✓</span>`;

if(status==="delivered")
return `<span class="statusGray">✓✓</span>`;

if(status==="seen")
return `<span class="statusGreen">✓✓</span>`;

return "";

}

// updateChatHeader
function updateChatHeader(){

if(!currentChatUserId) return;

const userName =
document.getElementById("chatUserName")
.innerText.split("\n")[0];

document.getElementById("chatUserName").innerHTML=`
${userName}
<br>
${getStatus(currentChatUserId)}
`;

}



// Users

async function loadUsers(){

const response=await fetch(
"http://localhost:5000/api/users",
{
headers:{Authorization:"Bearer "+token}
});

const users=await response.json();

let html="";

users.forEach(user=>{

// Don't show yourself
if(user._id===myId) return;

html+=`

<div class="userItem"
onclick="startChat('${user._id}','${user.name}')">

${user.name}

<br>

${getStatus(user._id)}

</div>

`;

});

document.getElementById("usersList").innerHTML=html;

}



// Chats + Unread Counter

async function loadChats(){

const response=await fetch(
"http://localhost:5000/api/chat",
{
headers:{Authorization:"Bearer "+token}
});

const chats=await response.json();

if(!Array.isArray(chats)) return;

let html="";

chats.forEach(chat=>{

// 🚫 Safety check
if(!chat.users || chat.users.length<2) return;

// Find other user safely
let otherUser = chat.users.find(u=>u._id!==myId);

if(!otherUser) return;


// LAST MESSAGE

let lastMsg="";
let time="";
let statusIcon="";

if(chat.latestMessage){

lastMsg=chat.latestMessage.content || "";

time=new Date(chat.latestMessage.createdAt)
.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit',
hour12:true
});

if(chat.latestMessage.sender &&
chat.latestMessage.sender._id===myId){

statusIcon=getStatusIcon(chat.latestMessage.status);

}

}


// UNREAD COUNTER

let unreadHTML="";

if(chat.unreadCount>0){

let count=chat.unreadCount>99
? "99+"
: chat.unreadCount;

unreadHTML=`
<span class="unreadBubble">
${count}
</span>
`;

}


// BUILD HTML

html+=`

<div class="chatItem"
onclick="openChat('${chat._id}',
'${otherUser.name}',
'${otherUser._id}')">

${otherUser.name}

<br>

${getStatus(otherUser._id)}

<span class="chatTime">
${time}
</span>

<br>

<span class="lastMessage">
${statusIcon} ${lastMsg}
</span>

${unreadHTML}

</div>

`;

});


document.getElementById("chatList").innerHTML=html;

}



// Start Chat

async function startChat(userId,userName){

const response=await fetch(
"http://localhost:5000/api/chat",
{
method:"POST",

headers:{
"Content-Type":"application/json",
Authorization:"Bearer "+token
},

body:JSON.stringify({userId})
});

const chat=await response.json();

openChat(chat._id,userName,userId);

}



// Open Chat

function openChat(chatId,userName,userId){

hideAll();

selectedChatId=chatId;
currentChatUserId=userId;
showingProfile = false;

document.getElementById("chatSection").style.display="flex";
document.body.classList.add("chat-open");

document.getElementById("chatUserName").innerHTML=`
${userName}
<br>
${getStatus(userId)}
`;

socket.emit("join chat",chatId,myId);

socket.emit("messages seen",chatId,myId);

updateWelcomeScreen();

loadMessages();

}



// Typing + Enter Send

document.addEventListener("DOMContentLoaded",()=>{

const input=document.getElementById("messageInput");

input.addEventListener("input",()=>{

socket.emit("typing",{userId:myId});

clearTimeout(window.typingTimer);

window.typingTimer=setTimeout(()=>{

socket.emit("stop typing",myId);

},2000);

});


input.addEventListener("keydown",(e)=>{

if(e.key==="Enter" && !e.shiftKey){

e.preventDefault();

sendMessage();

}

});

});



// Load Messages

async function loadMessages(){

// 🚫 Prevent request if chat not selected
if(!selectedChatId) return;

const response=await fetch(
"http://localhost:5000/api/message/"+selectedChatId,
{
headers:{Authorization:"Bearer "+token}
});

const messages=await response.json();

// 🚫 Prevent crash if server error
if(!Array.isArray(messages)) return;

let html="";

let lastDate="";

messages.forEach(msg=>{

const msgDate=new Date(msg.createdAt);

const dateString=msgDate.toDateString();


// DATE SEPARATOR

if(dateString!==lastDate){

lastDate=dateString;

let label="";

const today=new Date();
const yesterday=new Date();

yesterday.setDate(today.getDate()-1);

if(dateString===today.toDateString())
label="Today";

else if(dateString===yesterday.toDateString())
label="Yesterday";

else
label=msgDate.toLocaleDateString([],{
day:'numeric',
month:'long',
year:'numeric'
});


html+=`

<div class="dateSeparator">
${label}
</div>

`;

}


// MESSAGE

let className="otherMessage";

if(msg.sender._id===myId)
className="myMessage";


const time=new Date(msg.createdAt)
.toLocaleTimeString([],{
hour:'2-digit',
minute:'2-digit',
hour12:true
});


let statusIcon="";

if(msg.sender._id===myId)
statusIcon=getStatusIcon(msg.status);


html+=`

<div class="message ${className}">

<div>
${msg.content.replace(/\n/g,"<br>")}
</div>

<div class="time">
${time} ${statusIcon}
</div>

</div>

`;

});


const box=document.getElementById("messagesBox");

box.innerHTML=html;

box.scrollTop=box.scrollHeight;

}



// Send Message

async function sendMessage(){

const text=document.getElementById("messageInput").value.trim();

if(!text) return;

socket.emit("stop typing",myId);

const response=await fetch(
"http://localhost:5000/api/message",
{
method:"POST",

headers:{
"Content-Type":"application/json",
Authorization:"Bearer "+token
},

body:JSON.stringify({
content:text,
chatId:selectedChatId
})
});

const message=await response.json();

socket.emit("new message",message);

document.getElementById("messageInput").value="";

loadMessages();
loadChats();

}



// Receive Message

socket.on("message received",(message)=>{

socket.emit("message delivered",message._id);

if(message.chat._id===selectedChatId){

setTimeout(()=>{

socket.emit("messages seen",
selectedChatId,
myId);

},300);

loadMessages();

}

loadChats();

});



// Logout

function logout(){
localStorage.removeItem("token");
window.location="index.html";
}



// Dark Mode

function toggleMode(){
document.getElementById("body")
.classList.toggle("dark");
}