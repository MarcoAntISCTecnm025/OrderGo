const http = require('http');
const app = require('./src/app');
const initSocket = require('./src/config/socket');
const initSocketHandler = require('./src/socket/socketHandler');

const PORT = process.env.PORT || 5000;

// Crear servidor HTTP
const server = http.createServer(app);

// Inicializar Socket.io
const io = initSocket(server);

// Configurar eventos de sockets
initSocketHandler(io);

// Almacenar io en app para usarlo en controladores si es necesario
app.io = io;

// Iniciar servidor
server.listen(PORT, () => {
    console.log(`    ╔════════════════════════════════════╗    ║   🚀 OrderGo Backend Iniciado      ║    ║   Puerto: ${PORT}                    ║    ║   Ambiente: ${process.env.NODE_ENV}        ║    ╚════════════════════════════════════╝  `);
});