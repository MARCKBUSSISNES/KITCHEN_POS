function renderVisorOrdenes(options = {}) {
  const root = document.getElementById("visorApp");
  if (!root) return;

  if (window.KDSUI && typeof KDSUI.saveScrollState === "function") {
    KDSUI.saveScrollState();
  }

  const kitchens = AppDB.getAll("kitchens").filter(k => k.active !== false);
  const selected = JSON.parse(localStorage.getItem("kds_selected_kitchens") || "[]");

  const activeKitchenIds = selected.length
    ? selected
    : kitchens.map(k => k.id);

  const items = AppDB.getAll("orderItems")
    .filter(i =>
      i.sent === true &&
      i.kdsStatus === "PREPARACION" &&
      i.delivered !== true &&
      activeKitchenIds.includes(i.kitchenId)
    );

  const groups = {};

  items.forEach(item => {
    const key = `${item.orderId}_${item.kitchenId}`;

    if (!groups[key]) {
      const order = AppDB.find("orders", o => o.id === item.orderId);
      if (!order) return;

      groups[key] = {
        key,
        order,
        kitchenId: item.kitchenId,
        kitchenName: item.kitchenName || "Sin área",
        sentAt: item.sentAt || item.createdAt || Date.now(),
        sentByName: item.sentByName || "No registrado",
        items: []
      };
    }

    groups[key].items.push(item);
  });

  const cards = Object.values(groups)
    .sort((a, b) => Number(a.sentAt || 0) - Number(b.sentAt || 0));

  const signature = KDSUI.getRenderSignature(kitchens, activeKitchenIds, cards);

  if (!options.force && root.dataset.kdsSignature === signature) {
    KDSUI.updateLiveMinutes(cards);
    KDSUI.restoreScrollState();
    return;
  }

  root.dataset.kdsSignature = signature;

  root.innerHTML = `
    <div class="kds-topbar">
      <div class="kds-filters">
        ${kitchens.map(k => `
          <button class="kds-filter ${activeKitchenIds.includes(k.id) ? "active" : ""}"
            onclick="KDSUI.toggleKitchen('${KDSUI.escapeJs(k.id)}')">
            ${KDSUI.escapeHtml(k.name)}
          </button>
        `).join("")}
      </div>

      <div class="kds-actions">
        <button class="kds-action-btn refresh" onclick="renderVisorOrdenes({ force:true })">Actualizar</button>
        <button class="kds-action-btn close" onclick="window.close()">Cerrar visor</button>
      </div>
    </div>

    <section class="kds-stage">
      <button class="kds-scroll-arrow left" onclick="KDSUI.scrollByAmount(-1)" title="Mover izquierda">‹</button>
      <button class="kds-scroll-arrow right" onclick="KDSUI.scrollByAmount(1)" title="Mover derecha">›</button>

      <div id="kdsScroller" class="kds-grid" onscroll="KDSUI.saveScrollState()">
        ${
          cards.length
            ? cards.map(card => KDSUI.renderCard(card)).join("")
            : `<div class="kds-empty">No hay órdenes pendientes.</div>`
        }
      </div>
    </section>
  `;

  KDSUI.restoreScrollState();
}

