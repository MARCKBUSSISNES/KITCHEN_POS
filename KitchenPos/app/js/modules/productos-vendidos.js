const ProductosVendidosModule = {
  list() {
    return AppDB.getAll("sales");
  },

  getRows(filters = {}) {
    const sales = AppDB.getAll("sales").slice();
    const rows = [];

    sales.forEach(sale => {
      const saleTs = Number(sale.ts || 0) || ProductosVendidosModule.parseDateTs(sale.date);
      const items = Array.isArray(sale.items) ? sale.items : [];

      items.forEach(item => {
        const qty = Number(item.qty || 0);
        const total = Number(item.total || (Number(item.price || 0) * qty));
        const price = Number(item.price || (qty ? total / qty : 0));
        const itemTs = Number(item.sentAt || item.createdTs || saleTs || Date.now());
        const hour = new Date(saleTs || itemTs || Date.now()).getHours();

        rows.push({
          id: item.id || `${sale.id}-${item.name}`,
          productId: item.productId || item.idProduct || "",
          productName: item.name || item.productName || "Producto sin nombre",
          qty,
          price,
          total,
          note: item.note || "",
          kitchenId: item.kitchenId || "",
          kitchenName: item.kitchenName || "Sin cocina",
          kdsStatus: item.kdsStatus || "",
          sentAt: item.sentAt || "",
          sentByName: item.sentByName || "",
          deliveredAt: item.deliveredAt || "",
          saleId: sale.id,
          ticketNo: sale.ticketNo || "-",
          saleDate: sale.date || "-",
          saleTs,
          hour,
          hourLabel: `${String(hour).padStart(2, "0")}:00 - ${String(hour + 1).padStart(2, "0")}:00`,
          method: sale.method || "-",
          cashierName: sale.cashierName || "No registrado",
          customerName: sale.customerName || "Consumidor final",
          orderId: sale.orderId || item.orderId || "",
          orderType: sale.orderType || "-",
          orderRefName: sale.orderRefName || "-",
          comanda: ProductosVendidosModule.getComandaLabel(sale, item)
        });
      });
    });

    return ProductosVendidosModule.applyFilters(rows, filters);
  },

  parseDateTs(dateText) {
    if (!dateText) return 0;
    const d = new Date(dateText);
    return Number.isNaN(d.getTime()) ? 0 : d.getTime();
  },

  getComandaLabel(sale, item) {
    const type = sale.orderType || "Orden";
    const ref = sale.orderRefName || "-";
    const kitchen = item.kitchenName || "Sin cocina";
    return `${type} · ${ref} · ${kitchen}`;
  },

  applyFilters(rows, filters = {}) {
    let out = rows.slice();

    if (filters.from) {
      const fromTs = new Date(filters.from + "T00:00:00").getTime();
      out = out.filter(r => Number(r.saleTs || 0) >= fromTs);
    }

    if (filters.to) {
      const toTs = new Date(filters.to + "T23:59:59").getTime();
      out = out.filter(r => Number(r.saleTs || 0) <= toTs);
    }

    if (filters.product && filters.product !== "ALL") {
      out = out.filter(r => r.productName === filters.product);
    }

    if (filters.term) {
      const t = String(filters.term).toLowerCase().trim();
      out = out.filter(r =>
        String(r.productName || "").toLowerCase().includes(t) ||
        String(r.ticketNo || "").toLowerCase().includes(t) ||
        String(r.orderRefName || "").toLowerCase().includes(t) ||
        String(r.kitchenName || "").toLowerCase().includes(t) ||
        String(r.customerName || "").toLowerCase().includes(t)
      );
    }

    if (filters.type && filters.type !== "ALL") {
      out = out.filter(r => r.orderType === filters.type);
    }

    if (filters.hour && filters.hour !== "ALL") {
      out = out.filter(r => Number(r.hour) === Number(filters.hour));
    }

    return out.sort((a, b) => Number(b.saleTs || 0) - Number(a.saleTs || 0));
  },

  summarizeProducts(rows) {
    const map = {};
    rows.forEach(r => {
      const key = r.productName;
      if (!map[key]) {
        map[key] = { productName: key, qty: 0, total: 0, tickets: new Set(), kitchens: new Set() };
      }
      map[key].qty += Number(r.qty || 0);
      map[key].total += Number(r.total || 0);
      map[key].tickets.add(r.ticketNo || "-");
      map[key].kitchens.add(r.kitchenName || "Sin cocina");
    });

    return Object.values(map)
      .map(x => ({ ...x, ticketsCount: x.tickets.size, kitchensText: Array.from(x.kitchens).join(", ") }))
      .sort((a, b) => Number(b.qty || 0) - Number(a.qty || 0));
  },

  summarizeHours(rows) {
    const map = {};
    rows.forEach(r => {
      const key = String(r.hour).padStart(2, "0");
      if (!map[key]) {
        map[key] = { hour: Number(r.hour), hourLabel: r.hourLabel, qty: 0, total: 0, products: 0 };
      }
      map[key].qty += Number(r.qty || 0);
      map[key].total += Number(r.total || 0);
      map[key].products += 1;
    });
    return Object.values(map).sort((a, b) => a.hour - b.hour);
  },

  distinctProducts() {
    const names = new Set();
    AppDB.getAll("sales").forEach(sale => {
      (sale.items || []).forEach(item => {
        if (item.name || item.productName) names.add(item.name || item.productName);
      });
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }
};
