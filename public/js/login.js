async function loginUser(){

const email=document.getElementById("email").value;
const password=document.getElementById("password").value;

const response=await fetch(
"http://localhost:5000/api/auth/login",
{
method:"POST",

headers:{
"Content-Type":"application/json"
},

body:JSON.stringify({
email,
password
})

});

const data=await response.json();

if(data.token){

localStorage.setItem("token",data.token);

alert("Login Successful");

window.location="dashboard.html";

}else{

alert(data.message);

}

}