async function seedApp() {
  if (AppDB.getAll("users").length === 0) {
    AppDB.insert("users", { id:"U1", name:"Administrador", username:"admin", password:"1234", role:"ADMIN", active:true });
    AppDB.insert("users", { id:"U2", name:"Supervisor", username:"supervisor", password:"1234", role:"SUPERVISOR", active:true });
    AppDB.insert("users", { id:"U3", name:"Cajero", username:"cajero", password:"1234", role:"CAJERO", active:true });
    AppDB.insert("users", { id:"U4", name:"Mesero", username:"mesero", password:"1234", role:"MESERO", active:true });
  }

  if (AppDB.getAll("tableAreas").length === 0) {
    AppDB.insert("tableAreas", { id:"TA1", name:"Salón principal", active:true });
    AppDB.insert("tableAreas", { id:"TA2", name:"Terraza", active:true });
  }

  if (AppDB.getAll("appConfig").length === 0) {
    AppDB.insert("appConfig", {
      id: "main-config",
      businessName: "KitchenOS Restaurant",
      businessPhone: "",
      businessAddress: "",
      ticketMessage: "Gracias por su compra",
      ticketLogo: "",
      currency: "Q"
    });
  }

  if (AppDB.getAll("printers").length === 0) {
    AppDB.insert("printers", { id:"P1", name:"Impresora Cocina", deviceName:"EPSON-COCINA", type:"TICKET", active:true });
    AppDB.insert("printers", { id:"P2", name:"Impresora Bar", deviceName:"EPSON-BAR", type:"TICKET", active:true });
    AppDB.insert("printers", { id:"P3", name:"Impresora Caja", deviceName:"EPSON-CAJA", type:"TICKET", active:true });
  }

  if (AppDB.getAll("kitchens").length === 0) {
    AppDB.insert("kitchens", { id:"K1", name:"Cocina principal", printerId:"P1", active:true });
    AppDB.insert("kitchens", { id:"K2", name:"Bar", printerId:"P2", active:true });
  }

  if (AppDB.getAll("categories").length === 0) {
    AppDB.insert("categories", { id:"CAT1", parentName:"Comidas", name:"Hamburguesas", active:true });
    AppDB.insert("categories", { id:"CAT2", parentName:"Comidas", name:"Entradas", active:true });
    AppDB.insert("categories", { id:"CAT3", parentName:"Comidas", name:"Pizzas", active:true });
    AppDB.insert("categories", { id:"CAT4", parentName:"Bebidas", name:"Preparadas", active:true });
    AppDB.insert("categories", { id:"CAT5", parentName:"Bebidas", name:"Frías", active:true });
  }

  if (AppDB.getAll("mesas").length === 0) {
    for (let i = 1; i <= 12; i++) {
      AppDB.insert("mesas", {
        id: `M${i}`,
        name: `Mesa ${i}`,
        status: "libre",
        area: i <= 8 ? "Salón principal" : "Terraza",
        areaId: i <= 8 ? "TA1" : "TA2",
        open: false
      });
    }
  }

  if (AppDB.getAll("products").length === 0) {
    AppDB.insert("products", { id:"PR1", name:"Hamburguesa", price:45, image:"", category:"Hamburguesas", parentCategory:"Comidas", subcategory:"Hamburguesas", categoryId:"CAT1", kitchenId:"K1", active:true });
    AppDB.insert("products", { id:"PR2", name:"Nachos", price:35, image:"", category:"Entradas", parentCategory:"Comidas", subcategory:"Entradas", categoryId:"CAT2", kitchenId:"K1", active:true });
    AppDB.insert("products", { id:"PR3", name:"Michelada", price:28, image:"", category:"Preparadas", parentCategory:"Bebidas", subcategory:"Preparadas", categoryId:"CAT4", kitchenId:"K2", active:true });
    AppDB.insert("products", { id:"PR4", name:"Limonada", price:18, image:"", category:"Frías", parentCategory:"Bebidas", subcategory:"Frías", categoryId:"CAT5", kitchenId:"K2", active:true });
    AppDB.insert("products", { id:"PR5", name:"Pizza personal", price:55, image:"", category:"Pizzas", parentCategory:"Comidas", subcategory:"Pizzas", categoryId:"CAT3", kitchenId:"K1", active:true });
    AppDB.insert("products", { id:"PR6", name:"Gaseosa", price:12, image:"", category:"Frías", parentCategory:"Bebidas", subcategory:"Frías", categoryId:"CAT5", kitchenId:"K2", active:true });
  } else {
    let touched = false;
    AppDB.data.products = AppDB.data.products.map(product => {
      const parentCategory = product.parentCategory || product.categoryParent || (String(product.category || "").toLowerCase().includes("beb") ? "Bebidas" : "Comidas");
      const subcategory = product.subcategory || product.category || "General";
      const category = AppDB.find("categories", c => c.parentName === parentCategory && c.name === subcategory)
        || AppDB.insert("categories", { id: Utils.uid("CAT"), parentName: parentCategory, name: subcategory, active: true });
      touched = true;
      return {
        ...product,
        category: subcategory,
        parentCategory,
        categoryParent: parentCategory,
        subcategory,
        categoryId: product.categoryId || category.id
      };
    });
    if (touched) AppDB.save();
  }

  if (AppDB.getAll("sales").length === 0) {
    AppDB.insert("sales", { id:"S1", ticketNo:"T-0001", date:Utils.now(), ts:Date.now(), method:"Efectivo", total:125 });
    AppDB.insert("sales", { id:"S2", ticketNo:"T-0002", date:Utils.now(), ts:Date.now(), method:"Tarjeta", total:89 });
  }

  if (AppDB.getAll("takeawayOrders").length === 0) {
    AppDB.insert("takeawayOrders", {
      id:"L1",
      code:"LLEVAR-0001",
      customer:"Cliente mostrador",
      status:"PENDIENTE",
      total:65,
      date:Utils.now()
    });
  }

  Settings.load();
}