function renderCajaView() {
  const session = CajaUI.getOpenSession();
  const movements = AppDB.getAll("cashMovements")
    .filter(m => !session || m.sessionId === session.id)
    .sort((a, b) => b.ts - a.ts);

  const sales = AppDB.getAll("sales");

  let salesTotal = 0;
  let efectivo = 0;
  let tarjeta = 0;
  let transferencia = 0;

  if (session) {
    const openTs = session.openTs || 0;
    const sessionSales = sales.filter(s => (s.ts || 0) >= openTs && !s.cashSessionIdClosed);

    salesTotal = sessionSales.reduce((acc, s) => acc + Number(s.total || 0), 0);
    efectivo = sessionSales
      .filter(s => s.method === "Efectivo")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);
    tarjeta = sessionSales
      .filter(s => s.method === "Tarjeta")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);
    transferencia = sessionSales
      .filter(s => s.method === "Transferencia")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);
  }

  const ingresos = movements
    .filter(m => m.type === "INGRESO")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const egresos = movements
    .filter(m => m.type === "EGRESO")
    .reduce((acc, m) => acc + Number(m.amount || 0), 0);

  const expectedCash = session
    ? Number(session.openingAmount || 0) + efectivo + ingresos - egresos
    : 0;

  return `
    <div class="section-head">
      <div>
        <h2>Caja</h2>
        <p class="muted">Apertura, movimientos y cierre del turno.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
      </div>
    </div>

    <section class="stats-grid">
      <article class="stat-card">
        <div class="muted small">Estado</div>
        <div class="stat-value">${session ? "ABIERTA" : "CERRADA"}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Fondo inicial</div>
        <div class="stat-value">${Utils.currency(session?.openingAmount || 0)}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Ventas del turno</div>
        <div class="stat-value">${Utils.currency(salesTotal)}</div>
      </article>

      <article class="stat-card">
        <div class="muted small">Esperado en efectivo</div>
        <div class="stat-value">${Utils.currency(expectedCash)}</div>
      </article>
    </section>

    <section class="panel-section">
      <div class="toolbar">
        ${
          session
            ? `
              <button class="btn" onclick="CajaUI.openMovementModal('INGRESO')">Ingreso manual</button>
              <button class="btn" onclick="CajaUI.openMovementModal('EGRESO')">Egreso manual</button>
              <button class="btn btn-primary" onclick="CajaUI.openCloseModal()">Cerrar caja</button>
            `
            : `
              <button class="btn btn-primary" onclick="CajaUI.openOpenModal()">Abrir caja</button>
            `
        }
      </div>
    </section>

    <section class="config-grid">
      <article class="card config-card">
        <h3>Resumen del turno</h3>

        <div class="cash-summary-grid">
          <div class="cash-summary-box">
            <div class="small muted">Efectivo</div>
            <div class="cash-big">${Utils.currency(efectivo)}</div>
          </div>

          <div class="cash-summary-box">
            <div class="small muted">Tarjeta</div>
            <div class="cash-big">${Utils.currency(tarjeta)}</div>
          </div>

          <div class="cash-summary-box">
            <div class="small muted">Transferencia</div>
            <div class="cash-big">${Utils.currency(transferencia)}</div>
          </div>

          <div class="cash-summary-box">
            <div class="small muted">Ingresos manuales</div>
            <div class="cash-big">${Utils.currency(ingresos)}</div>
          </div>

          <div class="cash-summary-box">
            <div class="small muted">Egresos manuales</div>
            <div class="cash-big">${Utils.currency(egresos)}</div>
          </div>
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
                      <td>${m.date}</td>
                      <td>${m.type}</td>
                      <td>${Utils.currency(m.amount)}</td>
                      <td>${m.note || ""}</td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="4">Sin movimientos de caja.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="card config-card">
        <h3>Historial de cierres</h3>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Usuario</th>
                <th>Esperado</th>
                <th>Real</th>
                <th>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              ${
                AppDB.getAll("cashClosings").length
                  ? AppDB.getAll("cashClosings").slice().reverse().map(c => `
                    <tr>
                      <td>${c.date}</td>
                      <td>${c.userName}</td>
                      <td>${Utils.currency(c.expectedCash)}</td>
                      <td>${Utils.currency(c.realCash)}</td>
                      <td>${Utils.currency(c.difference)}</td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="5">Sin cierres registrados.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <div id="openCashModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Abrir caja</h3>
            <p class="muted">Ingresa el fondo inicial del turno.</p>
          </div>
          <button class="btn btn-danger" onclick="CajaUI.closeOpenModal()">Cerrar</button>
        </div>

        <label class="field-label">Fondo inicial</label>
        <input id="openingAmount" class="input" type="number" min="0" step="0.01" value="0.00" />
        <label class="field-label">Observación</label>
        <textarea id="openingNote" class="input" rows="3" placeholder="Opcional"></textarea>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="CajaUI.confirmOpenCash()">Confirmar apertura</button>
        </div>
      </div>
    </div>

    <div id="movementModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="movementTitle" style="margin-bottom:4px;">Movimiento de caja</h3>
            <p class="muted">Registra ingresos o egresos manuales.</p>
          </div>
          <button class="btn btn-danger" onclick="CajaUI.closeMovementModal()">Cerrar</button>
        </div>

        <input type="hidden" id="movementType" />

        <label class="field-label">Monto</label>
        <input id="movementAmount" class="input" type="number" min="0" step="0.01" value="0.00" />

        <label class="field-label">Concepto</label>
        <textarea id="movementNote" class="input" rows="3" placeholder="Ejemplo: compra urgente, vuelto, gasto menor"></textarea>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="CajaUI.saveMovement()">Guardar movimiento</button>
        </div>
      </div>
    </div>

    <div id="closeCashModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Cerrar caja</h3>
            <p class="muted">Confirma el dinero real en caja.</p>
          </div>
          <button class="btn btn-danger" onclick="CajaUI.closeCloseModal()">Cerrar</button>
        </div>

        <label class="field-label">Efectivo esperado</label>
        <input id="expectedCashAmount" class="input" readonly value="${expectedCash.toFixed(2)}" />

        <label class="field-label">Efectivo real contado</label>
        <input id="realCashAmount" class="input" type="number" min="0" step="0.01" value="${expectedCash.toFixed(2)}" oninput="CajaUI.refreshDifference()" />

        <label class="field-label">Contraseña del cajero que abrió caja</label>
        <input id="closeCashPassword" class="input" type="password" placeholder="Requerido para cerrar turno" />
        <p class="muted small" style="margin-top:6px;">Caja abierta por: ${session?.userName || "Usuario"}</p>

        <label class="field-label">Diferencia</label>
        <input id="cashDifference" class="input" readonly value="0.00" />

        <label class="field-label">Observación</label>
        <textarea id="closeCashNote" class="input" rows="3" placeholder="Opcional"></textarea>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="CajaUI.confirmCloseCash()">Confirmar cierre</button>
        </div>
      </div>
    </div>
  `;
}

const CajaUI = {
  getOpenSession() {
    return AppDB.find("cashSessions", s => s.status === "OPEN") || null;
  },

  getSessionSummary(session) {
    if (!session) return null;

    const movements = AppDB.getAll("cashMovements")
      .filter(m => m.sessionId === session.id);

    const sales = AppDB.getAll("sales")
      .filter(s => s.cashSessionId === session.id || ((s.ts || 0) >= (session.openTs || 0) && !s.cashSessionIdClosed));

    const salesTotal = sales.reduce((acc, s) => acc + Number(s.total || 0), 0);

    const efectivo = sales
      .filter(s => s.method === "Efectivo")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);

    const tarjeta = sales
      .filter(s => s.method === "Tarjeta")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);

    const transferencia = sales
      .filter(s => s.method === "Transferencia")
      .reduce((acc, s) => acc + Number(s.total || 0), 0);

    const ingresos = movements
      .filter(m => m.type === "INGRESO")
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);

    const egresos = movements
      .filter(m => m.type === "EGRESO")
      .reduce((acc, m) => acc + Number(m.amount || 0), 0);

    const expectedCash = Number(session.openingAmount || 0) + efectivo + ingresos - egresos;

    return {
      sales,
      movements,
      salesTotal,
      efectivo,
      tarjeta,
      transferencia,
      ingresos,
      egresos,
      expectedCash
    };
  },

  openOpenModal() {
    document.getElementById("openCashModal").classList.add("open");
  },

  closeOpenModal() {
    document.getElementById("openCashModal").classList.remove("open");
  },

  confirmOpenCash() {
    if (this.getOpenSession()) {
      alert("Ya hay una caja abierta.");
      return;
    }

    const amount = Number(document.getElementById("openingAmount").value || 0);
    const note = document.getElementById("openingNote").value.trim();
    const user = Auth.getSession();

    if (!["ADMIN", "CAJERO"].includes(user?.role)) {
      alert("Solo ADMIN o CAJERO pueden abrir caja.");
      return;
    }

    if (amount < 0) {
      alert("El fondo inicial no puede ser negativo.");
      return;
    }

    AppDB.insert("cashSessions", {
      id: Utils.uid("CS"),
      status: "OPEN",
      openingAmount: amount,
      note,
      openTs: Date.now(),
      openedAt: Utils.now(),
      date: Utils.now(),
      userId: user?.userId || "",
      userName: user?.name || "Usuario",
      userRole: user?.role || ""
    });

    this.closeOpenModal();
    Router.loadView("caja");
  },

  openMovementModal(type) {
    const session = this.getOpenSession();

    if (!session) {
      alert("Debes abrir caja primero.");
      return;
    }

    document.getElementById("movementType").value = type;
    document.getElementById("movementTitle").textContent =
      type === "INGRESO" ? "Ingreso manual" : "Egreso manual";

    document.getElementById("movementAmount").value = "0.00";
    document.getElementById("movementNote").value = "";
    document.getElementById("movementModal").classList.add("open");
  },

  closeMovementModal() {
    document.getElementById("movementModal").classList.remove("open");
  },

  saveMovement() {
    const session = this.getOpenSession();

    if (!session) {
      alert("No hay caja abierta.");
      return;
    }

    const type = document.getElementById("movementType").value;
    const amount = Number(document.getElementById("movementAmount").value || 0);
    const note = document.getElementById("movementNote").value.trim();
    const user = Auth.getSession();

    if (!type) {
      alert("Movimiento inválido.");
      return;
    }

    if (amount <= 0) {
      alert("El monto debe ser mayor a cero.");
      return;
    }

    if (!note) {
      alert("Debes escribir el concepto del movimiento.");
      return;
    }

    AppDB.insert("cashMovements", {
      id: Utils.uid("CM"),
      sessionId: session.id,
      type,
      amount,
      note,
      date: Utils.now(),
      ts: Date.now(),
      userId: user?.userId || "",
      userName: user?.name || "Usuario"
    });

    this.closeMovementModal();
    Router.loadView("caja");
  },

  openCloseModal() {
    const session = this.getOpenSession();

    if (!session) {
      alert("No hay caja abierta.");
      return;
    }

    const summary = this.getSessionSummary(session);
    document.getElementById("expectedCashAmount").value = summary.expectedCash.toFixed(2);
    document.getElementById("realCashAmount").value = summary.expectedCash.toFixed(2);
    document.getElementById("cashDifference").value = "0.00";
    document.getElementById("closeCashNote").value = "";

    const passInput = document.getElementById("closeCashPassword");
    if (passInput) passInput.value = "";

    document.getElementById("closeCashModal").classList.add("open");
  },

  closeCloseModal() {
    document.getElementById("closeCashModal").classList.remove("open");
  },

  refreshDifference() {
    const expected = Number(document.getElementById("expectedCashAmount").value || 0);
    const real = Number(document.getElementById("realCashAmount").value || 0);
    const difference = real - expected;

    document.getElementById("cashDifference").value = difference.toFixed(2);
  },

  confirmCloseCash() {
    const session = this.getOpenSession();

    if (!session) {
      alert("No hay caja abierta.");
      return;
    }

    const passwordInput = document.getElementById("closeCashPassword");
    const password = passwordInput ? passwordInput.value.trim() : "";
    const openerUser = AppDB.find("users", u => u.id === session.userId);

    if (!openerUser) {
      alert("No se encontró el usuario que abrió la caja.");
      return;
    }

    if (!password) {
      alert("Debes ingresar la contraseña del cajero que abrió la caja.");
      return;
    }

    if (openerUser.password !== password) {
      alert("Contraseña incorrecta. Solo el cajero que abrió la caja puede cerrar el turno.");
      return;
    }

    const summary = this.getSessionSummary(session);
    const realCash = Number(document.getElementById("realCashAmount").value || 0);
    const note = document.getElementById("closeCashNote").value.trim();
    const difference = realCash - summary.expectedCash;
    const user = Auth.getSession();

    if (realCash < 0) {
      alert("El efectivo contado no puede ser negativo.");
      return;
    }

    const closingNo = `C-${String(AppDB.getAll("cashClosings").length + 1).padStart(4, "0")}`;
    const closedAt = Utils.now();
    const closedTs = Date.now();

    const closing = AppDB.insert("cashClosings", {
      id: Utils.uid("CC"),
      closingNo,
      sessionId: session.id,
      userId: user?.userId || "",
      userName: user?.name || "Usuario",
      openedByUserId: session.userId || "",
      openedByUserName: session.userName || "Usuario",
      openedAt: session.openedAt || session.date || "",
      closedAt,
      date: closedAt,
      openTs: session.openTs || 0,
      closedTs,
      openingAmount: Number(session.openingAmount || 0),
      salesTotal: summary.salesTotal,
      efectivo: summary.efectivo,
      tarjeta: summary.tarjeta,
      transferencia: summary.transferencia,
      ingresos: summary.ingresos,
      egresos: summary.egresos,
      expectedCash: summary.expectedCash,
      realCash,
      difference,
      note,
      status: difference === 0 ? "CUADRADO" : difference > 0 ? "SOBRA" : "FALTA"
    });

    summary.sales.forEach(sale => {
      AppDB.update("sales", sale.id, {
        cashSessionId: session.id,
        cashSessionIdClosed: session.id,
        cashClosingId: closing.id
      });
    });

    AppDB.update("cashSessions", session.id, {
      status: "CLOSED",
      closedAt,
      closedTs,
      closingId: closing.id,
      realCash,
      difference
    });

    this.closeCloseModal();

    printCierre({
      closingNo,
      userName: closing.userName,
      openedAt: closing.openedAt,
      closedAt: closing.closedAt,
      openingAmount: closing.openingAmount,
      salesTotal: closing.salesTotal,
      efectivo: closing.efectivo,
      tarjeta: closing.tarjeta,
      transferencia: closing.transferencia,
      ingresos: closing.ingresos,
      egresos: closing.egresos,
      expectedCash: closing.expectedCash,
      realCash: closing.realCash,
      difference: closing.difference,
      note: closing.note
    });

    Router.loadView("caja");
  }
};