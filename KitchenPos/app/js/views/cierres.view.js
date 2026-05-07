function renderCierresView() {
  const session = Auth.getSession();
  const users = AppDB.getAll("users");

  const filters = AppState.closingFilters || {
    from: "",
    to: "",
    cashier: "ALL",
    min: "",
    max: ""
  };

  let closings = AppDB.getAll("cashClosings").slice();

  if (filters.from) {
    const fromTs = new Date(filters.from + "T00:00:00").getTime();
    closings = closings.filter(c => (c.closedTs || c.ts || 0) >= fromTs);
  }

  if (filters.to) {
    const toTs = new Date(filters.to + "T23:59:59").getTime();
    closings = closings.filter(c => (c.closedTs || c.ts || 0) <= toTs);
  }

  if (filters.cashier !== "ALL") {
    closings = closings.filter(c => c.userId === filters.cashier);
  }

  if (filters.min !== "") {
    closings = closings.filter(c => Number(c.salesTotal || 0) >= Number(filters.min));
  }

  if (filters.max !== "") {
    closings = closings.filter(c => Number(c.salesTotal || 0) <= Number(filters.max));
  }

  closings.sort((a, b) => (b.closedTs || 0) - (a.closedTs || 0));

  const totalSales = closings.reduce((acc, c) => acc + Number(c.salesTotal || 0), 0);
  const totalCash = closings.reduce((acc, c) => acc + Number(c.efectivo || 0), 0);
  const totalCard = closings.reduce((acc, c) => acc + Number(c.tarjeta || 0), 0);
  const totalTransfer = closings.reduce((acc, c) => acc + Number(c.transferencia || 0), 0);
  const totalDiff = closings.reduce((acc, c) => acc + Number(c.difference || 0), 0);

  return `
    <div class="section-head">
      <div>
        <h2>Listado de cierres</h2>
        <p class="muted">Consulta cierres de caja por fecha, cajero y montos.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver</button>
      </div>
    </div>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="muted small">Cierres</div>
        <div class="stat-value">${closings.length}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Ventas</div>
        <div class="stat-value">${Utils.currency(totalSales)}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Efectivo</div>
        <div class="stat-value">${Utils.currency(totalCash)}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Diferencia</div>
        <div class="stat-value">${Utils.currency(totalDiff)}</div>
      </article>
    </section>

    <section class="card config-card" style="margin-top:18px;">
      <h3>Filtros</h3>

      <div class="cash-summary-grid">
        <div>
          <label class="field-label">Desde</label>
          <input id="closeFilterFrom" class="input" type="date" value="${filters.from}">
        </div>

        <div>
          <label class="field-label">Hasta</label>
          <input id="closeFilterTo" class="input" type="date" value="${filters.to}">
        </div>

        <div>
          <label class="field-label">Cajero</label>
          <select id="closeFilterCashier" class="input">
            <option value="ALL">Todos</option>
            ${users.map(u => `
              <option value="${u.id}" ${filters.cashier === u.id ? "selected" : ""}>
                ${u.name} - ${u.role}
              </option>
            `).join("")}
          </select>
        </div>

        <div>
          <label class="field-label">Monto mínimo</label>
          <input id="closeFilterMin" class="input" type="number" step="0.01" value="${filters.min}">
        </div>

        <div>
          <label class="field-label">Monto máximo</label>
          <input id="closeFilterMax" class="input" type="number" step="0.01" value="${filters.max}">
        </div>
      </div>

      <div class="toolbar" style="margin-top:16px;">
        <button class="btn btn-primary" onclick="CierresUI.applyFilters()">Aplicar filtros</button>
        <button class="btn" onclick="CierresUI.clearFilters()">Limpiar</button>
      </div>
    </section>

    <section class="card config-card" style="margin-top:18px;">
      <h3>Resumen por métodos</h3>

      <div class="cash-summary-grid">
        <div class="cash-summary-box">
          <div class="small muted">Efectivo</div>
          <div class="cash-big">${Utils.currency(totalCash)}</div>
        </div>

        <div class="cash-summary-box">
          <div class="small muted">Tarjeta</div>
          <div class="cash-big">${Utils.currency(totalCard)}</div>
        </div>

        <div class="cash-summary-box">
          <div class="small muted">Transferencia</div>
          <div class="cash-big">${Utils.currency(totalTransfer)}</div>
        </div>

        <div class="cash-summary-box">
          <div class="small muted">Ventas totales</div>
          <div class="cash-big">${Utils.currency(totalSales)}</div>
        </div>

        <div class="cash-summary-box">
          <div class="small muted">Diferencia</div>
          <div class="cash-big">${Utils.currency(totalDiff)}</div>
        </div>
      </div>
    </section>

    <div class="table-box" style="margin-top:18px;">
      <table class="table">
        <thead>
          <tr>
            <th>No.</th>
            <th>Fecha cierre</th>
            <th>Cajero</th>
            <th>Apertura</th>
            <th>Ventas</th>
            <th>Efectivo</th>
            <th>Tarjeta</th>
            <th>Transferencia</th>
            <th>Esperado</th>
            <th>Real</th>
            <th>Diferencia</th>
            <th>Estado</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${
            closings.length
              ? closings.map(c => `
                <tr>
                  <td>${c.closingNo || c.id || "-"}</td>
                  <td>${c.closedAt || c.date || "-"}</td>
                  <td>${c.userName || "-"}</td>
                  <td>${Utils.currency(c.openingAmount || 0)}</td>
                  <td>${Utils.currency(c.salesTotal || 0)}</td>
                  <td>${Utils.currency(c.efectivo || 0)}</td>
                  <td>${Utils.currency(c.tarjeta || 0)}</td>
                  <td>${Utils.currency(c.transferencia || 0)}</td>
                  <td>${Utils.currency(c.expectedCash || 0)}</td>
                  <td>${Utils.currency(c.realCash || 0)}</td>
                  <td>${Utils.currency(c.difference || 0)}</td>
                  <td>
                    <span class="badge ${
                      Number(c.difference || 0) === 0 ? "ok" :
                      Number(c.difference || 0) > 0 ? "warn" : "danger"
                    }">
                      ${c.status || (Number(c.difference || 0) === 0 ? "CUADRADO" : Number(c.difference || 0) > 0 ? "SOBRA" : "FALTA")}
                    </span>
                  </td>
                  <td>
                    <button class="btn" onclick="CierresUI.viewDetail('${c.id}')">Ver</button>
                    <button class="btn btn-primary" onclick="CierresUI.reprint('${c.id}')">Reimprimir</button>
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="13">No hay cierres con esos filtros.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div id="closingDetailModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:920px; width:min(94vw,920px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Detalle de cierre</h3>
            <p class="muted">Información completa del cierre seleccionado.</p>
          </div>
          <button class="btn btn-danger" onclick="CierresUI.closeDetail()">Cerrar</button>
        </div>

        <div id="closingDetailContent"></div>
      </div>
    </div>
  `;
}

const CierresUI = {
  applyFilters() {
    AppState.closingFilters = {
      from: document.getElementById("closeFilterFrom").value,
      to: document.getElementById("closeFilterTo").value,
      cashier: document.getElementById("closeFilterCashier").value,
      min: document.getElementById("closeFilterMin").value,
      max: document.getElementById("closeFilterMax").value
    };

    Router.loadView("cierres");
  },

  clearFilters() {
    AppState.closingFilters = {
      from: "",
      to: "",
      cashier: "ALL",
      min: "",
      max: ""
    };

    Router.loadView("cierres");
  },

  getClosing(id) {
    return AppDB.find("cashClosings", c => c.id === id);
  },

  viewDetail(id) {
    const c = this.getClosing(id);
    if (!c) return;

    const sales = AppDB.getAll("sales")
      .filter(s => s.cashClosingId === c.id || s.cashSessionIdClosed === c.sessionId);

    const movements = AppDB.getAll("cashMovements")
      .filter(m => m.sessionId === c.sessionId);

    const content = document.getElementById("closingDetailContent");

    content.innerHTML = `
      <section class="config-grid">
        <article class="card config-card">
          <h3>Resumen del cierre</h3>

          <div class="summary-line"><span>No.</span><strong>${c.closingNo || "-"}</strong></div>
          <div class="summary-line"><span>Cajero</span><strong>${c.userName || "-"}</strong></div>
          <div class="summary-line"><span>Abrió</span><strong>${c.openedAt || "-"}</strong></div>
          <div class="summary-line"><span>Cerró</span><strong>${c.closedAt || c.date || "-"}</strong></div>
          <div class="summary-line"><span>Fondo inicial</span><strong>${Utils.currency(c.openingAmount || 0)}</strong></div>
          <div class="summary-line"><span>Ventas</span><strong>${Utils.currency(c.salesTotal || 0)}</strong></div>
          <div class="summary-line"><span>Efectivo esperado</span><strong>${Utils.currency(c.expectedCash || 0)}</strong></div>
          <div class="summary-line"><span>Efectivo real</span><strong>${Utils.currency(c.realCash || 0)}</strong></div>
          <div class="summary-line"><span>Diferencia</span><strong>${Utils.currency(c.difference || 0)}</strong></div>
          <div class="summary-line"><span>Estado</span><strong>${c.status || "-"}</strong></div>
          ${c.note ? `<div class="summary-line"><span>Observación</span><strong>${c.note}</strong></div>` : ""}
        </article>

        <article class="card config-card">
          <h3>Ventas incluidas</h3>
          <div class="table-box">
            <table class="table">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Fecha</th>
                  <th>Método</th>
                  <th>Total</th>
                  <th>Cliente</th>
                </tr>
              </thead>
              <tbody>
                ${
                  sales.length
                    ? sales.map(s => `
                      <tr>
                        <td>${s.ticketNo || "-"}</td>
                        <td>${s.date || "-"}</td>
                        <td>${s.method || "-"}</td>
                        <td>${Utils.currency(s.total || 0)}</td>
                        <td>${s.customerName || "Consumidor final"}</td>
                      </tr>
                    `).join("")
                    : `<tr><td colspan="5">No hay ventas vinculadas.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </article>

        <article class="card config-card">
          <h3>Movimientos de caja</h3>
          <div class="table-box">
            <table class="table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Concepto</th>
                </tr>
              </thead>
              <tbody>
                ${
                  movements.length
                    ? movements.map(m => `
                      <tr>
                        <td>${m.date || "-"}</td>
                        <td>${m.type || "-"}</td>
                        <td>${Utils.currency(m.amount || 0)}</td>
                        <td>${m.note || ""}</td>
                      </tr>
                    `).join("")
                    : `<tr><td colspan="4">No hay movimientos.</td></tr>`
                }
              </tbody>
            </table>
          </div>
        </article>
      </section>
    `;

    document.getElementById("closingDetailModal").classList.add("open");
  },

  closeDetail() {
    document.getElementById("closingDetailModal").classList.remove("open");
  },

  reprint(id) {
    const c = this.getClosing(id);
    if (!c) return;

    printCierre({
      closingNo: c.closingNo,
      userName: c.userName,
      openedAt: c.openedAt,
      closedAt: c.closedAt || c.date,
      openingAmount: c.openingAmount,
      salesTotal: c.salesTotal,
      efectivo: c.efectivo,
      tarjeta: c.tarjeta,
      transferencia: c.transferencia,
      ingresos: c.ingresos,
      egresos: c.egresos,
      expectedCash: c.expectedCash,
      realCash: c.realCash,
      difference: c.difference,
      note: c.note
    });
  }
};