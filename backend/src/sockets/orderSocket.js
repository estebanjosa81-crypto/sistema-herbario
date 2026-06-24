const setupOrderSocket = (io) => {
  // Contador de conexiones activas por rol
  const activeConnections = {
    mesero: new Set(),
    cocinero: new Set(),
    cajero: new Set(),
    admin: new Set()
  };

  io.on('connection', (socket) => {
    console.log('Cliente conectado:', socket.id);

    // Unirse a sala por rol con soporte para múltiples usuarios
    socket.on('join-role', (data) => {
      let role, userId;
      
      // Soporte para formato anterior y nuevo
      if (typeof data === 'string') {
        role = data;
        userId = socket.id; // Fallback al socket ID
      } else {
        role = data.role;
        userId = data.userId || socket.id;
      }
      
      socket.join(role);
      socket.join(`${role}-${userId}`); // Sala específica por usuario
      socket.userId = userId;
      socket.role = role;
      
      // Rastrear conexiones activas
      if (activeConnections[role]) {
        activeConnections[role].add(userId);
      }
      
      console.log(`👤 Usuario ${userId} se unió a sala: ${role} (${activeConnections[role]?.size || 0} activos)`);
      
      // Notificar estadísticas de conexiones a admins
      io.to('admin').emit('connection-stats', {
        mesero: activeConnections.mesero.size,
        cocinero: activeConnections.cocinero.size,
        cajero: activeConnections.cajero.size,
        admin: activeConnections.admin.size
      });
    });

    // Heartbeat para detectar conexiones perdidas
    socket.on('ping', () => {
      socket.emit('pong');
    });

    // Nuevo pedido (mesero → cocina)
    socket.on('new-order', (orderData) => {
      io.to('cocinero').emit('order-received', orderData);
      io.to('cajero').emit('order-pending', orderData);
    });

    // Actualización de estado (cocina → mesero/cajero)
    socket.on('order-status-update', (data) => {
      io.to('mesero').emit('order-updated', data);
      if (data.status === 'listo') {
        io.to('cajero').emit('order-ready', data);
      }
    });

    // Pago procesado (cajero → todos)
    socket.on('payment-processed', (paymentData) => {
      io.emit('payment-completed', paymentData);
    });

    // Manejo de desconexión con cleanup
    socket.on('disconnect', () => {
      console.log(`🔌 Cliente desconectado: ${socket.id} (${socket.role}-${socket.userId})`);
      
      // Limpiar de conexiones activas
      if (socket.role && socket.userId && activeConnections[socket.role]) {
        activeConnections[socket.role].delete(socket.userId);
        
        // Notificar nuevas estadísticas
        io.to('admin').emit('connection-stats', {
          mesero: activeConnections.mesero.size,
          cocinero: activeConnections.cocinero.size,
          cajero: activeConnections.cajero.size,
          admin: activeConnections.admin.size
        });
      }
    });
  });
};

module.exports = setupOrderSocket;
