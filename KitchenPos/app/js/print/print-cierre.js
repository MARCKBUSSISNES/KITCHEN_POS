function printCierre(data) {
  const config = Settings.get();
  const ticketLogo = config.ticketLogo || "assets/logos/kitchenlogo.png";

  const {
    closingNo,
    userName,
    openedAt,
    closedAt,
    openingAmount,
    salesTotal,
    efectivo,
    tarjeta,
    transferencia,
    ingresos,
    egresos,
    expectedCash,
    realCash,
    difference,
    note
  } = data;

  const diffNumber = Number(difference || 0);
  const diffLabel = diffNumber === 0
    ? "CUADRADO"
    : diffNumber > 0
      ? "SOBRA"
      : "FALTA";

  const html = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <title>Cierre de Caja</title>
    <style>
      body{
        font-family: Arial, sans-serif;
        margin:0;
        padding:0;
        background:#fff;
        color:#000;
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

      .status{
        text-align:center;
        font-size:18px;
        font-weight:900;
        margin-top:8px;
        border:2px solid #000;
        padding:6px;
      }

      .footer{
        margin-top:8px;
        font-size:11px;
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
    <div class="ticket">
      <div class="center">
        <img class="logo" src="${ticketLogo}" alt="logo">
        <div class="title">${config.businessName || "KitchenOS Restaurant"}</div>
        ${config.businessPhone ? `<div class="subtitle">Tel: ${config.businessPhone}</div>` : ""}
        ${config.businessAddress ? `<div class="subtitle">${config.businessAddress}</div>` : ""}
        <div class="subtitle">CIERRE DE CAJA</div>
        <div class="subtitle">No. ${closingNo || "-"}</div>
      </div>

      <div class="line"></div>

      <table>
        <tr><td>Usuario</td><td class="right">${userName || "-"}</td></tr>
        <tr><td>Apertura</td><td class="right">${openedAt || "-"}</td></tr>
        <tr><td>Cierre</td><td class="right">${closedAt || Utils.now()}</td></tr>
      </table>

      <div class="line"></div>

      <table>
        <tr><td>Fondo inicial</td><td class="right">${Utils.currency(openingAmount || 0)}</td></tr>
        <tr><td>Ventas totales</td><td class="right">${Utils.currency(salesTotal || 0)}</td></tr>
      </table>

      <div class="line"></div>

      <table>
        <tr><td>Efectivo ventas</td><td class="right">${Utils.currency(efectivo || 0)}</td></tr>
        <tr><td>Tarjeta</td><td class="right">${Utils.currency(tarjeta || 0)}</td></tr>
        <tr><td>Transferencia</td><td class="right">${Utils.currency(transferencia || 0)}</td></tr>
        <tr><td>Ingresos manuales</td><td class="right">${Utils.currency(ingresos || 0)}</td></tr>
        <tr><td>Egresos manuales</td><td class="right">${Utils.currency(egresos || 0)}</td></tr>
      </table>

      <div class="line"></div>

      <table>
        <tr>
          <td><strong>Efectivo esperado</strong></td>
          <td class="right big">${Utils.currency(expectedCash || 0)}</td>
        </tr>
        <tr>
          <td><strong>Efectivo contado</strong></td>
          <td class="right big">${Utils.currency(realCash || 0)}</td>
        </tr>
        <tr>
          <td><strong>Diferencia</strong></td>
          <td class="right big">${Utils.currency(diffNumber)}</td>
        </tr>
      </table>

      <div class="status">${diffLabel}</div>

      ${note ? `
        <div class="line"></div>
        <div class="subtitle"><strong>Observación:</strong> ${note}</div>
      ` : ""}

      <div class="line"></div>

      <div class="footer">
        Generado por KitchenPOS<br>
        By MarckBusiness
      </div>
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