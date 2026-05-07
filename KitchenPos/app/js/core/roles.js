const Roles = {
  ADMIN: "ADMIN",
  SUPERVISOR: "SUPERVISOR",
  CAJERO: "CAJERO",
  MESERO: "MESERO",
  COCINA: "COCINA",

  permissions: {
   ADMIN: ["dashboard","mesas","llevar","domicilio","orden","productos","productosVendidos","caja","historial","cierres","usuarios","configuracion"],
    SUPERVISOR: ["dashboard","mesas","llevar","orden","productos","productosVendidos","caja","historial"],
    CAJERO: ["dashboard","mesas","llevar","orden","productosVendidos","caja","historial","domicilio"],
    MESERO: ["dashboard","mesas","llevar","orden"],
    COCINA: ["dashboard"]
  },

  can(role, view) {
    return (this.permissions[role] || []).includes(view);
  }
};