function renderDashboardView() {
  return `
    <section class="pos-panel">
      <div class="pos-main-actions">
        <article class="pos-action-card primary" onclick="Router.loadView('mesas')">
          <div class="pos-action-icon">🍽️</div>
          <div class="pos-action-label">MESAS</div>
        </article>
        <article class="pos-action-card primary" onclick="DashboardUI.openTakeawayMenu()">
          <div class="pos-action-icon">🛍️</div>
          <div class="pos-action-label">PARA LLEVAR</div>
        </article>

        <article class="pos-action-card primary" onclick="Router.loadView('domicilio')">
          <div class="pos-action-icon">🛵</div>
          <div class="pos-action-label">A DOMICILIO</div>
        </article>

        <article class="pos-action-card primary" onclick="DashboardUI.placeholder('Plataformas')">
          <div class="pos-action-icon">📱</div>
          <div class="pos-action-label">PLATAFORMAS</div>
        </article>
      </div>

      <div class="pos-divider"></div>

      <div class="pos-secondary-actions">
        <article class="pos-mini-card" onclick="Router.loadView('caja')">
          <div class="pos-mini-label">CAJA</div>
        </article>

<article class="pos-mini-card" onclick="DashboardUI.closeTurno()">
  <div class="pos-mini-label">CERRAR TURNO</div>
</article>

        <article class="pos-mini-card" onclick="DashboardUI.openOrders()">
          <div class="pos-mini-label">ÓRDENES ABIERTAS</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('historial')">
          <div class="pos-mini-label">ÓRDENES CERRADAS</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('historial')">
          <div class="pos-mini-label">HISTORIAL</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('productosVendidos')">
          <div class="pos-mini-label">PRODUCTOS VENDIDOS</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('productos')">
          <div class="pos-mini-label">PRODUCTOS</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('configuracion')">
          <div class="pos-mini-label">CONFIGURACIÓN</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('usuarios')">
          <div class="pos-mini-label">USUARIOS</div>
        </article>

        <article class="pos-mini-card" onclick="DashboardUI.placeholder('Registrar compra')">
          <div class="pos-mini-label">REGISTRAR COMPRA</div>
        </article>

        <article class="pos-mini-card" onclick="Router.loadView('cierres')">
          <div class="pos-mini-label">LISTADO DE CIERRES</div>
        </article>

<article class="pos-mini-card" onclick="window.open('visor.html', '_blank')">
  <div class="pos-mini-label">VISOR DE ÓRDENES</div>
</article>
      </div>
    </section>
  `;
}

const DashboardUI = {
  openTakeawayMenu() {
    const nextCount = AppDB.getAll("takeawayOrders").length + 1;
    AppState.currentOrderId = null;
    AppState.draftOrder = {
      id: `DRAFT-LLEVAR-${Date.now()}`,
      type: "LLEVAR",
      refId: null,
      refName: `LLEVAR-${String(nextCount).padStart(4, "0")}`,
      status: "DRAFT",
      customerName: "",
      customerNit: "CF",
      subtotal: 0,
      total: 0,
      createdAt: Utils.now(),
      updatedAt: Utils.now()
    };
    Router.loadView("orden");
  },

  closeTurno() {
    const session = AppDB.find("cashSessions", s => s.status === "OPEN");

    if (!session) {
      alert("No hay caja abierta para cerrar.");
      return;
    }

    AppState.pendingCloseCashFromDashboard = true;
    Router.loadView("caja");

    setTimeout(() => {
      if (window.CajaUI && typeof CajaUI.openCloseModal === "function") {
        CajaUI.openCloseModal();
      }
    }, 150);
  },

  openOrders() {
    const openOrders = AppDB.filter("orders", o => o.status === "OPEN");
    alert(`Órdenes abiertas: ${openOrders.length}`);
  },

  closedOrders() {
    const closedOrders = AppDB.filter("orders", o => o.status === "CLOSED");
    alert(`Órdenes cerradas: ${closedOrders.length}`);
  },

  placeholder(name) {
    alert(`Módulo pendiente: ${name}`);
  }
  
};
