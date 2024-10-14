const Strapi = require('@strapi/strapi');
const http = require('http');
const socketIO = require("socket.io");

async function startServer() {
  try {
    // Create a Strapi instance
    const strapi = await Strapi().load();

    // Start the Strapi instance
    await strapi.start();

    // Create HTTP server using Strapi's app
    const server = http.createServer(strapi.server.app);

    // Set up WebSocket using Socket.IO
    const io = socketIO(server, {
      cors: {
        origin: ["http://localhost:3000", "http://localhost:1337","https://aynafrontend.netlify.app"], // Allow both frontend and backend URLs
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    // WebSocket connection logic
    io.on('connection', (socket) => {
      console.log('A user connected');

      socket.on('chat message', async (msg) => {
        console.log('Message received:', msg);

        try {
          // Save message to Strapi's Message API
          const savedMessage = await strapi.entityService.create('api::message.message', {
            data: {
              content: msg.content,
              user: msg.userId,
              timestamp: new Date()
            }
          });

          // Emit the saved message back to all clients
          io.emit('chat message', msg);
        } catch (error) {
          console.error('Error saving message:', error);
          socket.emit('error', { message: 'Failed to save message' });
        }
      });

      socket.on('disconnect', () => {
        console.log('User disconnected');
      });
    });

    // Ensure authentication routes are exposed
    // strapi.server.app.use(strapi.middlewares.auth);

    // Get the port from Strapi config
    const port = strapi.config.get('server.port', 1337);

    // Start listening
    server.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

  } catch (error) {
    console.error('Failed to start the server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();