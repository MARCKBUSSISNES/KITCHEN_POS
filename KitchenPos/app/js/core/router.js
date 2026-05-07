const Router = {
  views: {
    dashboard: { render: () => renderDashboardView() },
    mesas: { render: () => renderMesasView() },
    llevar: { render: () => renderLlevarView() },
    domicilio: { render: () => renderDomicilioView() },
    orden: { render: () => renderOrdenView() },
    productos: { render: () => renderProductosView() },
    productosVendidos: { render: () => renderProductosVendidosView() },
    caja: { render: () => renderCajaView() },
    historial: { render: () => renderHistorialView() },
    usuarios: { render: () => renderUsuariosView() },
    cierres: { render: () => renderCierresView() },
    configuracion: { render: () => renderConfiguracionView() }
    
  },

  bootstrap() {
    const session = Auth.requireSession();
    if (!session) return;

    const userLabel = document.getElementById("sessionUser");
    if (userLabel) {
      userLabel.textContent = `${session.name} • ${session.role}`;
    }

    this.loadView("dashboard");
  },

  loadView(key) {
    const session = Auth.getSession();
    if (!session?.loggedIn) {
      Auth.logout();
      return;
    }

    if (!Roles.can(session.role, key)) {
      alert("No tienes permiso para entrar a este módulo.");
      return;
    }

    const view = this.views[key];
    if (!view) return;

    AppState.currentView = key;
    document.getElementById("app").innerHTML = view.render();
  }
};