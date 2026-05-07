function printPrecuenta(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";
  const { order, items } = data;
  const total = items.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const rows = items.map(item => `
    <tr>
      <td>${item.qty}</td>
      <td>${item.name}${item.note ? `<div class="tk-note">Nota: ${item.note}</div>` : ""}</td>
      <td class="right">${Utils.currency(item.total)}</td>
    </tr>
  `).join("");

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Precuenta</title>
    <style>
      body{font-family:Arial,sans-serif;margin:0;padding:0;background:#fff;color:#000;}
      .ticket{width:80mm;margin:0 auto;padding:8px 10px 14px;box-sizing:border-box;}
      .center{text-align:center}
      .logo{width:120px;height:120px;object-fit:contain;margin:0 auto 6px;display:block;}
      .title{font-size:18px;font-weight:700;margin:4px 0;}
      .subtitle{font-size:12px;margin:2px 0;}
      .line{border-top:1px dashed #000;margin:8px 0;}
      table{width:100%;border-collapse:collapse;font-size:12px;}
      td{padding:4px 0;vertical-align:top;}
      .right{text-align:right;}
      .total{font-size:18px;font-weight:700;}
      .tk-note{font-size:11px;margin-top:2px;}
      @media print{
        @page{size:80mm auto;margin:0;}
        body{margin:0;}
      }
    </style>
  </head>
  <body>
    <div class="ticket">
      <div class="center">
        <img class="logo" src="${ticketLogo}" alt="logo">
        <div class="title">${config.businessName || "KitchenOS Restaurant"}</div>
        <div class="subtitle">PRECUENTA</div>
        <div class="subtitle">${order.type === "MESA" ? "Mesa" : "Para llevar"}: ${order.refName}</div>
        <div class="subtitle">${Utils.now()}</div>
      </div>

      <div class="line"></div>

      <table>
        <tbody>
          ${rows}
        </tbody>
      </table>

      <div class="line"></div>

      <table>
        <tr>
          <td><strong>TOTAL</strong></td>
          <td class="right total">${Utils.currency(total)}</td>
        </tr>
      </table>

      <div class="line"></div>
      <div class="center subtitle">Documento informativo</div>
      <div class="center subtitle">No válido como factura</div>
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