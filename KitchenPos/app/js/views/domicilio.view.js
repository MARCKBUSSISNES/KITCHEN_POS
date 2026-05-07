function renderDomicilioView() {
const openSession = AppDB.find("cashSessions", s => s.status === "OPEN");

const orders = AppDB.getAll("deliveryOrders")
  .filter(o => {
    if (o.status !== "PAGADO") return true;

    if (!openSession) return false;

    return o.cashSessionId === openSession.id;
  })
  .slice()
  .sort((a, b) => (b.ts || 0) - (a.ts || 0));

  return `
    <div class="section-head">
      <div>
        <h2>Pedidos a domicilio</h2>
        <p class="muted">Pedidos pendientes, en ruta y pagos al regresar motorista.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver</button>
        <button class="btn btn-primary" onclick="DomicilioUI.newOrder()">Nuevo domicilio</button>
      </div>
    </div>

    <div class="table-box">
      <table class="table">
        <thead>
          <tr>
            <th>Código</th>
            <th>Cliente</th>
            <th>Teléfono</th>
            <th>Estado</th>
            <th>Total</th>
            <th>Fecha</th>
            <th>Acción</th>
          </tr>
        </thead>
        <tbody>
          ${
            orders.length
              ? orders.map(o => `
                <tr>
                  <td>${o.code || "-"}</td>
                  <td>${o.customerName || "-"}</td>
                  <td>${o.customerPhone || "-"}</td>
                  <td>
                    <span class="badge ${
                      o.status === "PAGADO" ? "ok" :
                      o.status === "PENDIENTE_PAGO" ? "warn" :
                      "danger"
                    }">${o.status || "PENDIENTE"}</span>
                  </td>
                  <td>${Utils.currency(o.total || 0)}</td>
                  <td>${o.date || "-"}</td>
                  <td style="display:flex; gap:8px; flex-wrap:wrap;">
                    ${
                      o.status !== "PAGADO"
                        ? `<button class="btn" onclick="DomicilioUI.openOrder('${o.id}')">Abrir</button>`
                        : ""
                    }
                    ${
                      o.status !== "PAGADO"
                        ? `<button class="btn btn-primary" onclick="DomicilioUI.openPayModal('${o.id}')">Marcar pagado</button>`
                        : `<button class="btn" onclick="DomicilioUI.reprint('${o.id}')">Reimprimir</button>`
                    }
                  </td>
                </tr>
              `).join("")
              : `<tr><td colspan="7">No hay pedidos a domicilio.</td></tr>`
          }
        </tbody>
      </table>
    </div>

    <div id="deliveryCustomerModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:760px; width:min(94vw,760px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Nuevo pedido a domicilio</h3>
            <p class="muted">Busca o registra el cliente para entrega.</p>
          </div>
          <button class="btn btn-danger" onclick="DomicilioUI.closeCustomerModal()">Cerrar</button>
        </div>

        <label class="field-label">Teléfono</label>
        <input id="deliveryPhone" class="input" placeholder="Número de teléfono" oninput="DomicilioUI.findCustomerByPhone()" />

        <label class="field-label">Nombre del cliente</label>
        <input id="deliveryName" class="input" placeholder="Nombre del cliente" />

        <label class="field-label">Dirección de entrega</label>
        <textarea id="deliveryAddress" class="input" rows="3" placeholder="Dirección completa de entrega"></textarea>

        <label class="field-label">Indicaciones</label>
        <textarea id="deliveryNotes" class="input" rows="3" placeholder="Ejemplo: portón negro, segundo nivel, llamar al llegar"></textarea>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="DomicilioUI.createDeliveryFromModal()">Crear pedido</button>
        </div>
      </div>
    </div>

    <div id="deliveryPayModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:720px; width:min(94vw,720px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Registrar pago domicilio</h3>
            <p class="muted">El pedido se convierte en venta hasta confirmar el pago.</p>
          </div>
          <button class="btn btn-danger" onclick="DomicilioUI.closePayModal()">Cerrar</button>
        </div>

        <input type="hidden" id="deliveryPayId" />

        <div class="card cash-card" style="margin-bottom:14px;">
          <div class="summary-line">
            <span>Pedido</span>
            <strong id="deliveryPayCode">-</strong>
          </div>
          <div class="summary-line">
            <span>Cliente</span>
            <strong id="deliveryPayCustomer">-</strong>
          </div>
          <div class="summary-line summary-total">
            <span>Total</span>
            <strong id="deliveryPayTotal">Q 0.00</strong>
          </div>
        </div>

        <label class="field-label">Método de pago</label>
        <select id="deliveryPayMethod" class="input" onchange="DomicilioUI.refreshPayModal()">
          <option value="Efectivo">Efectivo</option>
          <option value="Tarjeta">Tarjeta</option>
          <option value="Transferencia">Transferencia</option>
        </select>

        <label class="field-label">Monto recibido</label>
        <input id="deliveryPayReceived" class="input" type="number" min="0" step="0.01" oninput="DomicilioUI.refreshPayModal()" />

        <label class="field-label">Cambio</label>
        <input id="deliveryPayChange" class="input" readonly value="0.00" />

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="DomicilioUI.confirmPayOrder()">Confirmar pago</button>
        </div>
      </div>
    </div>
  `;
}

