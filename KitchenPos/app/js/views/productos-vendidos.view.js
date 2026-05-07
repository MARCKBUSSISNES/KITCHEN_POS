function renderProductosVendidosView() {
  const filters = AppState.soldProductsFilters || {
    from: "",
    to: "",
    product: "ALL",
    term: "",
    type: "ALL",
    hour: "ALL"
  };

  const rows = ProductosVendidosModule.getRows(filters);
  const productSummary = ProductosVendidosModule.summarizeProducts(rows);
  const hourSummary = ProductosVendidosModule.summarizeHours(rows);
  const products = ProductosVendidosModule.distinctProducts();

  const totalQty = rows.reduce((acc, r) => acc + Number(r.qty || 0), 0);
  const totalSales = rows.reduce((acc, r) => acc + Number(r.total || 0), 0);
  const tickets = new Set(rows.map(r => r.ticketNo || "-")).size;
  const avgTicket = tickets ? totalSales / tickets : 0;

  return `
    <style>
      .sold-products-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:16px;}
      .sold-products-card{padding:18px;border-radius:18px;border:1px solid var(--line);background:rgba(23,32,51,.92);box-shadow:var(--shadow);}
      .sold-products-value{font-size:28px;font-weight:900;margin-top:6px;}
      .sold-filter-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;align-items:end;}
      .sold-two-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px;}
      .sold-table-wrap{max-height:430px;overflow:auto;border-radius:16px;border:1px solid var(--line);}
      .sold-table-wrap table th{position:sticky;top:0;z-index:2;}
      .sold-tag{display:inline-flex;padding:4px 9px;border-radius:999px;border:1px solid var(--line);background:#0b1220;font-size:12px;color:#f8fafc;}
      .sold-tag.mesa{background:rgba(34,197,94,.14);color:#86efac;border-color:rgba(34,197,94,.28);}
      .sold-tag.llevar{background:rgba(245,158,11,.15);color:#fcd34d;border-color:rgba(245,158,11,.28);}
      .sold-tag.domicilio{background:rgba(56,189,248,.13);color:#bae6fd;border-color:rgba(56,189,248,.28);}
      .sold-product-name{font-weight:900;font-size:15px;}
      .sold-muted-line{color:var(--muted);font-size:12px;margin-top:3px;line-height:1.35;}
      @media(max-width:1180px){.sold-filter-grid{grid-template-columns:repeat(3,1fr);} .sold-products-grid{grid-template-columns:repeat(2,1fr);} .sold-two-grid{grid-template-columns:1fr;}}
      @media(max-width:760px){.sold-filter-grid,.sold-products-grid{grid-template-columns:1fr;}}
    </style>

    <div class="section-head">
      <div>
        <h2>Productos vendidos</h2>
        <p class="muted">Consulta productos vendidos por fecha, hora, comanda, cocina, mesa, ticket y cajero.</p>
      </div>
      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
        <button class="btn btn-primary" onclick="ProductosVendidosUI.exportCSV()">Exportar CSV</button>
      </div>
    </div>

    <section class="sold-products-grid">
      <article class="sold-products-card">
        <div class="small muted">Unidades vendidas</div>
        <div class="sold-products-value">${totalQty}</div>
      </article>
      <article class="sold-products-card">
        <div class="small muted">Total vendido</div>
        <div class="sold-products-value">${Utils.currency(totalSales)}</div>
      </article>
      <article class="sold-products-card">
        <div class="small muted">Tickets / comandas</div>
        <div class="sold-products-value">${tickets}</div>
      </article>
      <article class="sold-products-card">
        <div class="small muted">Promedio por ticket</div>
        <div class="sold-products-value">${Utils.currency(avgTicket)}</div>
      </article>
    </section>

    <section class="card config-card">
      <h3>Filtros</h3>
      <div class="sold-filter-grid">
        <div>
          <label class="field-label">Desde</label>
          <input id="soldFrom" class="input" type="date" value="${filters.from || ""}">
        </div>
        <div>
          <label class="field-label">Hasta</label>
          <input id="soldTo" class="input" type="date" value="${filters.to || ""}">
        </div>
        <div>
          <label class="field-label">Producto</label>
          <select id="soldProduct" class="input">
            <option value="ALL">Todos</option>
            ${products.map(p => `<option value="${ProductosVendidosUI.escapeAttr(p)}" ${filters.product === p ? "selected" : ""}>${p}</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="field-label">Tipo</label>
          <select id="soldType" class="input">
            <option value="ALL" ${filters.type === "ALL" ? "selected" : ""}>Todos</option>
            <option value="MESA" ${filters.type === "MESA" ? "selected" : ""}>Mesa</option>
            <option value="LLEVAR" ${filters.type === "LLEVAR" ? "selected" : ""}>Para llevar</option>
            <option value="DOMICILIO" ${filters.type === "DOMICILIO" ? "selected" : ""}>Domicilio</option>
          </select>
        </div>
        <div>
          <label class="field-label">Hora</label>
          <select id="soldHour" class="input">
            <option value="ALL">Todas</option>
            ${Array.from({length:24}).map((_, h) => `<option value="${h}" ${String(filters.hour) === String(h) ? "selected" : ""}>${String(h).padStart(2,"0")}:00 - ${String(h+1).padStart(2,"0")}:00</option>`).join("")}
          </select>
        </div>
        <div>
          <label class="field-label">Buscar</label>
          <input id="soldTerm" class="input" value="${filters.term || ""}" placeholder="Ticket, mesa, cocina, cliente...">
        </div>
      </div>
      <div class="toolbar" style="margin-top:16px;">
        <button class="btn btn-primary" onclick="ProductosVendidosUI.applyFilters()">Aplicar filtros</button>
        <button class="btn" onclick="ProductosVendidosUI.clearFilters()">Limpiar</button>
      </div>
    </section>

    <section class="sold-two-grid">
      <article class="card config-card">
        <h3>Resumen por producto</h3>
        <div class="table-box">
          <table class="table">
            <thead><tr><th>Producto</th><th>Cantidad</th><th>Total</th><th>Tickets</th></tr></thead>
            <tbody>
              ${productSummary.length ? productSummary.map(r => `
                <tr>
                  <td><strong>${r.productName}</strong><div class="sold-muted-line">${r.kitchensText}</div></td>
                  <td>${r.qty}</td>
                  <td>${Utils.currency(r.total)}</td>
                  <td>${r.ticketsCount}</td>
                </tr>
              `).join("") : `<tr><td colspan="4">No hay productos vendidos con estos filtros.</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>

      <article class="card config-card">
        <h3>Resumen por hora</h3>
        <div class="table-box">
          <table class="table">
            <thead><tr><th>Hora</th><th>Líneas</th><th>Cantidad</th><th>Total</th></tr></thead>
            <tbody>
              ${hourSummary.length ? hourSummary.map(r => `
                <tr>
                  <td><strong>${r.hourLabel}</strong></td>
                  <td>${r.products}</td>
                  <td>${r.qty}</td>
                  <td>${Utils.currency(r.total)}</td>
                </tr>
              `).join("") : `<tr><td colspan="4">No hay venta por hora con estos filtros.</td></tr>`}
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <section class="card config-card" style="margin-top:16px;">
      <h3>Detalle completo</h3>
      <div class="sold-table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Fecha / Hora</th>
              <th>Producto</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Comanda</th>
              <th>Cocina</th>
              <th>Ticket</th>
              <th>Cajero</th>
              <th>Cliente</th>
            </tr>
          </thead>
          <tbody>
            ${rows.length ? rows.map(r => `
              <tr>
                <td>${r.saleDate}<div class="sold-muted-line">${r.hourLabel}</div></td>
                <td><div class="sold-product-name">${r.productName}</div>${r.note ? `<div class="sold-muted-line">Nota: ${r.note}</div>` : ""}</td>
                <td>${r.qty}</td>
                <td><strong>${Utils.currency(r.total)}</strong></td>
                <td>
                  <span class="sold-tag ${ProductosVendidosUI.typeClass(r.orderType)}">${ProductosVendidosUI.typeLabel(r.orderType)}</span>
                  <div class="sold-muted-line">${r.orderRefName || "-"}</div>
                  <div class="sold-muted-line">ID: ${r.orderId || "-"}</div>
                </td>
                <td>${r.kitchenName || "-"}</td>
                <td>${r.ticketNo || "-"}<div class="sold-muted-line">${r.method || "-"}</div></td>
                <td>${r.cashierName || "-"}</td>
                <td>${r.customerName || "Consumidor final"}</td>
              </tr>
            `).join("") : `<tr><td colspan="9">No hay registros de productos vendidos.</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

const ProductosVendidosUI = {
  getFiltersFromInputs() {
    return {
      from: document.getElementById("soldFrom")?.value || "",
      to: document.getElementById("soldTo")?.value || "",
      product: document.getElementById("soldProduct")?.value || "ALL",
      term: document.getElementById("soldTerm")?.value || "",
      type: document.getElementById("soldType")?.value || "ALL",
      hour: document.getElementById("soldHour")?.value || "ALL"
    };
  },

  applyFilters() {
    AppState.soldProductsFilters = this.getFiltersFromInputs();
    Router.loadView("productosVendidos");
  },

  clearFilters() {
    AppState.soldProductsFilters = { from: "", to: "", product: "ALL", term: "", type: "ALL", hour: "ALL" };
    Router.loadView("productosVendidos");
  },

  exportCSV() {
    const filters = AppState.soldProductsFilters || {};
    const rows = ProductosVendidosModule.getRows(filters);
    const headers = ["Fecha", "Hora", "Producto", "Cantidad", "Precio", "Total", "Tipo", "Comanda", "Cocina", "Ticket", "Metodo", "Cajero", "Cliente", "Nota"];
    const lines = [headers.join(",")];

    rows.forEach(r => {
      lines.push([
        r.saleDate,
        r.hourLabel,
        r.productName,
        r.qty,
        r.price,
        r.total,
        this.typeLabel(r.orderType),
        r.orderRefName,
        r.kitchenName,
        r.ticketNo,
        r.method,
        r.cashierName,
        r.customerName,
        r.note
      ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `productos_vendidos_${Date.now()}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1200);
  },

  typeLabel(type) {
    if (type === "MESA") return "Comer aquí";
    if (type === "LLEVAR") return "Para llevar";
    if (type === "DOMICILIO") return "Domicilio";
    return type || "Orden";
  },

  typeClass(type) {
    if (type === "MESA") return "mesa";
    if (type === "LLEVAR") return "llevar";
    if (type === "DOMICILIO") return "domicilio";
    return "";
  },

  escapeAttr(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
};
