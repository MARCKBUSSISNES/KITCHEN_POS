function renderMesasView() {
  const mesas = AppDB.getAll("mesas");
  const areas = AppDB.getAll("tableAreas");
  const selectedAreaId = AppState.selectedTableAreaId || "ALL";

  const filteredMesas = selectedAreaId === "ALL"
    ? mesas
    : mesas.filter(m => m.areaId === selectedAreaId);

  return `
    <div class="section-head">
      <div>
        <h2>Control de Mesas</h2>
        <p class="muted">Selecciona una mesa para trabajar la orden.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
      </div>
    </div>

    <section class="panel-section">
      <div class="toolbar">
        <button class="btn ${selectedAreaId === "ALL" ? "btn-primary" : ""}" onclick="MesasUI.filterByArea('ALL')">Todas</button>
        ${areas.map(a => `
          <button class="btn ${selectedAreaId === a.id ? "btn-primary" : ""}" onclick="MesasUI.filterByArea('${a.id}')">
            ${a.name}
          </button>
        `).join("")}
      </div>
    </section>

    <section class="mesas-grid">
      ${
        filteredMesas.length
          ? filteredMesas.map(m => {
              const kitchenInfo = MesasUI.getKitchenStatus(m.id);

              return `
                <article class="mesa-card ${m.status}" onclick="MesasUI.openMesa('${m.id}')">
                  <div class="small muted">${m.area || "Sin área"}</div>
                  <h3>${m.name}</h3>

                  <p class="small muted">Cuenta abierta: ${m.open ? "Sí" : "No"}</p>

                  <p class="small muted">
                    Cocina:
                    <strong style="color:${kitchenInfo.color};">
                      ${kitchenInfo.label}
                    </strong>
                  </p>

                  <span class="badge ${m.status === "libre" ? "ok" : m.status === "ocupada" ? "danger" : "warn"}">
                    ${String(m.status || "libre").toUpperCase()}
                  </span>
                </article>
              `;
            }).join("")
          : `<div class="placeholder">No hay mesas en esta área.</div>`
      }
    </section>
  `;
}

const MesasUI = {
  filterByArea(areaId) {
    AppState.selectedTableAreaId = areaId;
    Router.loadView("mesas");
  },

  getKitchenStatus(mesaId) {
    const order = AppDB.find("orders", o =>
      o.type === "MESA" &&
      o.refId === mesaId &&
      o.status === "OPEN"
    );

    if (!order) {
      return {
        label: "SIN COMANDA",
        color: "#c3b29e"
      };
    }

    const items = AppDB.filter("orderItems", i => i.orderId === order.id);

    if (!items.length) {
      return {
        label: "SIN COMANDA",
        color: "#c3b29e"
      };
    }

    const hasPreparing = items.some(i => i.kdsStatus === "PREPARACION");
    const hasSent = items.some(i => i.sent === true);
    const allDelivered = items.every(i =>
      i.kdsStatus === "ENTREGADO" ||
      i.delivered === true
    );

    if (hasPreparing) {
      return {
        label: "EN PREPARACIÓN",
        color: "#facc15"
      };
    }

    if (hasSent && allDelivered) {
      return {
        label: "ENTREGADO EN COCINA",
        color: "#22c55e"
      };
    }

    if (hasSent) {
      return {
        label: "ENVIADO A COCINA",
        color: "#38bdf8"
      };
    }

    return {
      label: "SIN COMANDA",
      color: "#c3b29e"
    };
  },

  openMesa(id) {
    const mesa = AppDB.find("mesas", m => m.id === id);
    if (!mesa) return;

    let order = AppDB.find("orders", o =>
      o.type === "MESA" &&
      o.refId === id &&
      o.status === "OPEN"
    );

    AppState.draftOrder = null;

    if (!order) {
      AppState.currentOrderId = null;
      AppState.draftOrder = {
        id: `DRAFT-MESA-${mesa.id}`,
        type: "MESA",
        refId: mesa.id,
        refName: mesa.name,
        areaId: mesa.areaId || "",
        areaName: mesa.area || "Sin área",
        tableAreaId: mesa.areaId || "",
        tableAreaName: mesa.area || "Sin área",
        status: "DRAFT",
        subtotal: 0,
        total: 0,
        createdAt: Utils.now(),
        updatedAt: Utils.now()
      };
    } else {
      const items = AppDB.filter("orderItems", i => i.orderId === order.id);
      const hasItems = items.length > 0;

      AppDB.update("mesas", id, {
        status: hasItems ? "ocupada" : "libre",
        open: hasItems,
        updatedAt: Utils.now()
      });

      AppDB.update("orders", order.id, {
        areaId: mesa.areaId || order.areaId || "",
        areaName: mesa.area || order.areaName || "Sin área",
        tableAreaId: mesa.areaId || order.tableAreaId || "",
        tableAreaName: mesa.area || order.tableAreaName || "Sin área"
      });

      AppState.currentOrderId = order.id;
    }

    Router.loadView("orden");
  }
};