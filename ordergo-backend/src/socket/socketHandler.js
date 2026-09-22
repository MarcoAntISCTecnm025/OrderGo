const initSocketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log(`⚡ Cliente conectado a WebSockets: ${socket.id}`);

        // El cliente se une a una sala específica para seguir su pedido
        socket.on('join_order_room', (orderId) => {
            socket.join(`order_${orderId}`);
            console.log(`👤 Socket ${socket.id} se unió a la sala del pedido: ${orderId}`);
        });

        socket.on('disconnect', () => {
            console.log(`🔌 Cliente desconectado: ${socket.id}`);
        });
    });
};

module.exports = initSocketHandler;