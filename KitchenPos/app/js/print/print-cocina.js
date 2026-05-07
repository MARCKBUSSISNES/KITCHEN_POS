function getOrderAreaForComanda(order) {
  if (!order || order.type !== "MESA") return "";

  const mesa = AppDB.find("mesas", m => m.id === order.refId);
  return order.tableAreaName || order.areaName || mesa?.area || "Sin área";
}

function getOrderOriginForComanda(order) {
  if (!order) return "-";

  if (order.type === "MESA") {
    const area = getOrderAreaForComanda(order);
    return `Área: ${area} · Mesa: ${order.refName || "-"}`;
  }

  if (order.type === "DOMICILIO") return `Domicilio: ${order.refName || "-"}`;

  return `Llevar: ${order.refName || "-"}`;
}

function printCocina(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";
  const { order, areaName, items } = data;

  const rows = items.map(item => `
    <div class="item">
      <div class="item-top">
        <span class="qty">${item.qty}x</span>
        <span class="name">${item.name}</span>
      </div>
      ${item.note ? `<div class="note">Nota: ${item.note}</div>` : ""}
    </div>
  `).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Ticket Cocina</title>
    <style>
      body{
        font-family: Arial, sans-serif;
        background:#fff;
        color:#000;
        margin:0;
        padding:0;
      }
      .ticket{
        width:80mm;
        margin:0 auto;
        padding:10px;
        box-sizing:border-box;
      }
      .center{text-align:center}
      .logo{
        width:120px;
        height:120px;
        object-fit:contain;
        margin:0 auto 6px;
        display:block;
      }
      .title{
        font-size:20px;
        font-weight:800;
      }
      .area{
        font-size:18px;
        font-weight:700;
        margin-top:4px;
      }
      .line{
        border-top:1px dashed #000;
        margin:8px 0;
      }
      .item{
        padding:8px 0;
        border-bottom:1px dashed #ccc;
      }
      .item-top{
        display:flex;
        gap:8px;
        font-size:18px;
        font-weight:700;
      }
      .qty{
        min-width:36px;
      }
      .note{
        margin-top:4px;
        font-size:13px;
      }
      .meta{
        font-size:12px;
        text-align:center;
      }
      @media print{
        @page{
          size:80mm auto;
          margin:0;
        }
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center">
        <img class="logo" src="${ticketLogo}" alt="logo">
        <div class="title">COMANDA</div>
        <div class="area">${areaName}</div>
        <div class="meta">${getOrderOriginForComanda(order)}</div>
        <div class="meta">${Utils.now()}</div>
      </div>

      <div class="line"></div>
      ${rows}
    </div>

    <script>
      window.onload = function(){
        window.print();
        setTimeout(() => window.close(), 300);
      }
    </script>
  </body>
  </html>
  `;

  const win = window.open("", "_blank", "width=420,height=700");
  win.document.open();
  win.document.write(html);
  win.document.close();
}
function printComandasAgrupadas(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";
  const { order, kitchenGroups = {} } = data;

  const areaNames = Object.keys(kitchenGroups).filter(areaName => {
    const items = kitchenGroups[areaName] || [];
    return items.length > 0;
  });

  if (!areaNames.length) return;

  const pages = areaNames.map(areaName => {
    const areaItems = kitchenGroups[areaName] || [];
    const areaLower = String(areaName || "").toLowerCase();
    const title = areaLower.includes("bar") ? "COMANDA BAR" : "COMANDA COCINA";

    const rows = areaItems.map(item => `
      <div class="item">
        <div class="item-top">
          <span class="qty">${item.qty}x</span>
          <span class="name">${item.name}</span>
        </div>
        ${item.note ? `<div class="note">Nota: ${item.note}</div>` : ""}
      </div>
    `).join("");

    const originLabel = getOrderOriginForComanda(order);

    return `
      <section class="ticket-page">
        <div class="ticket">
          <div class="center">
            <img class="logo" src="${ticketLogo}" alt="logo">
            <div class="title">${title}</div>
            <div class="area">${areaName}</div>
            <div class="meta">${originLabel}</div>
            <div class="meta">${Utils.now()}</div>
          </div>

          <div class="line"></div>
          ${rows}
        </div>
      </section>
    `;
  }).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Comandas agrupadas</title>
    <style>
      body{
        font-family: Arial, sans-serif;
        background:#fff;
        color:#000;
        margin:0;
        padding:0;
      }
      .ticket-page{
        width:80mm;
        margin:0 auto;
        page-break-after:always;
        break-after:page;
      }
      .ticket-page:last-child{
        page-break-after:auto;
        break-after:auto;
      }
      .ticket{
        width:80mm;
        margin:0 auto;
        padding:10px;
        box-sizing:border-box;
      }
      .center{text-align:center}
      .logo{
        width:120px;
        height:120px;
        object-fit:contain;
        margin:0 auto 6px;
        display:block;
      }
      .title{
        font-size:20px;
        font-weight:800;
      }
      .area{
        font-size:18px;
        font-weight:700;
        margin-top:4px;
      }
      .line{
        border-top:1px dashed #000;
        margin:8px 0;
      }
      .item{
        padding:8px 0;
        border-bottom:1px dashed #ccc;
      }
      .item-top{
        display:flex;
        gap:8px;
        font-size:18px;
        font-weight:700;
      }
      .qty{
        min-width:36px;
      }
      .note{
        margin-top:4px;
        font-size:13px;
      }
      .meta{
        font-size:12px;
        text-align:center;
      }
      @media print{
        @page{
          size:80mm auto;
          margin:0;
        }
        body{margin:0;}
      }
    </style>
  </head>
  <body>
    ${pages}

    <script>
      window.onload = function(){
        window.focus();
        window.print();
        setTimeout(() => window.close(), 500);
      }
    <\/script>
  </body>
  </html>
  `;

  const win = window.open("", "_blank", "width=420,height=700");

  if (!win) {
    alert("El navegador bloqueó la ventana de impresión. Permite ventanas emergentes para imprimir.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}
