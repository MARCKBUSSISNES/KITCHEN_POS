function renderLlevarView() {
  const llevar = AppDB.getAll("takeawayOrders").sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return `
    <div class="section-head">
      <div>
        <h2>Pedidos para llevar</h2>
        <p class="muted">Control de pedidos sin mesa.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
        <button class="btn btn-primary" onclick="LlevarUI.createOrder()">Nuevo pedido</button>
      </div>
    </div>

    <div class="table-box">
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${
            llevar.length
              ? llevar.map(o => `
                <tr>
                  <td>${o.code}</td>
                  <td>${o.customer || "Cliente"}</td>
                  <td>
                    <span class="badge ${o.status === "ENTREGADO" ? "ok" : o.status === "EN_PREPARACION" ? "warn" : "danger"}">
                      ${o.status || "PENDIENTE"}
                    </span>
                  </td>
                  <td>${Utils.currency(o.total || 0)}</td>
                  <td>${o.date || "-"}</td>
                  <td style="display:flex; gap:8px; flex-wrap:wrap;">
                    <button class="btn" onclick="LlevarUI.openOrder('${o.id}')">Abrir</button>
                    <button class="btn" onclick="LlevarUI.openDetailModal('${o.id}')">Ver</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="6">No hay pedidos para llevar.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div id="takeawayDetailModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:920px; width:min(92vw,920px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Detalle de pedido para llevar</h3>
            <p class="muted">Consulta la información del pedido y actualiza su estado.</p>
          </div>
          <button class="btn btn-danger" onclick="LlevarUI.closeDetailModal()">Cerrar</button>
        </div>
        <div id="takeawayDetailContent"></div>
      </div>
    </div>
  `;
}

const LlevarUI = {
  createOrder() {
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

  openOrder(id) {
    const take = AppDB.find("takeawayOrders", o => o.id === id);
    if (!take) return;

    let order = AppDB.find("orders", o => o.type === "LLEVAR" && o.refId === id && o.status === "OPEN");

    AppState.draftOrder = null;

    if (!order) {
      order = AppDB.insert("orders", {
        id: Utils.uid("ORD"),
        type: "LLEVAR",
        refId: take.id,
        refName: take.code,
        status: "OPEN",
        subtotal: Number(take.total || 0),
        total: Number(take.total || 0),
        createdAt: take.date || Utils.now(),
        updatedAt: Utils.now(),
        customerName: take.customer || "",
        customerNit: take.nit || "CF"
      });
    }

    AppState.currentOrderId = order.id;
    Router.loadView("orden");
  },

  openDetailModal(id) {
    const modal = document.getElementById("takeawayDetailModal");
    const content = document.getElementById("takeawayDetailContent");
    if (!modal || !content) return;

    const take = AppDB.find("takeawayOrders", o => o.id === id);
    if (!take) return;

    const order = AppDB.find("orders", o => o.type === "LLEVAR" && o.refId === id);
    const items = order ? AppDB.filter("orderItems", i => i.orderId === order.id) : [];
    const totalQty = items.reduce((acc, item) => acc + Number(item.qty || 0), 0);

    content.innerHTML = `
      <div class="cash-grid">
        <div class="card cash-card">
          <div class="summary-line"><span>Código</span><strong>${take.code}</strong></div>
          <div class="summary-line"><span>Cliente</span><strong>${take.customer || "Cliente"}</strong></div>
          <div class="summary-line"><span>NIT</span><strong>${take.nit || "CF"}</strong></div>
          <div class="summary-line"><span>Total</span><strong>${Utils.currency(take.total || 0)}</strong></div>
          <div class="summary-line"><span>Fecha</span><strong>${take.date || "-"}</strong></div>
          <div class="summary-line"><span>Cantidad</span><strong>${totalQty}</strong></div>

          <label class="field-label">Estatus</label>
          <select id="takeawayStatusSelect" class="input">
            <option value="EN_PREPARACION" ${take.status === "EN_PREPARACION" ? "selected" : ""}>EN PREPARACIÓN</option>
            <option value="ENTREGADO" ${take.status === "ENTREGADO" ? "selected" : ""}>ENTREGADO</option>
          </select>

          <div class="toolbar" style="margin-top:14px;">
            <button class="btn btn-primary" onclick="LlevarUI.saveStatus('${take.id}')">Guardar estatus</button>
            <button class="btn" onclick="LlevarUI.openOrder('${take.id}'); LlevarUI.closeDetailModal();">Abrir pedido</button>
          </div>
        </div>

        <div class="card cash-card">
          <h3 style="margin-bottom:10px;">Detalle del pedido</h3>
          <div class="order-items-list">
            ${
              items.length
                ? items.map(item => `
                  <div class="order-item-row ${item.sent ? "sent" : "pending"}">
                    <div class="order-item-top">
                      <div>
                        <div class="order-item-name">${item.qty} x ${item.name}</div>
                        <div class="order-item-meta">${item.kitchenName} · ${item.sent ? "ENVIADO" : "PENDIENTE"}</div>
                      </div>
                      <div class="order-item-total">${Utils.currency(item.total)}</div>
                    </div>
                    ${item.note ? `<div class="item-note-box">Nota: ${item.note}</div>` : ""}
                  </div>
                `).join("")
                : `<div class="placeholder">Este pedido no tiene productos asociados.</div>`
            }
          </div>
        </div>
      </div>
    `;

    modal.classList.add("open");
  },

  closeDetailModal() {
    const modal = document.getElementById("takeawayDetailModal");
    if (!modal) return;
    modal.classList.remove("open");
  },

  saveStatus(id) {
    const select = document.getElementById("takeawayStatusSelect");
    const status = select?.value || "EN_PREPARACION";
    AppDB.update("takeawayOrders", id, { status, updatedAt: Utils.now() });
    this.closeDetailModal();
    Router.loadView("llevar");
  }
};
