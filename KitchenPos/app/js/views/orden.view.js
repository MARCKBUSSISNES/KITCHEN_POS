function renderOrdenView() {
  if (typeof AppDB.reload === "function") AppDB.reload();
  const order = OrdenUI.getCurrentOrder();

  if (!order) {
    return `
      <div class="card" style="padding:18px;">
        <h2>No hay una orden activa</h2>
        <p class="muted">Regresa al panel y abre una mesa o un pedido para llevar.</p>
        <button class="btn" onclick="Router.loadView('dashboard')">Volver</button>
      </div>
    `;
  }

  OrdenUI.ensureMenuState();

  const items = order.id && !String(order.id).startsWith("DRAFT-")
    ? AppDB.filter("orderItems", i =>
        i.orderId === order.id &&
        i.deleted !== true &&
        i.cancelled !== true
      )
    : [];

  const allProducts = AppDB
    .getAll("products")
    .filter(p => p.active !== false);

  const categories = OrdenUI.getStructuredCategories(allProducts);
  const selectedParent = OrdenUI.resolveSelectedParent(categories);
  const subcategories = OrdenUI.getSubcategoriesForParent(categories, selectedParent);
  const selectedSub = OrdenUI.resolveSelectedSubcategory(subcategories);

  const products = allProducts.filter(p => {
    const parent = p.parentCategory || p.categoryParent || p.category || "General";
    const sub = p.subcategory || p.category || "General";
    const parentOk = selectedParent === "ALL" || parent === selectedParent;
    const subOk = selectedSub === "ALL" || sub === selectedSub;
    return parentOk && subOk;
  });

  const subtotal = items.reduce((acc, item) => acc + Number(item.total || 0), 0);
  const totalItems = items.reduce((acc, item) => acc + Number(item.qty || 0), 0);

  const pendientes = items.filter(i => !i.sent);
  const enviados = items.filter(i => i.sent);

  const typeLabel = order.type === "MESA"
    ? `Mesa: ${order.refName}`
    : `Para llevar: ${order.refName || "Nuevo pedido"}`;

  const primaryChargeLabel =
  order.type === "DOMICILIO"
    ? "Comandar domicilio"
    : order.type === "LLEVAR"
      ? "Cobrar y enviar"
      : "Cobrar";

  return `
    <div class="section-head">
      <div>
        <h2>Orden activa</h2>
        <p class="muted">${typeLabel}</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="OrdenUI.backToOrigin('${order.type}')">Volver</button>
        <button class="btn" onclick="OrdenUI.sendToKitchen()">Enviar a cocina/bar</button>
        <button class="btn" onclick="OrdenUI.printPreCuenta()">Precuenta</button>
        <button class="btn btn-primary" onclick="${order.type === "DOMICILIO" ? "OrdenUI.commandDelivery()" : "CobroUI.open()"}">
  ${primaryChargeLabel}
</button>
      </div>
    </div>

    <section class="orden-layout">
      <article class="card" style="padding:18px;">
        <div class="section-head" style="margin-bottom:14px;">
          <div>
            <h3 style="margin-bottom:4px;">Productos</h3>
            <p class="muted">Elige un menú padre, luego una categoría, y después agrega productos.</p>
          </div>
        </div>

        <div class="card" style="padding:14px; margin-bottom:16px; background:rgba(255,255,255,.02);">
          <div style="margin-bottom:8px;">
            <strong>Menús principales</strong>
          </div>
          <div class="toolbar" style="gap:10px;">
            ${categories.map(cat => `
              <button class="btn ${selectedParent === cat.name ? 'btn-primary' : ''}" onclick="OrdenUI.selectParentCategory('${OrdenUI.escapeForJs(cat.name)}')">
                ${cat.name}
              </button>
            `).join("")}
          </div>

          <div style="margin:14px 0 8px;">
            <strong>Categorías</strong>
          </div>
          <div class="toolbar" style="gap:10px;">
            <button class="btn ${selectedSub === 'ALL' ? 'btn-primary' : ''}" onclick="OrdenUI.selectSubcategory('ALL')">Todas</button>
            ${subcategories.map(sub => `
              <button class="btn ${selectedSub === sub ? 'btn-primary' : ''}" onclick="OrdenUI.selectSubcategory('${OrdenUI.escapeForJs(sub)}')">
                ${sub}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="product-grid">
          ${
            products.length
              ? products.map(p => `
                <article class="card product-card mini-product-card" onclick="OrdenUI.addProduct('${p.id}')">
                  <div class="product-thumb">
                    ${p.image ? `<img src="${p.image}" alt="${p.name}">` : "SIN IMAGEN"}
                  </div>
                  <h3>${p.name}</h3>
                  <p class="muted">${p.parentCategory || p.categoryParent || p.category || "General"} · ${p.subcategory || p.category || "General"}</p>
                  <p><strong>${Utils.currency(p.price)}</strong></p>
                </article>
              `).join("")
              : `<div class="placeholder">No hay productos activos en esta categoría.</div>`
          }
        </div>
      </article>

      <article class="card" style="padding:18px;">
        <div class="section-head" style="margin-bottom:14px;">
          <div>
            <h3 style="margin-bottom:4px;">Detalle de orden</h3>
            <p class="muted">Administra cantidades, notas y estado de envío.</p>
          </div>
        </div>

        <div class="order-items-list">
          ${
            items.length
              ? items.map(item => `
                <div class="order-item-row ${item.sent ? 'sent' : 'pending'}">
                  <div class="order-item-top">
                    <div>
                      <div class="order-item-name">${item.name}</div>
                      <div class="order-item-meta">
                        ${item.kitchenName} · ${item.sent ? "ENVIADO" : "PENDIENTE"}
                      </div>
                    </div>

                    <div class="order-item-total">
                      ${Utils.currency(item.total)}
                    </div>
                  </div>

                  <div class="order-item-controls">
                    <div class="qty-box">
                      <button class="qty-btn" onclick="OrdenUI.decreaseQty('${item.id}')">-</button>
                      <span class="qty-value">${item.qty}</span>
                      <button class="qty-btn" onclick="OrdenUI.increaseQty('${item.id}')">+</button>
                    </div>

                    <div class="item-price-box">
                      ${Utils.currency(item.price)} c/u
                    </div>

                    <button class="btn" onclick="OrdenUI.editNote('${item.id}')">
                      ${item.note ? "Editar nota" : "Agregar nota"}
                    </button>

                    <button class="btn btn-danger" onclick="OrdenUI.removeLine('${item.id}')">
                      Eliminar
                    </button>
                  </div>

                  ${item.note ? `<div class="item-note-box">Nota: ${item.note}</div>` : ``}
                </div>
              `).join("")
              : `<div class="placeholder">No hay productos en la orden.</div>`
          }
        </div>

        <div class="order-summary">
          <div class="summary-line">
            <span>Productos distintos</span>
            <strong>${items.length}</strong>
          </div>

          <div class="summary-line">
            <span>Cantidad total</span>
            <strong>${totalItems}</strong>
          </div>

          <div class="summary-line">
            <span>Pendientes de envío</span>
            <strong>${pendientes.length}</strong>
          </div>

          <div class="summary-line">
            <span>Ya enviados</span>
            <strong>${enviados.length}</strong>
          </div>

          <div class="summary-line summary-total">
            <span>Total</span>
            <strong>${Utils.currency(subtotal)}</strong>
          </div>
        </div>
      </article>
    </section>

    <div id="cashModal" class="modal-backdrop">
      <div class="modal cash-modal" style="max-width:960px; width:min(94vw,960px);">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Cobrar orden</h3>
            <p class="muted">${typeLabel}</p>
          </div>
          <button class="btn btn-danger" onclick="CobroUI.close()">Cerrar</button>
        </div>

        <div class="cash-grid">
          <div class="card cash-card">
            <label class="field-label">Nombre del cliente</label>
            <input id="customerName" class="input" value="${order.customerName || ""}" placeholder="Consumidor final o nombre del cliente" />

            <label class="field-label">NIT</label>
            <input id="customerNit" class="input" value="${order.customerNit || "CF"}" placeholder="CF" />

            <label class="field-label">Método de pago</label>
            <select id="paymentMethod" class="input" onchange="CobroUI.refresh()">
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
              <option value="Transferencia">Transferencia</option>
            </select>

            <label class="field-label">Total a cobrar</label>
            <input id="chargeTotal" class="input" readonly value="${subtotal.toFixed(2)}" />

            <label class="field-label">Monto recibido</label>
            <input id="amountReceived" class="input" type="number" step="0.01" min="0" value="${subtotal.toFixed(2)}" oninput="CobroUI.refresh()" />

            <label class="field-label">Cambio</label>
            <input id="changeAmount" class="input" readonly value="0.00" />

            <label class="field-label">Observación</label>
            <textarea id="paymentNote" class="input" rows="3" placeholder="Opcional"></textarea>
          </div>

          <div class="card cash-card">
            <div class="cash-total-box">
              <div class="small muted">TOTAL</div>
              <div class="cash-total-value">${Utils.currency(subtotal)}</div>
            </div>

            <div class="cash-summary-lines">
              <div class="summary-line">
                <span>Productos</span>
                <strong>${items.length}</strong>
              </div>

              <div class="summary-line">
                <span>Cantidad</span>
                <strong>${totalItems}</strong>
              </div>

              <div class="summary-line">
                <span>Pendientes</span>
                <strong>${pendientes.length}</strong>
              </div>
            </div>

            <button class="btn btn-primary btn-block" onclick="CobroUI.confirmCharge()">
              Confirmar cobro
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

const OrdenUI = {
  getCurrentOrder() {
    return AppDB.find("orders", o => o.id === AppState.currentOrderId) || AppState.draftOrder;
  },

  ensureMenuState() {
    if (!AppState.orderMenuFilter) {
      AppState.orderMenuFilter = { parent: "ALL", subcategory: "ALL" };
    }
  },

  escapeForJs(value) {
    return String(value || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  },

  getStructuredCategories(products = AppDB.getAll("products").filter(p => p.active !== false)) {
    const dbCategories = AppDB.getAll("categories").filter(c => c.active !== false);
    const map = new Map();

    dbCategories.forEach(cat => {
      const parent = cat.parentName || cat.parentCategory || "General";
      const sub = cat.name || cat.subcategory || "General";
      if (!map.has(parent)) map.set(parent, new Set());
      map.get(parent).add(sub);
    });

    products.forEach(product => {
      const parent = product.parentCategory || product.categoryParent || product.category || "General";
      const sub = product.subcategory || product.category || "General";
      if (!map.has(parent)) map.set(parent, new Set());
      map.get(parent).add(sub);
    });

    return [...map.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([name, subs]) => ({
        name,
        subcategories: [...subs].sort((a, b) => a.localeCompare(b, 'es'))
      }));
  },

  resolveSelectedParent(categories) {
    this.ensureMenuState();
    const valid = categories.some(c => c.name === AppState.orderMenuFilter.parent);
    if (!valid) {
      AppState.orderMenuFilter.parent = categories[0]?.name || "ALL";
      AppState.orderMenuFilter.subcategory = "ALL";
    }
    return AppState.orderMenuFilter.parent;
  },

  getSubcategoriesForParent(categories, parent) {
    return categories.find(c => c.name === parent)?.subcategories || [];
  },

  resolveSelectedSubcategory(subcategories) {
    this.ensureMenuState();
    if (AppState.orderMenuFilter.subcategory !== "ALL" && !subcategories.includes(AppState.orderMenuFilter.subcategory)) {
      AppState.orderMenuFilter.subcategory = "ALL";
    }
    return AppState.orderMenuFilter.subcategory;
  },

  selectParentCategory(parentName) {
    this.ensureMenuState();
    AppState.orderMenuFilter.parent = parentName;
    AppState.orderMenuFilter.subcategory = "ALL";
    Router.loadView("orden");
  },

  selectSubcategory(subcategoryName) {
    this.ensureMenuState();
    AppState.orderMenuFilter.subcategory = subcategoryName;
    Router.loadView("orden");
  },

  ensurePersistedOrder() {
    let order = this.getCurrentOrder();
    if (!order) return null;
    if (!String(order.id || "").startsWith("DRAFT-")) return order;

    if (order.type === "LLEVAR") {
      const nextCount = AppDB.getAll("takeawayOrders").length + 1;
      const takeaway = AppDB.insert("takeawayOrders", {
        id: Utils.uid("LL"),
        code: `LLEVAR-${String(nextCount).padStart(4, "0")}`,
        customer: order.customerName || `Cliente ${nextCount}`,
        nit: order.customerNit || "CF",
        status: "EN_PREPARACION",
        total: 0,
        date: Utils.now(),
        ts: Date.now(),
        updatedAt: Utils.now()
      });

      order = AppDB.insert("orders", {
        id: Utils.uid("ORD"),
        type: "LLEVAR",
        refId: takeaway.id,
        refName: takeaway.code,
        status: "OPEN",
        subtotal: 0,
        total: 0,
        createdAt: Utils.now(),
        updatedAt: Utils.now(),
        customerName: takeaway.customer,
        customerNit: takeaway.nit
      });
    } else {
      order = AppDB.insert("orders", {
        id: Utils.uid("ORD"),
        type: "MESA",
        refId: AppState.draftOrder.refId,
        refName: AppState.draftOrder.refName,
        areaId: AppState.draftOrder.areaId || AppState.draftOrder.tableAreaId || "",
        areaName: AppState.draftOrder.areaName || AppState.draftOrder.tableAreaName || "Sin área",
        tableAreaId: AppState.draftOrder.tableAreaId || AppState.draftOrder.areaId || "",
        tableAreaName: AppState.draftOrder.tableAreaName || AppState.draftOrder.areaName || "Sin área",
        status: "OPEN",
        subtotal: 0,
        total: 0,
        createdAt: Utils.now(),
        updatedAt: Utils.now()
      });
    }

    AppState.currentOrderId = order.id;
    AppState.draftOrder = null;
    return order;
  },

  backToOrigin(type) {
    const order = this.getCurrentOrder();

    if (order && !String(order.id || "").startsWith("DRAFT-")) {
      this.syncTableStatus(order.id);

      const items = AppDB.filter("orderItems", i =>
      i.orderId === order.id &&
      i.deleted !== true &&
      i.cancelled !== true
    );
      if (order.type === "MESA" && items.length === 0) {
        AppDB.delete("orders", order.id);
      }
      if (order.type === "LLEVAR" && items.length === 0) {
        const takeaway = AppDB.find("takeawayOrders", t => t.id === order.refId);
        if (takeaway && !takeaway.total) AppDB.delete("takeawayOrders", takeaway.id);
        AppDB.delete("orders", order.id);
      }
    }

    AppState.currentOrderId = null;
    AppState.draftOrder = null;
    Router.loadView(type === "MESA" ? "mesas" : type === "DOMICILIO" ? "domicilio" : "llevar");
  },

  syncTableStatus(orderId) {
    const order = AppDB.find("orders", o => o.id === orderId);
    if (!order || order.type !== "MESA") return;

    const items = AppDB.filter("orderItems", i =>
      i.orderId === order.id &&
      i.deleted !== true &&
      i.cancelled !== true
    );
    const hasItems = items.length > 0;

    AppDB.update("mesas", order.refId, {
      status: hasItems ? "ocupada" : "libre",
      open: hasItems,
      updatedAt: Utils.now()
    });
  },

  addProduct(productId) {
    let order = this.ensurePersistedOrder();
    const product = AppDB.find("products", p => p.id === productId);
    if (!order || !product) return;

    const kitchen = AppDB.find("kitchens", k => k.id === product.kitchenId);

    const existing = AppDB.find(
      "orderItems",
      i =>
        i.orderId === order.id &&
        i.productId === product.id &&
        !i.sent &&
        i.deleted !== true &&
        i.cancelled !== true &&
        (i.note || "") === ""
    );

    if (existing) {
      AppDB.update("orderItems", existing.id, {
        qty: existing.qty + 1,
        total: (existing.qty + 1) * Number(existing.price)
      });
    } else {
      AppDB.insert("orderItems", {
        id: Utils.uid("IT"),
        orderId: order.id,
        productId: product.id,
        name: product.name,
        qty: 1,
        price: Number(product.price),
        total: Number(product.price),
        kitchenId: product.kitchenId,
        kitchenName: kitchen?.name || "Sin área",
        sent: false,
        note: ""
      });
    }

    this.updateOrderTotals(order.id);
    Router.loadView("orden");
  },

  increaseQty(itemId) {
    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

AppDB.update("orderItems", item.id, {
  qty: item.qty + 1,
  total: (item.qty + 1) * Number(item.price)
});

    this.updateOrderTotals(item.orderId);
    Router.loadView("orden");
  },

  decreaseQty(itemId) {
    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

    if (item.qty > 1) {
AppDB.update("orderItems", item.id, {
  qty: item.qty - 1,
  total: (item.qty - 1) * Number(item.price)
});
    } else {
      AppDB.delete("orderItems", item.id);
    }

    this.updateOrderTotals(item.orderId);
    Router.loadView("orden");
  },

  removeLine(itemId) {
    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

    AppDB.delete("orderItems", item.id);
    this.updateOrderTotals(item.orderId);
    Router.loadView("orden");
  },

  editNote(itemId) {
    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

    const note = prompt("Escribe una nota para este producto:", item.note || "");
    if (note === null) return;

AppDB.update("orderItems", item.id, {
  note: note.trim()
});

    Router.loadView("orden");
  },

  updateOrderTotals(orderId) {
    const order = AppDB.find("orders", o => o.id === orderId);
    if (!order) return;

    const items = AppDB.filter("orderItems", i =>
      i.orderId === orderId &&
      i.deleted !== true &&
      i.cancelled !== true
    );
    const subtotal = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

    AppDB.update("orders", orderId, {
      subtotal,
      total: subtotal,
      updatedAt: Utils.now()
    });

    if (order.type === "LLEVAR") {
      const totalQty = items.reduce((acc, item) => acc + Number(item.qty || 0), 0);
      AppDB.update("takeawayOrders", order.refId, {
        total: subtotal,
        qty: totalQty,
        customer: order.customerName || AppDB.find("takeawayOrders", t => t.id === order.refId)?.customer || "Cliente",
        nit: order.customerNit || AppDB.find("takeawayOrders", t => t.id === order.refId)?.nit || "CF",
        status: subtotal > 0 ? "EN_PREPARACION" : "PENDIENTE",
        updatedAt: Utils.now()
      });
    }

    this.syncTableStatus(orderId);
  },

  async sendToKitchen(options = {}) {
  await AppDB.init();
    const order = this.getCurrentOrder();
    if (!order || String(order.id || "").startsWith("DRAFT-")) {
      if (!options.silent) alert("No hay productos nuevos por enviar.");
      return false;
    }

const items = AppDB.filter("orderItems", i =>
  i.orderId === order.id &&
  i.sent !== true &&
  i.delivered !== true &&
  i.deleted !== true &&
  i.cancelled !== true
);

if (!items.length) {
  if (!options.silent) alert("No hay productos nuevos por enviar.");
  return false;
}

const grouped = {};
const mesaInfo = order.type === "MESA"
  ? AppDB.find("mesas", m => m.id === order.refId)
  : null;
const tableAreaName = order.tableAreaName || order.areaName || mesaInfo?.area || "";
const tableAreaId = order.tableAreaId || order.areaId || mesaInfo?.areaId || "";

if (order.type === "MESA" && (tableAreaName || tableAreaId)) {
  AppDB.update("orders", order.id, {
    areaId: tableAreaId,
    areaName: tableAreaName || "Sin área",
    tableAreaId,
    tableAreaName: tableAreaName || "Sin área"
  });
}

items.forEach(item => {
  if (!grouped[item.kitchenName]) grouped[item.kitchenName] = [];
  grouped[item.kitchenName].push(item);
});

if (!options?.skipPrint) {
  if (typeof printComandasAgrupadas === "function") {
    printComandasAgrupadas({
      order,
      kitchenGroups: grouped
    });
  } else {
  }
}

const session = Auth.getSession();

items.forEach(item => {
AppDB.update("orderItems", item.id, {
  sent: true,
  sentAt: Date.now(),
  sentDate: Utils.now(),
  sentById: session?.userId || "",
  sentByName: session?.name || "Usuario",
  areaId: order.type === "MESA" ? tableAreaId : (item.areaId || ""),
  areaName: order.type === "MESA" ? (tableAreaName || "Sin área") : (item.areaName || ""),
  tableAreaId: order.type === "MESA" ? tableAreaId : (item.tableAreaId || ""),
  tableAreaName: order.type === "MESA" ? (tableAreaName || "Sin área") : (item.tableAreaName || ""),
  delivered: false,
  kdsStatus: "PREPARACION"
});
});

    if (order.type === "LLEVAR") {
      AppDB.update("takeawayOrders", order.refId, {
        status: "EN_PREPARACION",
        updatedAt: Utils.now()
      });
    }

    if (!options.silent) {
      const areas = Object.keys(grouped)
        .map(area => `${area}: ${grouped[area].length} producto(s)`)
        .join("\n");
      alert(`Comanda enviada correctamente:\n\n${areas}`);
    }

    if (!options.noReload) Router.loadView("orden");
    return true;
  },
commandDelivery() {
  const order = this.getCurrentOrder();

  if (!order || String(order.id || "").startsWith("DRAFT-")) {
    alert("Agrega productos antes de comandar el domicilio.");
    return;
  }

  if (order.type !== "DOMICILIO") {
    alert("Esta función solo aplica para pedidos a domicilio.");
    return;
  }

  const items = AppDB.filter("orderItems", i =>
      i.orderId === order.id &&
      i.deleted !== true &&
      i.cancelled !== true
    );

  if (!items.length) {
    alert("Agrega productos antes de comandar el domicilio.");
    return;
  }

  const total = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const delivery = AppDB.find("deliveryOrders", d => d.id === order.refId);

  if (!delivery) {
    alert("No se encontró el pedido a domicilio.");
    return;
  }

  AppDB.update("orders", order.id, {
    subtotal: total,
    total,
    status: "OPEN",
    updatedAt: Utils.now()
  });

  AppDB.update("deliveryOrders", delivery.id, {
    status: "PENDIENTE_PAGO",
    total,
    updatedAt: Utils.now()
  });

  const pendingItems = AppDB.filter("orderItems", i =>
  i.orderId === order.id &&
  i.sent !== true &&
  i.delivered !== true &&
  i.deleted !== true &&
  i.cancelled !== true
);

  const grouped = {};
  pendingItems.forEach(item => {
    if (!grouped[item.kitchenName]) grouped[item.kitchenName] = [];
    grouped[item.kitchenName].push(item);
  });

  if (pendingItems.length) {
 const session = Auth.getSession();

pendingItems.forEach(item => {
  AppDB.update("orderItems", item.id, {
    sent: true,
    sentAt: Date.now(),
    sentDate: Utils.now(),
    sentById: session?.userId || "",
    sentByName: session?.name || "Usuario",
    delivered: false,
    kdsStatus: "PREPARACION"
  });
});

    // Las comandas de domicilio se imprimen juntas dentro de printDomicilioPack.
  }

setTimeout(() => {
  printDomicilioPack({
    delivery,
    order,
    items,
    kitchenGroups: grouped
  });
}, 500);

alert("Pedido a domicilio comandado. Queda pendiente de pago.");

AppState.currentOrderId = null;
AppState.draftOrder = null;

setTimeout(() => {
  Router.loadView("domicilio");
}, 800);
},
  printPreCuenta() {
    const order = this.getCurrentOrder();
    if (!order || String(order.id || "").startsWith("DRAFT-")) return;

    const items = AppDB.filter("orderItems", i =>
      i.orderId === order.id &&
      i.deleted !== true &&
      i.cancelled !== true
    );
    printPrecuenta({ order, items });
  }
};

const CobroUI = {
  open() {
    const openCashSession = AppDB.find("cashSessions", s => s.status === "OPEN");

    if (!openCashSession) {
      alert("No puedes cobrar porque no hay una caja abierta.");
      return;
    }

    const session = Auth.getSession();
    if (!["ADMIN", "CAJERO"].includes(session?.role)) {
      alert("Solo ADMIN o CAJERO pueden realizar cobros.");
      return;
    }

    const modal = document.getElementById("cashModal");
    if (!modal) return;
    modal.classList.add("open");
    this.refresh();
  },

  close() {
    const modal = document.getElementById("cashModal");
    if (!modal) return;
    modal.classList.remove("open");
  },

  refresh() {
    const totalInput = document.getElementById("chargeTotal");
    const receivedInput = document.getElementById("amountReceived");
    const changeInput = document.getElementById("changeAmount");
    const method = document.getElementById("paymentMethod")?.value || "Efectivo";

    if (!totalInput || !receivedInput || !changeInput) return;

    const total = Number(totalInput.value || 0);
    let received = Number(receivedInput.value || 0);

    if (method !== "Efectivo") {
      received = total;
      receivedInput.value = total.toFixed(2);
      receivedInput.setAttribute("readonly", "readonly");
    } else {
      receivedInput.removeAttribute("readonly");
    }

    const change = Math.max(0, received - total);
    changeInput.value = change.toFixed(2);
  },

  async confirmCharge() {
    let order = OrdenUI.getCurrentOrder();

    const openCashSession = AppDB.find("cashSessions", s => s.status === "OPEN");
    if (!openCashSession) {
      alert("No puedes cobrar porque no hay una caja abierta.");
      return;
    }

    const session = Auth.getSession();
    if (!["ADMIN", "CAJERO"].includes(session?.role)) {
      alert("Solo ADMIN o CAJERO pueden realizar cobros.");
      return;
    }

    if (!order || String(order.id || "").startsWith("DRAFT-")) {
      alert("Agrega productos antes de cobrar.");
      return;
    }
    
    const items = AppDB.filter("orderItems", i =>
      i.orderId === order.id &&
      i.deleted !== true &&
      i.cancelled !== true
    );
    if (!items.length) {
      alert("Agrega productos antes de cobrar.");
      return;
    }

    const method = document.getElementById("paymentMethod").value;
    const total = Number(document.getElementById("chargeTotal").value || 0);
    const received = Number(document.getElementById("amountReceived").value || 0);
    const change = Number(document.getElementById("changeAmount").value || 0);
    const note = document.getElementById("paymentNote").value.trim();
    const customerName = (document.getElementById("customerName").value || "").trim() || "Consumidor final";
    const customerNit = (document.getElementById("customerNit").value || "CF").trim() || "CF";

    if (method === "Efectivo" && received < total) {
      alert("El monto recibido es menor al total.");
      return;
    }

    AppDB.update("orders", order.id, {
      customerName,
      customerNit,
      total,
      subtotal: total,
      updatedAt: Utils.now()
    });

    let groupedForPrint = {};

    if (order.type === "LLEVAR") {
      const pendingItemsForKitchen = AppDB.filter("orderItems", i =>
        i.orderId === order.id &&
        !i.sent &&
        i.deleted !== true &&
        i.cancelled !== true
      );

      pendingItemsForKitchen.forEach(item => {
        if (!groupedForPrint[item.kitchenName]) {
          groupedForPrint[item.kitchenName] = [];
        }

        groupedForPrint[item.kitchenName].push(item);
      });

      AppDB.update("takeawayOrders", order.refId, {
        customer: customerName,
        nit: customerNit,
        total,
        status: "EN_PREPARACION",
        updatedAt: Utils.now()
      });

await OrdenUI.sendToKitchen({
  silent: true,
  noReload: true,
  skipPrint: true,
  forceKds: true
});

      order = AppDB.find("orders", o => o.id === order.id);
    }

    const ticketNo = `T-${String(AppDB.getAll("sales").length + 1).padStart(4, "0")}`;

AppDB.insert("sales", {
  id: Utils.uid("SALE"),
  ticketNo,
  date: Utils.now(),
  ts: Date.now(),
  method,
  total,
  received,
  change,
  note,
  customerName,
  customerNit,
  orderId: order.id,
  cashSessionId: openCashSession?.id || null,

  // 🔥 NUEVO (IMPORTANTE)
  cashierId: Auth.getSession()?.userId || "",
  cashierName: Auth.getSession()?.name || "Usuario",
  cashierRole: Auth.getSession()?.role || "",

  orderType: order.type,
  orderRefName: order.refName,

  // 🔥 GUARDA LOS PRODUCTOS
  items: items
});

    AppDB.update("orders", order.id, {
      status: order.type === "LLEVAR" ? "PAGADO_EN_PREPARACION" : "CLOSED",
      paymentStatus: "PAGADO",
      ticketNo,
      paymentMethod: method,
      received,
      change,
      paymentNote: note,
      customerName,
      customerNit,
      closedAt: order.type === "LLEVAR" ? null : Utils.now(),
      paidAt: Utils.now()
    });

    if (order.type === "MESA") {
      AppDB.update("mesas", order.refId, {
        status: "libre",
        open: false,
        updatedAt: Utils.now()
      });
    } else if (order.type === "LLEVAR") {
      AppDB.update("takeawayOrders", order.refId, {
        status: "EN_PREPARACION",
        paymentStatus: "PAGADO",
        total: Number(order.total || total),
        customer: customerName,
        nit: customerNit,
        updatedAt: Utils.now()
      });
    }

    printComboVentaComandas({
      order: { ...order, customerName, customerNit },
      items,
      ticketNo,
      method,
      total,
      received,
      change,
      note,
      kitchenGroups: groupedForPrint
    });
    this.close();
    alert(`Orden cobrada correctamente. Ticket ${ticketNo}`);
    AppState.currentOrderId = null;
    AppState.draftOrder = null;
    Router.loadView(order.type === "MESA" ? "mesas" : "llevar");
  }
};