const KDSUI = {
  scrollKey: "kds_scroll_left_v3",
  verticalScrollKey: "kds_vertical_scrolls_v3",

  escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  escapeJs(value) {
    return String(value ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  },

  getScroller() {
    return document.getElementById("kdsScroller");
  },

  getRenderSignature(kitchens, activeKitchenIds, cards) {
    const kitchenPart = kitchens
      .map(k => `${k.id}:${k.name}:${activeKitchenIds.includes(k.id) ? 1 : 0}`)
      .join("|");

    const cardPart = cards.map(card => {
      const order = card.order || {};
      const items = card.items
        .map(i => `${i.id}:${i.qty}:${i.name}:${i.note || ""}:${i.kdsStatus}:${i.delivered ? 1 : 0}`)
        .join(",");

      const areaName = order.tableAreaName || order.areaName || card.items?.[0]?.tableAreaName || card.items?.[0]?.areaName || "";
      return `${card.key}:${order.type}:${order.refName}:${areaName}:${card.kitchenName}:${card.sentAt}:${card.sentByName}:${items}`;
    }).join("|");

    return `${kitchenPart}::${cardPart}`;
  },

  saveScrollState() {
    const scroller = this.getScroller();
    if (scroller) {
      localStorage.setItem(this.scrollKey, String(scroller.scrollLeft || 0));
    }

    const verticals = {};
    document.querySelectorAll(".kds-items[data-scroll-key]").forEach(el => {
      verticals[el.dataset.scrollKey] = el.scrollTop || 0;
    });

    localStorage.setItem(this.verticalScrollKey, JSON.stringify(verticals));
  },

  restoreScrollState() {
    const scroller = this.getScroller();
    if (scroller) {
      const saved = Number(localStorage.getItem(this.scrollKey) || 0);
      if (Number.isFinite(saved)) {
        scroller.scrollLeft = saved;
      }
    }

    let verticals = {};
    try {
      verticals = JSON.parse(localStorage.getItem(this.verticalScrollKey) || "{}");
    } catch {
      verticals = {};
    }

    document.querySelectorAll(".kds-items[data-scroll-key]").forEach(el => {
      const savedTop = Number(verticals[el.dataset.scrollKey] || 0);
      if (Number.isFinite(savedTop)) {
        el.scrollTop = savedTop;
      }
    });
  },

  saveScroll() {
    this.saveScrollState();
  },

  restoreScroll() {
    this.restoreScrollState();
  },

  updateLiveMinutes(cards) {
    cards.forEach(card => {
      const el = document.querySelector(`[data-kds-time-key="${CSS.escape(card.key)}"]`);
      if (el) el.textContent = `${this.getMinutes(card.sentAt)} min`;
    });
  },

  scrollByAmount(direction) {
    const scroller = this.getScroller();
    if (!scroller) return;

    const amount = Math.max(420, Math.floor(scroller.clientWidth * 0.82));
    scroller.scrollBy({ left: direction * amount, behavior: "smooth" });

    setTimeout(() => this.saveScrollState(), 420);
  },

  toggleKitchen(kitchenId) {
    this.saveScrollState();

    const kitchens = AppDB.getAll("kitchens").filter(k => k.active !== false);
    let selected = JSON.parse(localStorage.getItem("kds_selected_kitchens") || "[]");

    if (!selected.length) {
      selected = kitchens.map(k => k.id);
    }

    if (selected.includes(kitchenId)) {
      selected = selected.filter(id => id !== kitchenId);
    } else {
      selected.push(kitchenId);
    }

    localStorage.setItem("kds_selected_kitchens", JSON.stringify(selected));
    renderVisorOrdenes({ force: true });
  },

  getOriginType(order) {
    if (!order) return "ORDEN";
    if (order.type === "MESA") return "COMER AQUÍ";
    if (order.type === "LLEVAR") return "PARA LLEVAR";
    if (order.type === "DOMICILIO") return "A DOMICILIO";
    return String(order.type || "ORDEN");
  },

  getOriginClass(order) {
    if (!order) return "mesa";
    if (order.type === "LLEVAR") return "llevar";
    if (order.type === "DOMICILIO") return "domicilio";
    return "mesa";
  },

  getMesaArea(order, firstItem = null) {
    if (!order || order.type !== "MESA") return "";

    const mesa = AppDB.find("mesas", m => m.id === order.refId);
    return order.tableAreaName ||
      order.areaName ||
      firstItem?.tableAreaName ||
      firstItem?.areaName ||
      mesa?.area ||
      "Sin área";
  },

  getOriginLabel(order, firstItem = null) {
    if (!order) return "-";

    if (order.type === "MESA") {
      return `Comer aquí · ${this.getMesaArea(order, firstItem)} · ${order.refName || "-"}`;
    }

    if (order.type === "LLEVAR") return `Para llevar · ${order.refName || "-"}`;
    if (order.type === "DOMICILIO") return `A domicilio · ${order.refName || "-"}`;

    return `${order.type || "Orden"} · ${order.refName || "-"}`;
  },

  getMinutes(sentAt) {
    const diff = Date.now() - Number(sentAt || Date.now());
    return Math.max(0, Math.floor(diff / 60000));
  },

  renderCard(card) {
    const minutes = this.getMinutes(card.sentAt);
    const late = minutes >= 20 ? "late" : "";
    const orderType = this.getOriginType(card.order);
    const orderClass = this.getOriginClass(card.order);
    const orderNumber = card.order?.refName || "-";
    const mesaArea = this.getMesaArea(card.order, card.items?.[0]);

    return `
      <article class="kds-card ${late}">
        <div class="kds-order-banner ${orderClass}">
          <div>
            <div class="kds-order-type">${this.escapeHtml(orderType)}</div>
            ${card.order?.type === "MESA" ? `<div class="kds-order-area">${this.escapeHtml(mesaArea)}</div>` : ""}
            <div class="kds-order-number">${this.escapeHtml(orderNumber)}</div>
          </div>

          <div class="kds-time" data-kds-time-key="${this.escapeHtml(card.key)}">${minutes} min</div>
        </div>

        <div class="kds-title">${this.escapeHtml(card.kitchenName)}</div>
        <div class="kds-origin">${this.escapeHtml(this.getOriginLabel(card.order, card.items?.[0]))}</div>

        <div class="kds-meta">
          <div><strong>Comandó:</strong> ${this.escapeHtml(card.sentByName)}</div>
          <div><strong>Fecha:</strong> ${this.escapeHtml(card.items[0]?.sentDate || "-")}</div>
        </div>

        <div class="kds-items" data-scroll-key="${this.escapeHtml(card.key)}" onscroll="KDSUI.saveScrollState()">
          ${card.items.map(i => `
            <div class="kds-item">
              <strong>${this.escapeHtml(i.qty)}x ${this.escapeHtml(i.name)}</strong>
              ${i.note ? `<div class="kds-note">Nota: ${this.escapeHtml(i.note)}</div>` : ""}
              <div class="kds-item-actions">
                <button class="kds-small-btn" onclick="KDSUI.deliverLine('${this.escapeJs(i.id)}')">Entregar línea</button>
                <button class="kds-small-btn danger" onclick="KDSUI.removeLine('${this.escapeJs(i.id)}')">Quitar</button>
              </div>
            </div>
          `).join("")}
        </div>

        <button class="kds-deliver-btn" onclick="KDSUI.deliver('${this.escapeJs(card.order.id)}', '${this.escapeJs(card.kitchenId)}')">
          Entregar pedido
        </button>
      </article>
    `;
  },

  async deliverLine(itemId) {
    this.saveScrollState();
    await AppDB.init();

    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

    AppDB.update("orderItems", item.id, {
      delivered: true,
      kdsStatus: "ENTREGADO",
      deliveredAt: Date.now(),
      deliveredDate: Utils.now()
    });

    await AppDB.init();
    renderVisorOrdenes({ force: true });
  },

  async removeLine(itemId) {
    this.saveScrollState();
    await AppDB.init();

    const item = AppDB.find("orderItems", i => i.id === itemId);
    if (!item) return;

    if (!confirm(`¿Quitar "${item.name}" del visor?`)) return;

    AppDB.update("orderItems", item.id, {
      delivered: true,
      kdsStatus: "QUITADO",
      removedFromKds: true,
      removedAt: Date.now(),
      removedDate: Utils.now()
    });

    await AppDB.init();
    renderVisorOrdenes({ force: true });
  },

  async deliver(orderId, kitchenId) {
    this.saveScrollState();
    await AppDB.init();

    const items = AppDB.filter("orderItems", i =>
      i.orderId === orderId &&
      i.kitchenId === kitchenId &&
      i.sent === true &&
      i.delivered !== true &&
      i.kdsStatus === "PREPARACION"
    );

    if (!items.length) return;

    if (!confirm("¿Marcar este pedido como entregado?")) return;

    items.forEach(item => {
      AppDB.update("orderItems", item.id, {
        delivered: true,
        kdsStatus: "ENTREGADO",
        deliveredAt: Date.now(),
        deliveredDate: Utils.now()
      });
    });

    await AppDB.init();
    renderVisorOrdenes({ force: true });
  }
};
