function printDomicilioPack(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";
  const { delivery, order, items, kitchenGroups = {} } = data;

  const productRows = items.map(item => `
    <tr>
      <td>${item.qty}</td>
      <td>${item.name}${item.note ? `<div class="tk-note">Nota: ${item.note}</div>` : ""}</td>
      <td class="right">${Utils.currency(item.total)}</td>
    </tr>
  `).join("");

  const total = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const deliveryTicket = `
    <section class="ticket-page">
      <div class="ticket">
        <div class="center">
          <img class="logo" src="${ticketLogo}" alt="logo">
          <div class="title">${config.businessName || "KitchenOS Restaurant"}</div>
          <div class="subtitle">PEDIDO A DOMICILIO</div>
          <div class="subtitle">${delivery.code || "-"}</div>
          <div class="subtitle">${Utils.now()}</div>
        </div>

        <div class="line"></div>

        <div class="box">
          <strong>CLIENTE:</strong><br>
          ${delivery.customerName || "-"}<br><br>
          <strong>TELÉFONO:</strong><br>
          ${delivery.customerPhone || "-"}<br><br>
          <strong>DIRECCIÓN:</strong><br>
          ${delivery.customerAddress || "-"}<br><br>
          <strong>INDICACIONES:</strong><br>
          ${delivery.customerNotes || "-"}
        </div>

        <div class="line"></div>

        <table>
          <tbody>${productRows}</tbody>
        </table>

        <div class="line"></div>

        <table>
          <tr>
            <td><strong>TOTAL PENDIENTE</strong></td>
            <td class="right big">${Utils.currency(total)}</td>
          </tr>
        </table>

        <div class="line"></div>

        <div class="center subtitle">
          Ticket para motorista<br>
          Cobro pendiente de registrar en caja
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
            <div class="subtitle">Domicilio: ${delivery.code || "-"}</div>
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
    <title>Ticket Domicilio</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:0;background:#fff;color:#000;}
      .ticket-page{width:80mm;margin:0 auto;page-break-after:always;break-after:page;}
      .ticket-page:last-child{page-break-after:auto;break-after:auto;}
      .ticket{width:80mm;margin:0 auto;padding:8px 10px 14px;box-sizing:border-box;}
      .center{text-align:center;}
      .logo{width:70px;height:70px;object-fit:contain;margin:0 auto 6px;display:block;}
      .title{font-size:18px;font-weight:800;margin:4px 0;}
      .area{font-size:18px;font-weight:800;margin-top:4px;}
      .subtitle{font-size:12px;margin:2px 0;}
      .line{border-top:1px dashed #000;margin:8px 0;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      td{padding:4px 0;vertical-align:top;}
      .right{text-align:right;}
      .big{font-size:18px;font-weight:900;}
      .box{border:1px solid #000;padding:6px;margin:6px 0;font-size:12px;}
      .tk-note{font-size:11px;margin-top:2px;}
      .item{padding:8px 0;border-bottom:1px dashed #ccc;}
      .item-top{display:flex;gap:8px;font-size:18px;font-weight:800;}
      .qty{min-width:36px;}
      .note{margin-top:4px;font-size:13px;}

      @media print{
        @page{size:80mm auto;margin:0;}
        body{margin:0;}
      }
    </style>
  </head>
  <body>
    ${deliveryTicket}
    ${commandTickets}

    <script>
      window.onload = function(){
        setTimeout(function(){
          window.focus();
          window.print();
        }, 700);
      };
    </script>
  </body>
  </html>
  `;

  const win = window.open("", "_blank", "width=420,height=700");

  if (!win) {
    alert("El navegador bloqueó la ventana de impresión.");
    return;
  }

  win.document.open();
  win.document.write(html);
  win.document.close();
}