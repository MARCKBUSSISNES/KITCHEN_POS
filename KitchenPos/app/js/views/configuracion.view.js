function renderConfiguracionView() {
  const config = Settings.get();
  AppState.pendingTicketLogo = undefined;
  const ticketLogoPreview = config.ticketLogo || "assets/logos/kitchenlogo.png";
  const kitchens = AppDB.getAll("kitchens");
  const printers = AppDB.getAll("printers");
  const areas = AppDB.getAll("tableAreas");
  const mesas = AppDB.getAll("mesas");

  return `
    <div class="section-head">
      <div>
        <h2>Configuración</h2>
        <p class="muted">Administra datos del negocio, impresoras, cocinas, áreas y mesas.</p>
      </div>

      <div class="toolbar">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
      </div>
    </div>

    <section class="config-grid">
      <article class="card config-card">
        <h3>Datos del negocio</h3>

        <label class="field-label">Nombre del negocio</label>
        <input id="cfgBusinessName" class="input" value="${config.businessName || ""}" />

        <label class="field-label">Teléfono</label>
        <input id="cfgBusinessPhone" class="input" value="${config.businessPhone || ""}" />

        <label class="field-label">Dirección</label>
        <input id="cfgBusinessAddress" class="input" value="${config.businessAddress || ""}" />

        <label class="field-label">Mensaje del ticket</label>
        <textarea id="cfgTicketMessage" class="input" rows="3">${config.ticketMessage || ""}</textarea>

        <label class="field-label">Logo para tickets de cobro</label>
        <div style="display:grid; grid-template-columns:120px 1fr; gap:14px; align-items:center; margin-top:8px;">
          <div style="width:120px; height:120px; border-radius:18px; border:1px dashed var(--line); background:#fff; display:grid; place-items:center; overflow:hidden; padding:8px;">
            <img id="cfgTicketLogoPreview" src="${ticketLogoPreview}" alt="Logo ticket" style="max-width:100%; max-height:100%; object-fit:contain;">
          </div>

          <div>
            <input id="cfgTicketLogoFile" class="input" type="file" accept="image/png,image/jpeg,image/webp" onchange="ConfigUI.previewTicketLogo(event)" />
            <p class="muted small" style="margin:8px 0 0; line-height:1.45;">
              Este logo solo se usará en tickets de cobro, precuentas, domicilios y cierres. No cambia el logo visual del sistema. Recomendado: PNG o JPG liviano.
            </p>
            <div class="toolbar" style="margin-top:10px; margin-bottom:0;">
              <button type="button" class="btn" onclick="ConfigUI.restoreDefaultTicketLogo()">Usar logo del sistema</button>
              <button type="button" class="btn btn-danger" onclick="ConfigUI.removeTicketLogo()">Quitar logo del ticket</button>
            </div>
          </div>
        </div>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ConfigUI.saveBusinessConfig()">Guardar datos</button>
        </div>
      </article>

      <article class="card config-card">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Cocinas / Áreas de preparación</h3>
            <p class="muted">Define dónde se preparan los productos.</p>
          </div>
          <button class="btn btn-primary" onclick="ConfigUI.openKitchenModal()">Nueva cocina</button>
        </div>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Impresora</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                kitchens.length
                  ? kitchens.map(k => {
                      const printer = printers.find(p => p.id === k.printerId);
                      return `
                        <tr>
                          <td>${k.name}</td>
                          <td>${printer?.name || "Sin asignar"}</td>
                          <td>${k.active ? "Activa" : "Inactiva"}</td>
                          <td>
                            <button class="btn" onclick="ConfigUI.editKitchen('${k.id}')">Editar</button>
                            <button class="btn btn-danger" onclick="ConfigUI.deleteKitchen('${k.id}')">Eliminar</button>
                          </td>
                        </tr>
                      `;
                    }).join("")
                  : `<tr><td colspan="4">No hay cocinas registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="card config-card">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Impresoras</h3>
            <p class="muted">Administra las impresoras del sistema.</p>
          </div>
          <button class="btn btn-primary" onclick="ConfigUI.openPrinterModal()">Nueva impresora</button>
        </div>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Device Name</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                printers.length
                  ? printers.map(p => `
                    <tr>
                      <td>${p.name}</td>
                      <td>${p.deviceName || ""}</td>
                      <td>${p.type || "TICKET"}</td>
                      <td>${p.active ? "Activa" : "Inactiva"}</td>
                      <td>
                        <button class="btn" onclick="ConfigUI.editPrinter('${p.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="ConfigUI.deletePrinter('${p.id}')">Eliminar</button>
                      </td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="5">No hay impresoras registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="card config-card">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Áreas de mesas</h3>
            <p class="muted">Crea y organiza las zonas del restaurante.</p>
          </div>
          <button class="btn btn-primary" onclick="ConfigUI.openAreaModal()">Nueva área</button>
        </div>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>Área</th>
                <th>Mesas</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                areas.length
                  ? areas.map(a => `
                    <tr>
                      <td>${a.name}</td>
                      <td>${mesas.filter(m => m.areaId === a.id).length}</td>
                      <td>${a.active ? "Activa" : "Inactiva"}</td>
                      <td>
                        <button class="btn" onclick="ConfigUI.editArea('${a.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="ConfigUI.deleteArea('${a.id}')">Eliminar</button>
                      </td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="4">No hay áreas registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>

      <article class="card config-card">
        <div class="section-head">
          <div>
            <h3 style="margin-bottom:4px;">Mesas</h3>
            <p class="muted">Crea, edita y elimina mesas.</p>
          </div>
          <button class="btn btn-primary" onclick="ConfigUI.openMesaModal()">Nueva mesa</button>
        </div>

        <div class="table-box">
          <table class="table">
            <thead>
              <tr>
                <th>Mesa</th>
                <th>Área</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${
                mesas.length
                  ? mesas.map(m => `
                    <tr>
                      <td>${m.name}</td>
                      <td>${m.area || "Sin área"}</td>
                      <td>${m.status}</td>
                      <td>
                        <button class="btn" onclick="ConfigUI.editMesa('${m.id}')">Editar</button>
                        <button class="btn btn-danger" onclick="ConfigUI.deleteMesa('${m.id}')">Eliminar</button>
                      </td>
                    </tr>
                  `).join("")
                  : `<tr><td colspan="4">No hay mesas registradas.</td></tr>`
              }
            </tbody>
          </table>
        </div>
      </article>
    </section>

    <div id="kitchenModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="kitchenModalTitle" style="margin-bottom:4px;">Nueva cocina</h3>
            <p class="muted">Crea o edita un área de preparación.</p>
          </div>
          <button class="btn btn-danger" onclick="ConfigUI.closeKitchenModal()">Cerrar</button>
        </div>

        <input type="hidden" id="kitchenId" />

        <label class="field-label">Nombre</label>
        <input id="kitchenName" class="input" placeholder="Ejemplo: Cocina principal" />

        <label class="field-label">Impresora asignada</label>
        <select id="kitchenPrinter" class="input">
          <option value="">Selecciona una impresora</option>
          ${printers.map(p => `<option value="${p.id}">${p.name}</option>`).join("")}
        </select>

        <label class="field-label">Estado</label>
        <select id="kitchenActive" class="input">
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ConfigUI.saveKitchen()">Guardar cocina</button>
        </div>
      </div>
    </div>

    <div id="printerModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="printerModalTitle" style="margin-bottom:4px;">Nueva impresora</h3>
            <p class="muted">Crea o edita una impresora del sistema.</p>
          </div>
          <button class="btn btn-danger" onclick="ConfigUI.closePrinterModal()">Cerrar</button>
        </div>

        <input type="hidden" id="printerId" />

        <label class="field-label">Nombre visible</label>
        <input id="printerName" class="input" placeholder="Ejemplo: Impresora Cocina" />

        <label class="field-label">Device Name</label>
        <input id="printerDeviceName" class="input" placeholder="Ejemplo: EPSON-COCINA" />

        <label class="field-label">Tipo</label>
        <input id="printerType" class="input" value="TICKET" />

        <label class="field-label">Estado</label>
        <select id="printerActive" class="input">
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ConfigUI.savePrinter()">Guardar impresora</button>
        </div>
      </div>
    </div>

    <div id="tableAreaModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="tableAreaModalTitle" style="margin-bottom:4px;">Nueva área</h3>
            <p class="muted">Crea o edita un área de mesas.</p>
          </div>
          <button class="btn btn-danger" onclick="ConfigUI.closeAreaModal()">Cerrar</button>
        </div>

        <input type="hidden" id="tableAreaId" />

        <label class="field-label">Nombre del área</label>
        <input id="tableAreaName" class="input" placeholder="Ejemplo: Terraza" />

        <label class="field-label">Estado</label>
        <select id="tableAreaActive" class="input">
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ConfigUI.saveArea()">Guardar área</button>
        </div>
      </div>
    </div>

    <div id="mesaModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="mesaModalTitle" style="margin-bottom:4px;">Nueva mesa</h3>
            <p class="muted">Crea o edita una mesa.</p>
          </div>
          <button class="btn btn-danger" onclick="ConfigUI.closeMesaModal()">Cerrar</button>
        </div>

        <input type="hidden" id="mesaId" />

        <label class="field-label">Nombre de la mesa</label>
        <input id="mesaName" class="input" placeholder="Ejemplo: Mesa 1" />

        <label class="field-label">Área</label>
        <select id="mesaAreaId" class="input">
          <option value="">Selecciona un área</option>
          ${areas.map(a => `<option value="${a.id}">${a.name}</option>`).join("")}
        </select>

        <label class="field-label">Estado inicial</label>
        <select id="mesaStatus" class="input">
          <option value="libre">Libre</option>
          <option value="ocupada">Ocupada</option>
          <option value="cobrando">Cobrando</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ConfigUI.saveMesa()">Guardar mesa</button>
        </div>
      </div>
    </div>
  `;
}

const ConfigUI = {
  saveBusinessConfig() {
    const businessName = document.getElementById("cfgBusinessName").value.trim();
    const businessPhone = document.getElementById("cfgBusinessPhone").value.trim();
    const businessAddress = document.getElementById("cfgBusinessAddress").value.trim();
    const ticketMessage = document.getElementById("cfgTicketMessage").value.trim();

    const currentConfig = Settings.get();
    const ticketLogo = Object.prototype.hasOwnProperty.call(AppState, "pendingTicketLogo") && AppState.pendingTicketLogo !== undefined
      ? AppState.pendingTicketLogo
      : (currentConfig.ticketLogo || "");

    Settings.save({
      businessName,
      businessPhone,
      businessAddress,
      ticketMessage,
      ticketLogo
    });

    AppState.pendingTicketLogo = undefined;
    alert("Configuración guardada correctamente.");
    Router.loadView("configuracion");
  },

  previewTicketLogo(event) {
    const file = event?.target?.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Selecciona una imagen válida.");
      event.target.value = "";
      return;
    }

    if (file.size > 1500 * 1024) {
      alert("La imagen es muy pesada. Usa una imagen menor a 1.5 MB para evitar saturar el almacenamiento local.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      AppState.pendingTicketLogo = reader.result;
      const preview = document.getElementById("cfgTicketLogoPreview");
      if (preview) preview.src = reader.result;
    };
    reader.readAsDataURL(file);
  },

  restoreDefaultTicketLogo() {
    AppState.pendingTicketLogo = "";
    const preview = document.getElementById("cfgTicketLogoPreview");
    if (preview) preview.src = "assets/logos/kitchenlogo.png";
  },

  removeTicketLogo() {
    AppState.pendingTicketLogo = "";
    const preview = document.getElementById("cfgTicketLogoPreview");
    if (preview) {
      preview.removeAttribute("src");
      preview.alt = "Sin logo de ticket";
    }
  },

  openKitchenModal() {
    document.getElementById("kitchenModalTitle").textContent = "Nueva cocina";
    document.getElementById("kitchenId").value = "";
    document.getElementById("kitchenName").value = "";
    document.getElementById("kitchenPrinter").value = "";
    document.getElementById("kitchenActive").value = "true";
    document.getElementById("kitchenModal").classList.add("open");
  },

  closeKitchenModal() {
    document.getElementById("kitchenModal").classList.remove("open");
  },

  editKitchen(id) {
    const kitchen = AppDB.find("kitchens", k => k.id === id);
    if (!kitchen) return;

    document.getElementById("kitchenModalTitle").textContent = "Editar cocina";
    document.getElementById("kitchenId").value = kitchen.id;
    document.getElementById("kitchenName").value = kitchen.name || "";
    document.getElementById("kitchenPrinter").value = kitchen.printerId || "";
    document.getElementById("kitchenActive").value = String(kitchen.active);
    document.getElementById("kitchenModal").classList.add("open");
  },

  saveKitchen() {
    const id = document.getElementById("kitchenId").value.trim();
    const name = document.getElementById("kitchenName").value.trim();
    const printerId = document.getElementById("kitchenPrinter").value;
    const active = document.getElementById("kitchenActive").value === "true";

    if (!name) {
      alert("Debes escribir el nombre de la cocina.");
      return;
    }

    if (!printerId) {
      alert("Debes asignar una impresora.");
      return;
    }

    if (id) {
      AppDB.update("kitchens", id, { name, printerId, active });
    } else {
      AppDB.insert("kitchens", {
        id: Utils.uid("K"),
        name,
        printerId,
        active
      });
    }

    this.closeKitchenModal();
    Router.loadView("configuracion");
  },

  deleteKitchen(id) {
    const kitchen = AppDB.find("kitchens", k => k.id === id);
    if (!kitchen) return;

    const inUse = AppDB.find("products", p => p.kitchenId === id);
    if (inUse) {
      alert("No puedes eliminar esta cocina porque hay productos asignados.");
      return;
    }

    if (!confirm(`¿Eliminar la cocina "${kitchen.name}"?`)) return;

    AppDB.delete("kitchens", id);
    Router.loadView("configuracion");
  },

  openPrinterModal() {
    document.getElementById("printerModalTitle").textContent = "Nueva impresora";
    document.getElementById("printerId").value = "";
    document.getElementById("printerName").value = "";
    document.getElementById("printerDeviceName").value = "";
    document.getElementById("printerType").value = "TICKET";
    document.getElementById("printerActive").value = "true";
    document.getElementById("printerModal").classList.add("open");
  },

  closePrinterModal() {
    document.getElementById("printerModal").classList.remove("open");
  },

  editPrinter(id) {
    const printer = AppDB.find("printers", p => p.id === id);
    if (!printer) return;

    document.getElementById("printerModalTitle").textContent = "Editar impresora";
    document.getElementById("printerId").value = printer.id;
    document.getElementById("printerName").value = printer.name || "";
    document.getElementById("printerDeviceName").value = printer.deviceName || "";
    document.getElementById("printerType").value = printer.type || "TICKET";
    document.getElementById("printerActive").value = String(printer.active);
    document.getElementById("printerModal").classList.add("open");
  },

  savePrinter() {
    const id = document.getElementById("printerId").value.trim();
    const name = document.getElementById("printerName").value.trim();
    const deviceName = document.getElementById("printerDeviceName").value.trim();
    const type = document.getElementById("printerType").value.trim();
    const active = document.getElementById("printerActive").value === "true";

    if (!name) {
      alert("Debes escribir el nombre de la impresora.");
      return;
    }

    if (!deviceName) {
      alert("Debes escribir el device name.");
      return;
    }

    if (id) {
      AppDB.update("printers", id, { name, deviceName, type, active });
    } else {
      AppDB.insert("printers", {
        id: Utils.uid("P"),
        name,
        deviceName,
        type,
        active
      });
    }

    this.closePrinterModal();
    Router.loadView("configuracion");
  },

  deletePrinter(id) {
    const printer = AppDB.find("printers", p => p.id === id);
    if (!printer) return;

    const inUse = AppDB.find("kitchens", k => k.printerId === id);
    if (inUse) {
      alert("No puedes eliminar esta impresora porque está asignada a una cocina.");
      return;
    }

    if (!confirm(`¿Eliminar la impresora "${printer.name}"?`)) return;

    AppDB.delete("printers", id);
    Router.loadView("configuracion");
  },

  openAreaModal() {
    document.getElementById("tableAreaModalTitle").textContent = "Nueva área";
    document.getElementById("tableAreaId").value = "";
    document.getElementById("tableAreaName").value = "";
    document.getElementById("tableAreaActive").value = "true";
    document.getElementById("tableAreaModal").classList.add("open");
  },

  closeAreaModal() {
    document.getElementById("tableAreaModal").classList.remove("open");
  },

  editArea(id) {
    const area = AppDB.find("tableAreas", a => a.id === id);
    if (!area) return;

    document.getElementById("tableAreaModalTitle").textContent = "Editar área";
    document.getElementById("tableAreaId").value = area.id;
    document.getElementById("tableAreaName").value = area.name || "";
    document.getElementById("tableAreaActive").value = String(area.active);
    document.getElementById("tableAreaModal").classList.add("open");
  },

  saveArea() {
    const id = document.getElementById("tableAreaId").value.trim();
    const name = document.getElementById("tableAreaName").value.trim();
    const active = document.getElementById("tableAreaActive").value === "true";

    if (!name) {
      alert("Debes escribir el nombre del área.");
      return;
    }

    const duplicate = AppDB.find("tableAreas", a => a.name.toLowerCase() === name.toLowerCase() && a.id !== id);
    if (duplicate) {
      alert("Ya existe un área con ese nombre.");
      return;
    }

    if (id) {
      const oldArea = AppDB.find("tableAreas", a => a.id === id);
      AppDB.update("tableAreas", id, { name, active });

      if (oldArea && oldArea.name !== name) {
        AppDB.data.mesas = AppDB.data.mesas.map(m =>
          m.areaId === id ? { ...m, area: name } : m
        );
        AppDB.save();
      }
    } else {
      AppDB.insert("tableAreas", {
        id: Utils.uid("TA"),
        name,
        active
      });
    }

    this.closeAreaModal();
    Router.loadView("configuracion");
  },

  deleteArea(id) {
    const area = AppDB.find("tableAreas", a => a.id === id);
    if (!area) return;

    const tablesInArea = AppDB.find("mesas", m => m.areaId === id);
    if (tablesInArea) {
      alert("No puedes eliminar esta área porque tiene mesas asignadas.");
      return;
    }

    if (!confirm(`¿Eliminar el área "${area.name}"?`)) return;

    AppDB.delete("tableAreas", id);
    Router.loadView("configuracion");
  },

  openMesaModal() {
    document.getElementById("mesaModalTitle").textContent = "Nueva mesa";
    document.getElementById("mesaId").value = "";
    document.getElementById("mesaName").value = "";
    document.getElementById("mesaAreaId").value = "";
    document.getElementById("mesaStatus").value = "libre";
    document.getElementById("mesaModal").classList.add("open");
  },

  closeMesaModal() {
    document.getElementById("mesaModal").classList.remove("open");
  },

  editMesa(id) {
    const mesa = AppDB.find("mesas", m => m.id === id);
    if (!mesa) return;

    document.getElementById("mesaModalTitle").textContent = "Editar mesa";
    document.getElementById("mesaId").value = mesa.id;
    document.getElementById("mesaName").value = mesa.name || "";
    document.getElementById("mesaAreaId").value = mesa.areaId || "";
    document.getElementById("mesaStatus").value = mesa.status || "libre";
    document.getElementById("mesaModal").classList.add("open");
  },

  saveMesa() {
    const id = document.getElementById("mesaId").value.trim();
    const name = document.getElementById("mesaName").value.trim();
    const areaId = document.getElementById("mesaAreaId").value;
    const status = document.getElementById("mesaStatus").value;

    if (!name) {
      alert("Debes escribir el nombre de la mesa.");
      return;
    }

    if (!areaId) {
      alert("Debes seleccionar un área.");
      return;
    }

    const area = AppDB.find("tableAreas", a => a.id === areaId);
    if (!area) {
      alert("Área inválida.");
      return;
    }

    if (id) {
      AppDB.update("mesas", id, {
        name,
        areaId,
        area: area.name,
        status,
        open: status !== "libre"
      });
    } else {
      AppDB.insert("mesas", {
        id: Utils.uid("M"),
        name,
        areaId,
        area: area.name,
        status,
        open: status !== "libre"
      });
    }

    this.closeMesaModal();
    Router.loadView("configuracion");
  },

  deleteMesa(id) {
    const mesa = AppDB.find("mesas", m => m.id === id);
    if (!mesa) return;

    const orderOpen = AppDB.find("orders", o => o.type === "MESA" && o.refId === id && o.status === "OPEN");
    if (orderOpen) {
      alert("No puedes eliminar esta mesa porque tiene una orden abierta.");
      return;
    }

    if (!confirm(`¿Eliminar la ${mesa.name}?`)) return;

    AppDB.delete("mesas", id);
    Router.loadView("configuracion");
  }
};