const NodeCache = require('node-cache');

// Cache con TTL específicos para diferentes tipos de datos
const kitchenCache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL_KITCHEN) || 30, // 30 segundos para datos de cocina
  checkperiod: 10 // Verificar elementos expirados cada 10 segundos
});

const ordersCache = new NodeCache({ 
  stdTTL: parseInt(process.env.CACHE_TTL_ORDERS) || 15, // 15 segundos para órdenes
  checkperiod: 5 
});

const tablesCache = new NodeCache({ 
  stdTTL: 60, // 1 minuto para mesas (cambian menos frecuente)
  checkperiod: 20 
});

const menuCache = new NodeCache({ 
  stdTTL: 300, // 5 minutos para menú (casi estático)
  checkperiod: 60 
});

module.exports = {
  kitchenCache,
  ordersCache,
  tablesCache,
  menuCache,
  
  // Métodos para invalidar cache cuando hay cambios
  invalidateKitchen: () => {
    kitchenCache.flushAll();
    console.log('🗑️ Cache de cocina invalidado');
  },
  
  invalidateOrders: () => {
    ordersCache.flushAll();
    console.log('🗑️ Cache de órdenes invalidado');
  },
  
  invalidateTables: () => {
    tablesCache.flushAll();
    console.log('🗑️ Cache de mesas invalidado');
  },
  
  invalidateMenu: () => {
    menuCache.flushAll();
    console.log('🗑️ Cache de menú invalidado');
  },

  // Invalidar todo el cache
  invalidateAll: () => {
    kitchenCache.flushAll();
    ordersCache.flushAll();
    tablesCache.flushAll();
    menuCache.flushAll();
    console.log('🗑️ Todo el cache invalidado');
  },
  
  // Estadísticas de cache
  getCacheStats: () => {
    return {
      kitchen: kitchenCache.getStats(),
      orders: ordersCache.getStats(),
      tables: tablesCache.getStats(),
      menu: menuCache.getStats()
    };
  },

  // Obtener estadísticas de rendimiento de cache
  getStats: () => {
    return {
      kitchen: kitchenCache.getStats(),
      orders: ordersCache.getStats(),
      tables: tablesCache.getStats(),
      menu: menuCache.getStats()
    };
  }
};
