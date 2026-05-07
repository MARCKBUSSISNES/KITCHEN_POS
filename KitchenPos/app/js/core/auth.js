const Auth = {
  sessionKey: "kitchenos_session_v1",

  getSession() {
    const raw = localStorage.getItem(this.sessionKey);
    return raw ? JSON.parse(raw) : null;
  },

  setSession(payload) {
    localStorage.setItem(this.sessionKey, JSON.stringify(payload));
  },

  async login() {
    const username = document.getElementById("user").value.trim();
    const password = document.getElementById("pass").value.trim();
    const msg = document.getElementById("loginMsg");

    const user = AppDB.find("users", u => u.username === username && u.password === password && u.active);
    if (!user) {
      msg.textContent = "Usuario o contraseña incorrectos.";
      msg.style.color = "#fca5a5";
      return;
    }

    const session = {
      loggedIn: true,
      userId: user.id,
      username: user.username,
      name: user.name,
      role: user.role
    };

    this.setSession(session);
    window.location.href = "index.html";
  },

  requireSession() {
    const session = this.getSession();
    if (!session?.loggedIn) {
      window.location.href = "login.html";
      return null;
    }
    AppState.currentUser = session;
    return session;
  },

  logout() {
    localStorage.removeItem(this.sessionKey);
    window.location.href = "login.html";
  }
};

function login() {
  return Auth.login();
}
