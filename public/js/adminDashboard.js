const token = localStorage.getItem("adminToken");

if(!token){
window.location="admin.html";
}


async function loadUsers(){

const response = await fetch(
"http://localhost:5000/api/admin/users",
{
headers:{
Authorization:"Bearer "+token
}
});

const users = await response.json();

let html="";

users.forEach(user=>{

const date = new Date(user.createdAt)
.toLocaleDateString();

html+=`

<tr>

<td>${user.name}</td>

<td>${user.email}</td>

<td>${date}</td>

<td>

<button class="deleteBtn"
onclick="deleteUser('${user._id}')">

Delete

</button>

</td>

</tr>

`;

});

document.getElementById("usersTable").innerHTML=html;

}

loadUsers();



async function deleteUser(id){

if(!confirm("Delete this user?")) return;

await fetch(
"http://localhost:5000/api/admin/users/"+id,
{
method:"DELETE",
headers:{
Authorization:"Bearer "+token
}
});

loadUsers();

}



function logout(){

localStorage.removeItem("adminToken");

window.location="admin.html";

}