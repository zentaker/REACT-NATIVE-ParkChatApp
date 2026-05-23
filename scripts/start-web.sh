#!/bin/bash
set -e

# Start Expo Metro on port 5000
npx expo start --web --port 5000 &
EXPO_PID=$!

# Wait for Metro to respond on port 5000
echo "[start-web] Waiting for Metro on port 5000..."
until curl -s http://localhost:5000/ > /dev/null 2>&1; do
  sleep 1
done
echo "[start-web] Metro ready on port 5000"

# Start reverse proxy on port 8081 -> 5000
# Port 8081 is mapped to externalPort 80 in .replit, making the public URL work
node - << 'EOF'
const http = require('http');

function proxy(req, res) {
  const opts = {
    hostname: 'localhost',
    port: 5000,
    path: req.url,
    method: req.method,
    headers: { ...req.headers, host: 'localhost' },
  };
  const pr = http.request(opts, (r) => {
    res.writeHead(r.statusCode, r.headers);
    r.pipe(res);
  });
  pr.on('error', () => { try { res.writeHead(502); res.end(); } catch (_) {} });
  req.pipe(pr);
}

const server = http.createServer(proxy);

// WebSocket upgrade proxy (for Metro hot-reload)
server.on('upgrade', (req, socket, head) => {
  const net = require('net');
  const dest = net.createConnection({ port: 5000 }, () => {
    dest.write(
      `GET ${req.url} HTTP/1.1\r\nHost: localhost\r\nUpgrade: websocket\r\nConnection: Upgrade\r\n` +
      Object.entries(req.headers)
        .filter(([k]) => !['host','connection','upgrade'].includes(k.toLowerCase()))
        .map(([k,v]) => `${k}: ${v}`)
        .join('\r\n') +
      '\r\n\r\n'
    );
  });
  socket.pipe(dest);
  dest.pipe(socket);
  socket.on('error', () => dest.destroy());
  dest.on('error', () => socket.destroy());
});

server.listen(8081, () => console.log('[start-web] Proxy 8081 -> 5000 ready'));
EOF

wait $EXPO_PID