const DomicilioUI = {
  newOrder() {
    const modal = document.getElementById("deliveryCustomerModal");

    if (!modal) {
      alert("No se encontró el modal de cliente domicilio.");
      return;
    }

    document.getElementById("deliveryPhone").value = "";
    document.getElementById("deliveryName").value = "";
    document.getElementById("deliveryAddress").value = "";
    document.getElementById("deliveryNotes").value = "";

    modal.classList.add("open");

    setTimeout(() => {
      document.getElementById("deliveryPhone")?.focus();
    }, 100);
  },

  closeCustomerModal() {
    document.getElementById("deliveryCustomerModal")?.classList.remove("open");
  },

  findCustomerByPhone() {
    const phone = document.getElementById("deliveryPhone").value.trim();
    if (!phone) return;

    const customer = AppDB.find("customers", c => String(c.phone || "") === phone);

    if (customer) {
      document.getElementById("deliveryName").value = customer.name || "";
      document.getElementById("deliveryAddress").value = customer.address || "";
      document.getElementById("deliveryNotes").value = customer.notes || "";
    }
  },

  createDeliveryFromModal() {
    const phone = document.getElementById("deliveryPhone").value.trim();
    const name = document.getElementById("deliveryName").value.trim();
    const address = document.getElementById("deliveryAddress").value.trim();
    const notes = document.getElementById("deliveryNotes").value.trim();

    if (!phone || !name || !address) {
      alert("Completa teléfono, nombre y dirección.");
      return;
    }

    let customer = AppDB.find("customers", c => String(c.phone || "") === phone);

    if (customer) {
      AppDB.update("customers", customer.id, {
        name,
        address,
        notes,
        updatedAt: Utils.now()
      });

      customer = AppDB.find("customers", c => c.id === customer.id);
    } else {
      customer = AppDB.insert("customers", {
        id: Utils.uid("CL"),
        name,
        phone,
        address,
        notes,
        createdAt: Utils.now(),
        ts: Date.now()
      });
    }

    const next = AppDB.getAll("deliveryOrders").length + 1;

    const delivery = AppDB.insert("deliveryOrders", {
      id: Utils.uid("DOM"),
      code: `DOM-${String(next).padStart(4, "0")}`,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerAddress: customer.address,
      customerNotes: customer.notes,
      status: "PENDIENTE",
      total: 0,
      date: Utils.now(),
      ts: Date.now(),
      updatedAt: Utils.now()
    });

    const order = AppDB.insert("orders", {
      id: Utils.uid("ORD"),
      type: "DOMICILIO",
      refId: delivery.id,
      refName: delivery.code,
      status: "OPEN",
      subtotal: 0,
      total: 0,
      createdAt: Utils.now(),
      updatedAt: Utils.now(),
      customerName: customer.name,
      customerNit: "CF"
    });

    this.closeCustomerModal();

    AppState.currentOrderId = order.id;
    AppState.draftOrder = null;
    Router.loadView("orden");
  },

  openOrder(id) {
    const delivery = AppDB.find("deliveryOrders", d => d.id === id);
    if (!delivery) return;

    let order = AppDB.find("orders", o => o.type === "DOMICILIO" && o.refId === id && o.status === "OPEN");

    if (!order) {
      alert("Este pedido ya no tiene orden abierta.");
      return;
    }

    AppState.currentOrderId = order.id;
    AppState.draftOrder = null;
    Router.loadView("orden");
  },

  openPayModal(id) {
    const delivery = AppDB.find("deliveryOrders", d => d.id === id);
    if (!delivery) return;

    const openCashSession = AppDB.find("cashSessions", s => s.status === "OPEN");
    if (!openCashSession) {
      alert("No puedes cobrar porque no hay una caja abierta.");
      return;
    }

    document.getElementById("deliveryPayId").value = id;
    document.getElementById("deliveryPayCode").textContent = delivery.code || "-";
    document.getElementById("deliveryPayCustomer").textContent = `${delivery.customerName || "-"} / ${delivery.customerPhone || "-"}`;
    document.getElementById("deliveryPayTotal").textContent = Utils.currency(delivery.total || 0);
    document.getElementById("deliveryPayMethod").value = "Efectivo";
    document.getElementById("deliveryPayReceived").value = Number(delivery.total || 0).toFixed(2);
    document.getElementById("deliveryPayReceived").removeAttribute("readonly");
    document.getElementById("deliveryPayChange").value = "0.00";
    document.getElementById("deliveryPayModal").classList.add("open");

    this.refreshPayModal();
  },

  closePayModal() {
    document.getElementById("deliveryPayModal")?.classList.remove("open");
  },

  refreshPayModal() {
    const id = document.getElementById("deliveryPayId")?.value;
    const delivery = AppDB.find("deliveryOrders", d => d.id === id);
    if (!delivery) return;

    const method = document.getElementById("deliveryPayMethod").value;
    const receivedInput = document.getElementById("deliveryPayReceived");
    const total = Number(delivery.total || 0);
    let received = Number(receivedInput.value || 0);

    if (method !== "Efectivo") {
      received = total;
      receivedInput.value = total.toFixed(2);
      receivedInput.setAttribute("readonly", "readonly");
    } else {
      receivedInput.removeAttribute("readonly");
    }

    const change = Math.max(0, received - total);
    document.getElementById("deliveryPayChange").value = change.toFixed(2);
  },

  confirmPayOrder() {
    const id = document.getElementById("deliveryPayId")?.value;
    const delivery = AppDB.find("deliveryOrders", d => d.id === id);

    if (!delivery) {
      alert("No se encontró el pedido a domicilio.");
      return;
    }

    const openCashSession = AppDB.find("cashSessions", s => s.status === "OPEN");
    if (!openCashSession) {
      alert("No puedes cobrar porque no hay una caja abierta.");
      return;
    }

    const method = document.getElementById("deliveryPayMethod").value;
    const received = Number(document.getElementById("deliveryPayReceived").value || 0);
    const total = Number(delivery.total || 0);
    const change = Math.max(0, received - total);

    if (method === "Efectivo" && received < total) {
      alert("El monto recibido es menor al total.");
      return;
    }

    const order = AppDB.find("orders", o => o.type === "DOMICILIO" && o.refId === id);
    const items = order ? AppDB.filter("orderItems", i => i.orderId === order.id) : [];

    const ticketNo = `T-${String(AppDB.getAll("sales").length + 1).padStart(4, "0")}`;
    const user = Auth.getSession();

    AppDB.insert("sales", {
      id: Utils.uid("SALE"),
      ticketNo,
      date: Utils.now(),
      ts: Date.now(),
      method,
      total,
      received,
      change,
      note: "Pago domicilio",
      customerName: delivery.customerName,
      customerNit: "CF",
      orderId: order?.id || "",
      cashSessionId: openCashSession.id,
      cashierId: user?.userId || "",
      cashierName: user?.name || "Usuario",
      cashierRole: user?.role || "",
      orderType: "DOMICILIO",
      orderRefName: delivery.code,
      deliveryAddress: delivery.customerAddress,
      deliveryPhone: delivery.customerPhone,
      deliveryNotes: delivery.customerNotes,
      items
    });

AppDB.update("deliveryOrders", id, {
  status: "PAGADO",
  paidAt: Utils.now(),
  paymentMethod: method,
  ticketNo,
  received,
  change,
  cashSessionId: openCashSession.id,
  updatedAt: Utils.now()
});

    if (order) {
      AppDB.update("orders", order.id, {
        status: "CLOSED",
        ticketNo,
        paymentMethod: method,
        received,
        change,
        closedAt: Utils.now()
      });
    }

    printComboVentaComandas({
      order: {
        type: "DOMICILIO",
        refName: delivery.code,
        customerName: delivery.customerName,
        customerNit: "CF"
      },
      items,
      ticketNo,
      method,
      total,
      received,
      change,
      note: `Domicilio: ${delivery.customerAddress || ""}`,
      kitchenGroups: {}
    });

    this.closePayModal();
    Router.loadView("domicilio");
  },

  payOrder(id) {
    this.openPayModal(id);
  },

  reprint(id) {
    const delivery = AppDB.find("deliveryOrders", d => d.id === id);
    if (!delivery) return;

    const sale = AppDB.find("sales", s => s.orderRefName === delivery.code);
    if (!sale) {
      alert("No se encontró la venta para reimprimir.");
      return;
    }

    printComboVentaComandas({
      order: {
        type: "DOMICILIO",
        refName: sale.orderRefName,
        customerName: sale.customerName,
        customerNit: sale.customerNit || "CF"
      },
      items: sale.items || [],
      ticketNo: sale.ticketNo,
      method: sale.method,
      total: sale.total,
      received: sale.received,
      change: sale.change,
      note: `Domicilio: ${sale.deliveryAddress || ""}`,
      kitchenGroups: {}
    });
  }
};