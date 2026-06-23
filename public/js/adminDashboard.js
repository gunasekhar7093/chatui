const token = localStorage.getItem("adminToken");

if (!token || token === "undefined" || token === "null") {
  window.location = "admin.html";
}

async function loadUsers() {
  const usersTable = document.getElementById("usersTable");

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/users",
      {
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        alert("Session expired or unauthorized. Please log in again.");
        localStorage.removeItem("adminToken");
        window.location = "admin.html";
        return;
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const users = await response.json();
    
    if (!Array.isArray(users)) {
      throw new Error("Invalid server response (expected an array of users)");
    }

    let html = "";
    users.forEach(user => {
      const date = new Date(user.createdAt).toLocaleDateString();
      html += `
        <tr>
          <td>${user.name}</td>
          <td>${user.email}</td>
          <td>${date}</td>
          <td>
            <button class="deleteBtn" onclick="deleteUser('${user._id}')">
              Delete
            </button>
          </td>
        </tr>
      `;
    });

    usersTable.innerHTML = html;
  } catch (error) {
    console.error("Error loading users:", error);
    usersTable.innerHTML = `
      <tr>
        <td colspan="4" style="text-align: center; color: var(--danger); padding: 24px; font-weight: 500;">
          ❌ Error loading users: ${error.message}
        </td>
      </tr>
    `;
  }
}

loadUsers();

async function deleteUser(id) {
  if (!confirm("Delete this user?")) return;

  try {
    const response = await fetch(
      "http://localhost:5000/api/admin/users/" + id,
      {
        method: "DELETE",
        headers: {
          Authorization: "Bearer " + token
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete user. Status: ${response.status}`);
    }

    loadUsers();
  } catch (error) {
    console.error("Error deleting user:", error);
    alert("Error deleting user: " + error.message);
  }
}

function logout() {
  localStorage.removeItem("adminToken");
  window.location = "admin.html";
}