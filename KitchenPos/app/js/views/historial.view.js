function renderHistorialView() {
  const session = Auth.getSession();

  let sales = AppDB.getAll("sales").slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));

  if (session?.role !== "ADMIN") {
    sales = sales.filter(s => s.cashierId === session?.userId);
  }

  return `
    <div class="section-head">
      <div>
        <h2>Órdenes cerradas</h2>
        <p class="muted">
          ${session?.role === "ADMIN"
            ? "Vista general de todos los turnos, cajeros y órdenes cerradas."
            : "Vista de tus órdenes cerradas durante tus turnos."}
        </p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
      </div>
    </div>

    <div class="table-box">
      <table class="table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Ticket</th>
            <th>Tipo</th>
            <th>Referencia</th>
            <th>Cliente</th>
            <th>Cajero</th>
            <th>Método</th>
            <th>Total</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${
            sales.length
              ? sales.map(s => `
                <tr>
                  <td>${s.date || "-"}</td>
                  <td>${s.ticketNo || "-"}</td>
                  <td>${s.orderType || "-"}</td>
                  <td>${s.orderRefName || "-"}</td>
                  <td>${s.customerName || "Consumidor final"}</td>
                  <td>${s.cashierName || "No registrado"}</td>
                  <td>${s.method || "-"}</td>
                  <td><strong>${Utils.currency(s.total || 0)}</strong></td>
                  <td>
                    <button class="btn" onclick="HistorialUI.openDetail('${s.id}')">Ver</button>
                    <button class="btn btn-primary" onclick="HistorialUI.reprint('${s.id}')">Reimprimir</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="9">No hay órdenes cerradas para mostrar.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div id="saleDetailModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:920px; width:min(94vw,920px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Detalle de orden cerrada</h3>
            <p class="muted">Información completa de la venta.</p>
          </div>
          <button class="btn btn-danger" onclick="HistorialUI.closeDetail()">Cerrar</button>
        </div>

        <div id="saleDetailContent"></div>
      </div>
    </div>
  `;
}

const HistorialUI = {
  getSale(id) {
    return AppDB.find("sales", s => s.id === id);
  },

  openDetail(id) {
    const sale = this.getSale(id);
    if (!sale) return;

    const items = sale.items || [];
    const modal = document.getElementById("saleDetailModal");
    const content = document.getElementById("saleDetailContent");

    content.innerHTML = `
      <section class="config-grid">
        <article class="card config-card">
          <h3>Resumen</h3>
          <div class="summary-line"><span>Ticket</span><strong>${sale.ticketNo || "-"}</strong></div>
          <div class="summary-line"><span>Fecha</span><strong>${sale.date || "-"}</strong></div>
          <div class="summary-line"><span>Tipo</span><strong>${sale.orderType || "-"}</strong></div>
          <div class="summary-line"><span>Referencia</span><strong>${sale.orderRefName || "-"}</strong></div>
          <div class="summary-line"><span>Cajero</span><strong>${sale.cashierName || "No registrado"}</strong></div>
          <div class="summary-line"><span>Cliente</span><strong>${sale.customerName || "Consumidor final"}</strong></div>
          <div class="summary-line"><span>NIT</span><strong>${sale.customerNit || "CF"}</strong></div>
          <div class="summary-line"><span>Método</span><strong>${sale.method || "-"}</strong></div>
          <div class="summary-line"><span>Total</span><strong>${Utils.currency(sale.total || 0)}</strong></div>
          <div class="summary-line"><span>Recibido</span><strong>${Utils.currency(sale.received || sale.total || 0)}</strong></div>
          <div class="summary-line"><span>Cambio</span><strong>${Utils.currency(sale.change || 0)}</strong></div>
          ${sale.note ? `<div class="summary-line"><span>Observación</span><strong>${sale.note}</strong></div>` : ""}
        </article>

        <article class="card config-card">
          <h3>Productos</h3>
          <div class="table-box">
            <table class="table">
              <thead>
                <tr>
                  <th>Cant.</th>
                  <th>Producto</th>
                  <th>Área</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${
                  items.length
                    ? items.map(i => `
                      <tr>
                        <td>${i.qty}</td>
                        <td>${i.name}${i.note ? `<br><span class="muted">Nota: ${i.note}</span>` : ""}</td>
                        <td>${i.kitchenName || "-"}</td>
                        <td>${Utils.currency(i.total || 0)}</td>
                      </tr>
                    `).join("")
                    : `<tr><td colspan="4">Esta venta no tiene detalle guardado.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    modal.classList.add("open");
  },

  closeDetail() {
    document.getElementById("saleDetailModal").classList.remove("open");
  },

  reprint(id) {
    const sale = this.getSale(id);
    if (!sale) return;

    const order = {
      type: sale.orderType || "VENTA",
      refName: sale.orderRefName || "-",
      customerName: sale.customerName || "Consumidor final",
      customerNit: sale.customerNit || "CF"
    };

    printComboVentaComandas({
      order,
      items: sale.items || [],
      ticketNo: sale.ticketNo,
      method: sale.method,
      total: sale.total,
      received: sale.received,
      change: sale.change,
      note: sale.note,
      kitchenGroups: {}
    });
  }
};