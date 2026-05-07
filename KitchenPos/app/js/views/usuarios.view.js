function renderUsuariosView() {
  const users = AppDB.getAll("users");

  return `
    <div class="section-head">
      <div>
        <h2>Usuarios</h2>
        <p class="muted">Administra accesos, roles y contraseñas.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
        <button class="btn btn-primary" onclick="UsuariosUI.openCreateModal()">Nuevo usuario</button>
      </div>
    </div>

    <div class="table-box">
      <table class="table">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Usuario</th>
            <th>Rol</th>
            <th>Activo</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          ${
            users.length
              ? users.map(u => `
                <tr>
                  <td>${u.name}</td>
                  <td>${u.username}</td>
                  <td>${u.role}</td>
                  <td>${u.active ? "Sí" : "No"}</td>
                  <td>
                    <button class="btn" onclick="UsuariosUI.openEditModal('${u.id}')">Editar</button>
                    <button class="btn" onclick="UsuariosUI.toggleUser('${u.id}')">${u.active ? "Desactivar" : "Activar"}</button>
                    <button class="btn btn-danger" onclick="UsuariosUI.deleteUser('${u.id}')">Eliminar</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="5">No hay usuarios registrados.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div id="userModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="userModalTitle" style="margin-bottom:4px;">Nuevo usuario</h3>
            <p class="muted">Crea o edita un usuario del sistema.</p>
          </div>
          <button class="btn btn-danger" onclick="UsuariosUI.closeModal()">Cerrar</button>
        </div>

        <input type="hidden" id="userId" />

        <label class="field-label">Nombre</label>
        <input id="userName" class="input" />

        <label class="field-label">Usuario</label>
        <input id="userUsername" class="input" />

        <label class="field-label">Contraseña</label>
        <input id="userPassword" class="input" type="password" />

        <label class="field-label">Rol</label>
        <select id="userRole" class="input">
          <option value="ADMIN">ADMIN</option>
          <option value="SUPERVISOR">SUPERVISOR</option>
          <option value="CAJERO">CAJERO</option>
          <option value="MESERO">MESERO</option>
          <option value="COCINA">COCINA</option>
        </select>

        <label class="field-label">Estado</label>
        <select id="userActive" class="input">
          <option value="true">Activo</option>
          <option value="false">Inactivo</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="UsuariosUI.saveUser()">Guardar usuario</button>
        </div>
      </div>
    </div>
  `;
}

const UsuariosUI = {
  openCreateModal() {
    document.getElementById("userModalTitle").textContent = "Nuevo usuario";
    document.getElementById("userId").value = "";
    document.getElementById("userName").value = "";
    document.getElementById("userUsername").value = "";
    document.getElementById("userPassword").value = "";
    document.getElementById("userRole").value = "CAJERO";
    document.getElementById("userActive").value = "true";
    document.getElementById("userModal").classList.add("open");
  },

  openEditModal(id) {
    const user = AppDB.find("users", u => u.id === id);
    if (!user) return;

    document.getElementById("userModalTitle").textContent = "Editar usuario";
    document.getElementById("userId").value = user.id;
    document.getElementById("userName").value = user.name || "";
    document.getElementById("userUsername").value = user.username || "";
  document.getElementById("userPassword").value = "";
document.getElementById("userPassword").placeholder = "Dejar vacío para conservar contraseña";
    document.getElementById("userRole").value = user.role || "CAJERO";
    document.getElementById("userActive").value = String(user.active);
    document.getElementById("userModal").classList.add("open");
  },

  closeModal() {
    document.getElementById("userModal").classList.remove("open");
  },

  saveUser() {
    const id = document.getElementById("userId").value.trim();
    const name = document.getElementById("userName").value.trim();
    const username = document.getElementById("userUsername").value.trim();
    const password = document.getElementById("userPassword").value.trim();
    const role = document.getElementById("userRole").value;
    const active = document.getElementById("userActive").value === "true";
    const session = Auth.getSession();

if (session?.role !== "ADMIN") {
  alert("Solo un administrador puede modificar usuarios.");
  return;
}
if (!name || !username) {
  alert("Completa nombre y usuario.");
  return;
}

if (!id && !password) {
  alert("Debes escribir una contraseña para el nuevo usuario.");
  return;
}
    const duplicated = AppDB.find("users", u => u.username === username && u.id !== id);
    if (duplicated) {
      alert("Ese nombre de usuario ya existe.");
      return;
    }

if (id) {
  const patch = { name, username, role, active };

  if (password) {
    patch.password = password;
  }

  AppDB.update("users", id, patch);
} else {
      AppDB.insert("users", {
        id: Utils.uid("U"),
        name,
        username,
        password,
        role,
        active
      });
    }

    this.closeModal();
    Router.loadView("usuarios");
  },

  toggleUser(id) {
    const user = AppDB.find("users", u => u.id === id);
    if (!user) return;

    AppDB.update("users", id, { active: !user.active });
    Router.loadView("usuarios");
  },

  deleteUser(id) {
    const user = AppDB.find("users", u => u.id === id);
    if (!user) return;

    const session = Auth.getSession();
    if (session?.userId === id) {
      alert("No puedes eliminar el usuario que está en sesión.");
      return;
    }

    if (!confirm(`¿Eliminar el usuario "${user.name}"?`)) return;

    AppDB.delete("users", id);
    Router.loadView("usuarios");
  }
};