
function renderProductosView() {
  const products = AppDB.getAll("products");
  const kitchens = AppDB.getAll("kitchens");
  const categories = ProductosUI.getCategories();
  const tree = ProductosUI.buildCategoryTree(categories, products);
  const visibleProducts = ProductosUI.getVisibleProducts(products);

  return `
    <style>
      .products-admin-shell{
        display:grid;
        grid-template-columns:320px minmax(0,1fr);
        gap:18px;
        align-items:start;
      }
      .products-sidebar-card,
      .products-table-card{
        padding:0;
        overflow:hidden;
      }
      .products-sidebar-head,
      .products-table-head{
        padding:16px 18px;
        border-bottom:1px solid var(--line);
        background:linear-gradient(180deg, rgba(255,255,255,.03), rgba(255,255,255,.01));
      }
      .products-sidebar-body{
        padding:10px 8px 14px;
        max-height:calc(100vh - 260px);
        overflow:auto;
      }
      .products-table-toolbar{
        display:grid;
        grid-template-columns:230px 230px minmax(220px,1fr) auto auto;
        gap:10px;
        align-items:end;
        padding:14px 18px;
        border-bottom:1px solid var(--line);
      }
      .products-admin-tree{
        display:grid;
        gap:4px;
      }
      .products-tree-node{
        border-radius:12px;
        transition:background .16s, border-color .16s;
      }
      .products-tree-row{
        display:flex;
        align-items:center;
        gap:8px;
        padding:9px 10px;
        border:1px solid transparent;
        border-radius:12px;
        cursor:pointer;
        user-select:none;
      }
      .products-tree-row:hover{
        background:rgba(255,255,255,.04);
        border-color:rgba(255,255,255,.06);
      }
      .products-tree-row.active{
        background:rgba(96,165,250,.14);
        border-color:rgba(96,165,250,.34);
      }
      .products-tree-caret{
        width:16px;
        text-align:center;
        color:var(--muted);
        font-size:12px;
        flex:0 0 16px;
      }
      .products-tree-label{
        font-weight:700;
      }
      .products-tree-children{
        margin-left:20px;
        padding-left:8px;
        border-left:1px dashed rgba(255,255,255,.08);
        display:grid;
        gap:4px;
      }
      .products-tree-meta{
        margin-left:auto;
        color:var(--muted);
        font-size:12px;
      }
      .products-table-wrap{
        overflow:auto;
        max-height:calc(100vh - 315px);
      }
      .products-admin-table{
        width:100%;
        border-collapse:collapse;
      }
      .products-admin-table th,
      .products-admin-table td{
        padding:12px 14px;
        border-bottom:1px solid var(--line);
        white-space:nowrap;
      }
      .products-admin-table th{
        position:sticky;
        top:0;
        z-index:2;
        background:#172235;
        color:#cbd5e1;
        text-align:left;
      }
      .products-admin-table tbody tr{
        cursor:pointer;
        transition:background .14s;
      }
      .products-admin-table tbody tr:hover{
        background:rgba(255,255,255,.035);
      }
      .products-admin-table tbody tr.selected{
        background:rgba(96,165,250,.14);
      }
      .products-admin-table .name-cell{
        font-weight:700;
        white-space:normal;
      }
      .products-table-empty{
        padding:28px 18px;
        color:var(--muted);
      }
      .products-actions-top{
        display:flex;
        gap:10px;
        flex-wrap:wrap;
      }
      .product-modal{
        width:min(1100px, calc(100vw - 40px));
        max-height:92vh;
        overflow:hidden;
        display:flex;
        flex-direction:column;
      }
      .product-modal .section-head{
        flex:0 0 auto;
      }
      .product-modal-scroll{
        overflow-y:auto;
        padding-right:6px;
      }
      .product-form-grid{
        display:grid;
        grid-template-columns:1.05fr .95fr;
        gap:18px;
        margin-top:12px;
        align-items:start;
      }
      .product-form-card{
        padding:18px;
      }
      .product-preview-card{
        border:1px solid var(--line);
        border-radius:18px;
        padding:18px;
        background:#0b1220;
      }
      .product-preview-image{
        height:220px;
        border-radius:18px;
        border:1px dashed var(--line);
        display:grid;
        place-items:center;
        background:#111827;
        color:var(--muted);
        margin-bottom:16px;
        overflow:hidden;
      }
      .product-preview-image img{
        width:100%;
        height:100%;
        object-fit:cover;
      }
      .product-preview-price{
        font-size:24px;
        font-weight:800;
        margin:8px 0;
      }
      .image-help{
        margin-top:8px;
        font-size:12px;
        color:var(--muted);
        line-height:1.4;
      }
      @media (max-width: 1180px){
        .products-admin-shell{
          grid-template-columns:1fr;
        }
        .products-sidebar-body,
        .products-table-wrap{
          max-height:none;
        }
        .products-table-toolbar{
          grid-template-columns:1fr 1fr;
        }
      }
      @media (max-width: 760px){
        .products-table-toolbar{
          grid-template-columns:1fr;
        }
        .product-form-grid{
          grid-template-columns:1fr;
        }
      }
    </style>

    <div class="section-head">
      <div>
        <h2>Productos</h2>
        <p class="muted">Catálogo administrativo con árbol de categorías a la izquierda y listado de platillos a la derecha.</p>
      </div>

      <div class="products-actions-top">
        <button class="btn" onclick="Router.loadView('dashboard')">Volver al panel</button>
        <button class="btn" onclick="ProductosUI.resetFilter()">Mostrar todos</button>
        <button class="btn" onclick="ProductosUI.openCategoryModal()">Nueva categoría</button>
        <button class="btn btn-primary" onclick="ProductosUI.openCreateModal()">Nuevo producto</button>
      </div>
    </div>

    <section class="products-admin-shell">
      <article class="card products-sidebar-card">
        <div class="products-sidebar-head">
          <h3 style="margin:0 0 4px 0;">Categorías de menú</h3>
          <p class="muted" style="margin:0;">Selecciona una categoría para filtrar el listado.</p>
        </div>

        <div class="products-sidebar-body">
          <div class="products-admin-tree">
            <div class="products-tree-node">
              <div class="products-tree-row ${ProductosUI.filter.mode === 'all' ? 'active' : ''}" onclick="ProductosUI.resetFilter()">
                <span class="products-tree-caret">•</span>
                <span class="products-tree-label">Mostrar todos</span>
                <span class="products-tree-meta">${products.length}</span>
              </div>
            </div>

            ${tree.map(parent => `
              <div class="products-tree-node">
                <div class="products-tree-row ${ProductosUI.filter.mode === 'parent' && ProductosUI.filter.parent === parent.parentName ? 'active' : ''}"
                     onclick="ProductosUI.selectParent('${ProductosUI.escapeJs(parent.parentName)}')">
                  <span class="products-tree-caret">${parent.categories.length ? '▾' : '•'}</span>
                  <span class="products-tree-label">${parent.parentName}</span>
                  <span class="products-tree-meta">${parent.total}</span>
                </div>

                <div class="products-tree-children">
                  ${parent.categories.map(cat => `
                    <div class="products-tree-row ${ProductosUI.filter.mode === 'category' && ProductosUI.filter.parent === parent.parentName && ProductosUI.filter.category === cat.name ? 'active' : ''}"
                         onclick="ProductosUI.selectCategory('${ProductosUI.escapeJs(parent.parentName)}','${ProductosUI.escapeJs(cat.name)}')">
                      <span class="products-tree-caret">•</span>
<span>${cat.name}</span>
<span class="products-tree-meta">${cat.total}</span>
<button class="btn btn-danger" style="padding:4px 8px; font-size:11px;"
  onclick="event.stopPropagation(); ProductosUI.deleteCategory('${ProductosUI.escapeJs(parent.parentName)}','${ProductosUI.escapeJs(cat.name)}')">
  Eliminar
</button>
                    </div>
                  `).join("")}
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </article>

      <article class="card products-table-card">
        <div class="products-table-head">
          <h3 style="margin:0 0 4px 0;">Listado de platillos</h3>
          <p class="muted" style="margin:0;">Doble click sobre un producto para abrir toda su configuración.</p>
        </div>

        <div class="products-table-toolbar">
          <div>
            <label class="field-label">Menú padre</label>
            <input id="productsParentSearch" class="input" value="${ProductosUI.filter.parent || ''}" placeholder="Todos" oninput="ProductosUI.searchToolbarChanged()" />
          </div>
          <div>
            <label class="field-label">Categoría</label>
            <input id="productsCategorySearch" class="input" value="${ProductosUI.filter.category || ''}" placeholder="Todas" oninput="ProductosUI.searchToolbarChanged()" />
          </div>
          <div>
            <label class="field-label">Buscar platillo</label>
            <input id="productsTextSearch" class="input" value="${ProductosUI.filter.term || ''}" placeholder="Introduce el texto a buscar..." oninput="ProductosUI.searchToolbarChanged()" />
          </div>
          <div>
            <label class="field-label"> </label>
            <button class="btn" onclick="ProductosUI.resetFilter()">Limpiar</button>
          </div>
          <div>
            <label class="field-label"> </label>
            <button class="btn btn-primary" onclick="ProductosUI.openCreateModal()">Nuevo</button>
          </div>
        </div>

        <div class="products-table-wrap">
          ${
            visibleProducts.length
              ? `
                <table class="products-admin-table">
                  <thead>
                    <tr>
                      <th style="width:120px;">Código</th>
                      <th>Platillo</th>
                      <th style="width:200px;">Categoría</th>
                      <th style="width:180px;">Cocina</th>
                      <th style="width:110px;">Prioridad</th>
                      <th style="width:140px;">Precio Venta</th>
                      <th style="width:110px;">Habilitado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${visibleProducts.map(p => {
                      const kitchen = kitchens.find(k => k.id === p.kitchenId);
                      const selected = ProductosUI.selectedProductId === p.id ? 'selected' : '';
                      return `
                        <tr class="${selected}"
                            onclick="ProductosUI.selectProduct('${p.id}')"
                            ondblclick="ProductosUI.openEditModal('${p.id}')">
                          <td>${p.code || p.id || ''}</td>
                          <td class="name-cell">${p.name || ''}</td>
                          <td>${p.subcategory || p.category || 'General'}</td>
                          <td>${kitchen?.name || 'Sin asignar'}</td>
                          <td>${p.priority ?? 1}</td>
                          <td>${Utils.currency(Number(p.price || 0))}</td>
                          <td>${p.active ? '✔' : '✖'}</td>
                        </tr>
                      `;
                    }).join("")}
                  </tbody>
                </table>
              `
              : `<div class="products-table-empty">No hay productos para el filtro seleccionado.</div>`
          }
        </div>
      </article>
    </section>

    <div id="productModal" class="modal-backdrop">
      <div class="modal product-modal">
        <div class="section-head">
          <div>
            <h3 id="productModalTitle" style="margin-bottom:4px;">Nuevo producto</h3>
            <p class="muted">Completa la configuración del platillo.</p>
          </div>
          <button class="btn btn-danger" onclick="ProductosUI.closeModal()">Cerrar</button>
        </div>

        <div class="product-modal-scroll">
          <div class="product-form-grid">
            <div class="card product-form-card">
              <input type="hidden" id="productId" />

              <label class="field-label">Código</label>
              <input id="productCode" class="input" placeholder="Opcional" />

              <label class="field-label">Nombre</label>
              <input id="productName" class="input" placeholder="Ejemplo: Hamburguesa especial" />

              <label class="field-label">Precio de venta</label>
              <input id="productPrice" class="input" type="number" min="0" step="0.01" placeholder="0.00" />

              <label class="field-label">Menú padre</label>
              <input id="productParentCategory" class="input" list="parentCategoryList" placeholder="Ejemplo: Burgers, Birria, Bebidas" />
              <datalist id="parentCategoryList">
                ${ProductosUI.getParentCategories().map(name => `<option value="${name}"></option>`).join("")}
              </datalist>

              <label class="field-label">Categoría</label>
              <input id="productSubcategory" class="input" list="subcategoryList" placeholder="Ejemplo: Burgers normales, Combos, Gaseosas" />
              <datalist id="subcategoryList">
                ${categories.map(cat => `<option value="${cat.name}"></option>`).join("")}
              </datalist>

              <label class="field-label">Cocina / Área</label>
              <select id="productKitchen" class="input">
                <option value="">Selecciona una cocina</option>
                ${kitchens.map(k => `<option value="${k.id}">${k.name}</option>`).join("")}
              </select>

              <label class="field-label">Prioridad</label>
              <input id="productPriority" class="input" type="number" min="1" step="1" value="1" />

              <label class="field-label">Estado</label>
              <select id="productActive" class="input">
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>

              <label class="field-label">Imagen</label>
              <input id="productImageFile" class="input" type="file" accept="image/*" onchange="ProductosUI.loadImage(event)" />
              <div class="image-help">
                La imagen se reduce automáticamente antes de guardarse para evitar llenar el almacenamiento local del sistema.
              </div>

              <div class="toolbar" style="margin-top:18px;">
                <button class="btn" onclick="ProductosUI.openCategoryModal()">Crear categoría</button>
                <button class="btn btn-primary" onclick="ProductosUI.saveProduct()">Guardar producto</button>
              </div>
            </div>

            <div class="card product-form-card">
              <h3 style="margin-bottom:12px;">Vista previa</h3>

              <div class="product-preview-card">
                <div class="product-preview-image" id="productPreviewImage">SIN IMAGEN</div>
                <h3 id="productPreviewName">Nombre del producto</h3>
                <p class="muted" id="productPreviewCategory">Menú · Categoría</p>
                <p class="product-preview-price" id="productPreviewPrice">Q 0.00</p>
                <p class="muted" id="productPreviewKitchen">Cocina: Sin asignar</p>
                <p class="muted" id="productPreviewCode">Código: —</p>
                <p class="muted" id="productPreviewPriority">Prioridad: 1</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div id="categoryModal" class="modal-backdrop">
      <div class="modal">
        <div class="section-head">
          <div>
            <h3 id="categoryModalTitle" style="margin-bottom:4px;">Nueva categoría</h3>
            <p class="muted">Define el menú padre y la categoría visible en el catálogo.</p>
          </div>
          <button class="btn btn-danger" onclick="ProductosUI.closeCategoryModal()">Cerrar</button>
        </div>

        <input type="hidden" id="categoryId" />

        <label class="field-label">Menú padre</label>
        <input id="categoryParentName" class="input" list="categoryParentList" placeholder="Ejemplo: Burgers, Birria, Bebidas" />
        <datalist id="categoryParentList">
          ${ProductosUI.getParentCategories().map(name => `<option value="${name}"></option>`).join("")}
        </datalist>

        <label class="field-label">Categoría</label>
        <input id="categoryName" class="input" placeholder="Ejemplo: Combos familiares" />

        <label class="field-label">Estado</label>
        <select id="categoryActive" class="input">
          <option value="true">Activa</option>
          <option value="false">Inactiva</option>
        </select>

        <div class="toolbar" style="margin-top:16px;">
          <button class="btn btn-primary" onclick="ProductosUI.saveCategory()">Guardar categoría</button>
        </div>
      </div>
    </div>
  `;
}

const ProductosUI = {
  tempImage: "",
  selectedProductId: null,
  filter: {
    mode: "all",
    parent: "",
    category: "",
    term: ""
  },

  escapeJs(value) {
    return String(value ?? "")
      .replaceAll("\\", "\\\\")
      .replaceAll("'", "\\'");
  },

  getCategories() {
    const dbCategories = AppDB.getAll("categories");
    if (!dbCategories.length) {
      const inferred = new Map();
      AppDB.getAll("products").forEach(product => {
        const parentName = product.parentCategory || product.categoryParent || product.category || "General";
        const categoryName = product.subcategory || product.category || "General";
        const key = `${parentName}__${categoryName}`;
        if (!inferred.has(key)) {
          inferred.set(key, {
            id: Utils.uid("CAT"),
            parentName,
            name: categoryName,
            active: true
          });
        }
      });
      [...inferred.values()].forEach(cat => AppDB.insert("categories", cat));
      return AppDB.getAll("categories");
    }
    return dbCategories.sort((a, b) => {
      const parentCmp = String(a.parentName || a.parent || "").localeCompare(String(b.parentName || b.parent || ""), 'es');
      if (parentCmp !== 0) return parentCmp;
      return String(a.name || "").localeCompare(String(b.name || ""), 'es');
    }).map(cat => ({
      ...cat,
      parentName: cat.parentName || cat.parent || "General"
    }));
  },

  getParentCategories() {
    const values = new Set();
    this.getCategories().forEach(cat => values.add(cat.parentName || "General"));
    AppDB.getAll("products").forEach(product => values.add(product.parentCategory || product.categoryParent || product.category || "General"));
    return [...values].filter(Boolean).sort((a, b) => a.localeCompare(b, 'es'));
  },

  buildCategoryTree(categories, products) {
    const parentMap = new Map();

    categories.filter(c => c.active !== false).forEach(cat => {
      const parent = cat.parentName || "General";
      if (!parentMap.has(parent)) parentMap.set(parent, []);
      parentMap.get(parent).push(cat.name);
    });

    products.forEach(product => {
      const parent = product.parentCategory || product.categoryParent || product.category || "General";
      const category = product.subcategory || product.category || "General";
      if (!parentMap.has(parent)) parentMap.set(parent, []);
      if (!parentMap.get(parent).includes(category)) parentMap.get(parent).push(category);
    });

    return [...parentMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0], 'es'))
      .map(([parentName, cats]) => {
        const categoriesList = [...new Set(cats)]
          .sort((a, b) => a.localeCompare(b, 'es'))
          .map(name => ({
            name,
            total: products.filter(p => (p.parentCategory || p.categoryParent || p.category || "General") === parentName
              && (p.subcategory || p.category || "General") === name).length
          }));
        return {
          parentName,
          categories: categoriesList,
          total: products.filter(p => (p.parentCategory || p.categoryParent || p.category || "General") === parentName).length
        };
      });
  },

  getVisibleProducts(products) {
    const parent = (this.filter.parent || "").trim().toLowerCase();
    const category = (this.filter.category || "").trim().toLowerCase();
    const term = (this.filter.term || "").trim().toLowerCase();

    return products
      .filter(p => {
        const pParent = String(p.parentCategory || p.categoryParent || p.category || "General").trim().toLowerCase();
        const pCategory = String(p.subcategory || p.category || "General").trim().toLowerCase();
        const pName = String(p.name || "").trim().toLowerCase();
        const matchesParent = !parent || pParent.includes(parent);
        const matchesCategory = !category || pCategory.includes(category);
        const matchesTerm = !term || pName.includes(term) || String(p.code || p.id || "").toLowerCase().includes(term);
        return matchesParent && matchesCategory && matchesTerm;
      })
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), 'es'));
  },

  searchToolbarChanged() {
    this.filter.mode = "search";
    this.filter.parent = document.getElementById("productsParentSearch")?.value || "";
    this.filter.category = document.getElementById("productsCategorySearch")?.value || "";
    this.filter.term = document.getElementById("productsTextSearch")?.value || "";
    Router.loadView("productos");
  },

  resetFilter() {
    this.filter = { mode: "all", parent: "", category: "", term: "" };
    Router.loadView("productos");
  },

  selectParent(parentName) {
    this.filter = { mode: "parent", parent: parentName, category: "", term: "" };
    Router.loadView("productos");
  },

  selectCategory(parentName, categoryName) {
    this.filter = { mode: "category", parent: parentName, category: categoryName, term: "" };
    Router.loadView("productos");
  },

  selectProduct(productId) {
    this.selectedProductId = productId;
    document.querySelectorAll(".products-admin-table tbody tr").forEach(row => row.classList.remove("selected"));
    const rows = [...document.querySelectorAll(".products-admin-table tbody tr")];
    const match = rows.find(r => r.getAttribute("ondblclick")?.includes(`'${productId}'`));
    if (match) match.classList.add("selected");
  },

  openCreateModal() {
    document.getElementById("productModalTitle").textContent = "Nuevo producto";
    document.getElementById("productId").value = "";
    document.getElementById("productCode").value = "";
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("productParentCategory").value = this.filter.parent || "";
    document.getElementById("productSubcategory").value = this.filter.category || "";
    document.getElementById("productKitchen").value = "";
    document.getElementById("productPriority").value = "1";
    document.getElementById("productActive").value = "true";
    document.getElementById("productImageFile").value = "";
    this.tempImage = "";
    this.updatePreview();
    document.getElementById("productModal").classList.add("open");
  },

  openEditModal(productId) {
    const product = AppDB.find("products", p => p.id === productId);
    if (!product) return;

    document.getElementById("productModalTitle").textContent = "Editar producto";
    document.getElementById("productId").value = product.id;
    document.getElementById("productCode").value = product.code || "";
    document.getElementById("productName").value = product.name || "";
    document.getElementById("productPrice").value = product.price || "";
    document.getElementById("productParentCategory").value = product.parentCategory || product.categoryParent || product.category || "";
    document.getElementById("productSubcategory").value = product.subcategory || product.category || "";
    document.getElementById("productKitchen").value = product.kitchenId || "";
    document.getElementById("productPriority").value = product.priority ?? 1;
    document.getElementById("productActive").value = String(product.active !== false);
    document.getElementById("productImageFile").value = "";
    this.tempImage = product.image || "";
    this.updatePreview();
    document.getElementById("productModal").classList.add("open");
  },

  closeModal() {
    document.getElementById("productModal").classList.remove("open");
  },

  openCategoryModal() {
    document.getElementById("categoryModalTitle").textContent = "Nueva categoría";
    document.getElementById("categoryId").value = "";
    document.getElementById("categoryParentName").value = "";
    document.getElementById("categoryName").value = "";
    document.getElementById("categoryActive").value = "true";
    document.getElementById("categoryModal").classList.add("open");
  },

  closeCategoryModal() {
    document.getElementById("categoryModal").classList.remove("open");
  },

  saveCategory() {
    const id = document.getElementById("categoryId").value.trim();
    const parentName = document.getElementById("categoryParentName").value.trim() || "General";
    const name = document.getElementById("categoryName").value.trim();
    const active = document.getElementById("categoryActive").value === "true";

    if (!name) {
      alert("Debes escribir el nombre de la categoría.");
      return;
    }

    const duplicate = AppDB.find("categories", c =>
      String(c.parentName || c.parent || "").toLowerCase() === parentName.toLowerCase() &&
      String(c.name || "").toLowerCase() === name.toLowerCase() &&
      c.id !== id
    );
    if (duplicate) {
      alert("Ya existe esta categoría dentro del mismo menú padre.");
      return;
    }

    if (id) {
      const current = AppDB.find("categories", c => c.id === id);
      AppDB.update("categories", id, { parentName, name, active });

      if (current && ((current.parentName || current.parent || "General") !== parentName || current.name !== name)) {
        AppDB.data.products = AppDB.data.products.map(product => {
          const sameParent = (product.parentCategory || product.categoryParent || product.category || "General") === (current.parentName || current.parent || "General");
          const sameSub = (product.subcategory || product.category || "General") === current.name;
          if (sameParent && sameSub) {
            return {
              ...product,
              parentCategory: parentName,
              categoryParent: parentName,
              subcategory: name,
              category: name
            };
          }
          return product;
        });
        AppDB.save();
      }
    } else {
      AppDB.insert("categories", {
        id: Utils.uid("CAT"),
        parentName,
        name,
        active
      });
    }

    this.closeCategoryModal();
    Router.loadView("productos");
  },

  async loadImage(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      this.tempImage = await this.compressImageFile(file, {
        maxWidth: 900,
        maxHeight: 900,
        maxBytes: 280 * 1024,
        qualityStart: 0.82
      });
      this.updatePreview();
    } catch (error) {
      console.error("Error procesando imagen:", error);
      alert("No se pudo procesar la imagen. Intenta con una más pequeña.");
      event.target.value = "";
      this.tempImage = "";
      this.updatePreview();
    }
  },

  compressImageFile(file, options = {}) {
    const {
      maxWidth = 900,
      maxHeight = 900,
      maxBytes = 280 * 1024,
      qualityStart = 0.82
    } = options;

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          const scale = Math.min(1, maxWidth / width, maxHeight / height);
          width = Math.max(1, Math.round(width * scale));
          height = Math.max(1, Math.round(height * scale));

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);

          let quality = qualityStart;
          let dataUrl = canvas.toDataURL("image/jpeg", quality);

          while (dataUrl.length > maxBytes * 1.37 && quality > 0.42) {
            quality -= 0.08;
            dataUrl = canvas.toDataURL("image/jpeg", quality);
          }

          resolve(dataUrl);
        };
        img.onerror = reject;
        img.src = reader.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  updatePreview() {
    const kitchens = AppDB.getAll("kitchens");
    const kitchenId = document.getElementById("productKitchen")?.value || "";
    const kitchen = kitchens.find(k => k.id === kitchenId);

    const code = document.getElementById("productCode")?.value || "—";
    const name = document.getElementById("productName")?.value || "Nombre del producto";
    const price = Number(document.getElementById("productPrice")?.value || 0);
    const parent = document.getElementById("productParentCategory")?.value || "Menú";
    const sub = document.getElementById("productSubcategory")?.value || "Categoría";
    const priority = Number(document.getElementById("productPriority")?.value || 1);

    document.getElementById("productPreviewName").textContent = name;
    document.getElementById("productPreviewCategory").textContent = `${parent} · ${sub}`;
    document.getElementById("productPreviewPrice").textContent = Utils.currency(price);
    document.getElementById("productPreviewKitchen").textContent = `Cocina: ${kitchen?.name || "Sin asignar"}`;
    document.getElementById("productPreviewCode").textContent = `Código: ${code}`;
    document.getElementById("productPreviewPriority").textContent = `Prioridad: ${priority}`;

    const imageBox = document.getElementById("productPreviewImage");
    if (this.tempImage) {
      imageBox.innerHTML = `<img src="${this.tempImage}" alt="preview">`;
    } else {
      imageBox.innerHTML = "SIN IMAGEN";
    }
  },

  saveProduct() {
    try {
      const id = document.getElementById("productId").value.trim();
      const code = document.getElementById("productCode").value.trim();
      const name = document.getElementById("productName").value.trim();
      const price = Number(document.getElementById("productPrice").value || 0);
      const parentCategory = document.getElementById("productParentCategory").value.trim() || "General";
      const subcategory = document.getElementById("productSubcategory").value.trim() || "General";
      const kitchenId = document.getElementById("productKitchen").value;
      const priority = Number(document.getElementById("productPriority").value || 1);
      const active = document.getElementById("productActive").value === "true";

      if (!name) {
        alert("Debes escribir el nombre del producto.");
        return;
      }

      if (!Number.isFinite(price) || price <= 0) {
        alert("El precio debe ser mayor que 0.");
        return;
      }

      if (!kitchenId) {
        alert("Debes seleccionar una cocina o área.");
        return;
      }

      let category = AppDB.find("categories", c =>
        String(c.parentName || c.parent || "").toLowerCase() === parentCategory.toLowerCase() &&
        String(c.name || "").toLowerCase() === subcategory.toLowerCase()
      );

      if (!category) {
        category = AppDB.insert("categories", {
          id: Utils.uid("CAT"),
          parentName: parentCategory,
          name: subcategory,
          active: true
        });
      }

      const payload = {
        code,
        name,
        price,
        category: subcategory,
        parentCategory,
        categoryParent: parentCategory,
        subcategory,
        categoryId: category.id,
        kitchenId,
        priority: Number.isFinite(priority) && priority > 0 ? priority : 1,
        active,
        image: this.tempImage || ""
      };

      if (id) {
        AppDB.update("products", id, payload);
      } else {
        AppDB.insert("products", {
          id: Utils.uid("PRD"),
          ...payload
        });
      }

      this.closeModal();
      Router.loadView("productos");
    } catch (error) {
      console.error("Error guardando producto:", error);
      if (String(error?.name || "").includes("QuotaExceededError")) {
        alert("No se pudo guardar porque el almacenamiento local está lleno. Ya reduje el tamaño de imagen en este archivo, pero si el error persiste quita imágenes muy pesadas o elimina datos antiguos.");
      } else {
        alert("No se pudo guardar el producto. Revisa la consola para más detalle.");
      }
    }
  },

deleteProduct(productId) {
  const product = AppDB.find("products", p => p.id === productId);
  if (!product) return;
  if (!confirm(`¿Eliminar el producto "${product.name}"?`)) return;
  AppDB.delete("products", productId);
  Router.loadView("productos");
},

deleteCategory(parentName, categoryName) {
  const session = Auth.getSession();

  if (session?.role !== "ADMIN") {
    alert("Solo un administrador puede eliminar categorías.");
    return;
  }

  const category = AppDB.find("categories", c =>
    String(c.parentName || c.parent || "General") === String(parentName) &&
    String(c.name || "General") === String(categoryName)
  );

  if (!category) {
    alert("No se encontró la categoría.");
    return;
  }

  const productsInCategory = AppDB.filter("products", p =>
    String(p.parentCategory || p.categoryParent || "General") === String(parentName) &&
    String(p.subcategory || p.category || "General") === String(categoryName)
  );

  if (productsInCategory.length > 0) {
    const deleteProducts = confirm(
      `La categoría "${categoryName}" tiene ${productsInCategory.length} producto(s).\n\n¿Quieres eliminar también esos productos?`
    );

    if (!deleteProducts) {
      alert("No se eliminó la categoría porque todavía tiene productos dentro.");
      return;
    }

    productsInCategory.forEach(p => AppDB.delete("products", p.id));
  }

  if (!confirm(`¿Eliminar la categoría "${categoryName}"?`)) return;

  AppDB.delete("categories", category.id);

  if (ProductosUI.filter.category === categoryName) {
    ProductosUI.resetFilter();
    return;
  }

  Router.loadView("productos");
}
};

document.addEventListener("input", (e) => {
  if (
    e.target &&
    [
      "productCode",
      "productName",
      "productPrice",
      "productParentCategory",
      "productSubcategory",
      "productKitchen",
      "productPriority"
    ].includes(e.target.id)
  ) {
    if (typeof ProductosUI !== "undefined") ProductosUI.updatePreview();
  }
});

document.addEventListener("change", (e) => {
  if (
    e.target &&
    ["productKitchen", "productActive"].includes(e.target.id)
  ) {
    if (typeof ProductosUI !== "undefined") ProductosUI.updatePreview();
  }
});
