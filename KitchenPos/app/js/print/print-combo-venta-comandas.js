function printComboVentaComandas(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";

  const {
    order,
    items,
    ticketNo,
    method,
    total,
    received,
    change,
    note,
    kitchenGroups = {}
  } = data;

  const saleRows = items.map(item => `
    <tr>
      <td>${item.qty}</td>
      <td>
        ${item.name}
        ${item.note ? `<div class="tk-note">Nota: ${item.note}</div>` : ""}
      </td>
      <td class="right">${Utils.currency(item.total)}</td>
    </tr>
  `).join("");

  const saleTicket = `
    <section class="ticket-page">
      <div class="ticket">
        <div class="center">
          <img class="logo" src="${ticketLogo}" alt="logo">
          <div class="title">${config.businessName || "KitchenOS Restaurant"}</div>
          ${config.businessPhone ? `<div class="subtitle">Tel: ${config.businessPhone}</div>` : ""}
          ${config.businessAddress ? `<div class="subtitle">${config.businessAddress}</div>` : ""}
          <div class="subtitle">Ticket: ${ticketNo}</div>
          <div class="subtitle">${order.type === "MESA" ? "Mesa" : "Para llevar"}: ${order.refName}</div>
          <div class="subtitle">${Utils.now()}</div>
        </div>

        <div class="line"></div>

        <table>
          <tbody>${saleRows}</tbody>
        </table>

        <div class="line"></div>

        <table>
          <tr>
            <td>Método de pago</td>
            <td class="right">${method || "Efectivo"}</td>
          </tr>
          <tr>
            <td>Total</td>
            <td class="right big">${Utils.currency(total || 0)}</td>
          </tr>
          <tr>
            <td>Recibido</td>
            <td class="right">${Utils.currency(received || total || 0)}</td>
          </tr>
          <tr>
            <td>Cambio</td>
            <td class="right">${Utils.currency(change || 0)}</td>
          </tr>
          ${note ? `<tr><td colspan="2">Observación: ${note}</td></tr>` : ""}
        </table>

        <div class="line"></div>

        <div class="footer">
          ${config.ticketMessage || "Gracias por su compra"}
        </div>
      </div>
    </section>
  `;

  const commandTickets = Object.keys(kitchenGroups).map(areaName => {
    const areaItems = kitchenGroups[areaName] || [];

    if (!areaItems.length) return "";

    const rows = areaItems.map(item => `
      <div class="item">
        <div class="item-top">
          <span class="qty">${item.qty}x</span>
          <span class="name">${item.name}</span>
        </div>
        ${item.note ? `<div class="note">Nota: ${item.note}</div>` : ""}
      </div>
    `).join("");

    const title = areaName.toLowerCase().includes("bar")
      ? "COMANDA BAR"
      : "COMANDA COCINA";

    return `
      <section class="ticket-page">
        <div class="ticket">
          <div class="center">
            <img class="logo" src="${ticketLogo}" alt="logo">
            <div class="title">${title}</div>
            <div class="area">${areaName}</div>
            <div class="subtitle">${order.type === "MESA" ? "Mesa" : "Llevar"}: ${order.refName}</div>
            <div class="subtitle">${Utils.now()}</div>
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
    <title>Venta y comandas</title>
    <style>
      body{
        font-family: Arial, sans-serif;
        margin:0;
        padding:0;
        background:#fff;
        color:#000;
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
        padding:8px 10px 14px;
        box-sizing:border-box;
      }

      .center{text-align:center;}
      .logo{
        width:120px;
        height:120px;
        object-fit:contain;
        margin:0 auto 6px;
        display:block;
      }

      .title{
        font-size:18px;
        font-weight:800;
        margin:4px 0;
      }

      .area{
        font-size:18px;
        font-weight:800;
        margin-top:4px;
      }

      .subtitle{
        font-size:12px;
        margin:2px 0;
      }

      .line{
        border-top:1px dashed #000;
        margin:8px 0;
      }

      table{
        width:100%;
        border-collapse:collapse;
        font-size:12px;
      }

      td{
        padding:4px 0;
        vertical-align:top;
      }

      .right{text-align:right;}
      .big{
        font-size:16px;
        font-weight:800;
      }

      .tk-note{
        font-size:11px;
        margin-top:2px;
      }

      .footer{
        margin-top:8px;
        font-size:11px;
        text-align:center;
      }

      .item{
        padding:8px 0;
        border-bottom:1px dashed #ccc;
      }

      .item-top{
        display:flex;
        gap:8px;
        font-size:18px;
        font-weight:800;
      }

      .qty{
        min-width:36px;
      }

      .note{
        margin-top:4px;
        font-size:13px;
      }

      @media print{
        @page{
          size:80mm auto;
          margin:0;
        }

        body{
          margin:0;
        }
      }
    </style>
  </head>
  <body>
    ${saleTicket}
    ${commandTickets}

    <script>
      window.onload = function(){
        window.print();
        setTimeout(() => window.close(), 500);
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