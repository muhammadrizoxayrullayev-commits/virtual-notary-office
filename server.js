const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0';
const port = parseInt(process.env.PORT || '3000', 10);
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  const players = new Map();

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on('join_office', (data) => {
      const { userId, role, name, image } = data;
      const player = {
        id: socket.id,
        userId,
        role,
        name,
        image,
        x: 10,
        y: 10,
        direction: 'down',
        status: 'ONLINE',
      };
      
      players.set(socket.id, player);
      
      socket.emit('office_state', Array.from(players.values()));
      socket.broadcast.emit('player_joined', player);
    });

    socket.on('move', ({ x, y, direction }) => {
      const player = players.get(socket.id);
      if (player) {
        player.x = x;
        player.y = y;
        player.direction = direction;
        socket.broadcast.emit('player_moved', { id: socket.id, x, y, direction });
      }
    });

    socket.on('update_status', (status) => {
      const player = players.get(socket.id);
      if (player) {
        player.status = status;
        io.emit('status_changed', { id: socket.id, status });
      }
    });

    socket.on('disconnect', () => {
      players.delete(socket.id);
      io.emit('player_left', socket.id);
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});
