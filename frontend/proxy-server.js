const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 5173;
const DIST = path.join(__dirname, 'dist');
const API_TARGET = 'http://127.0.0.1:8000';

const MIME = {
  '.html': 'text/html',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.json': 'application/json',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
};

http.createServer((req, res) => {
  if (req.url.startsWith('/api')) {
    const options = {
      hostname: '127.0.0.1',
      port: 8000,
      path: req.url,
      method: req.method,
      headers: req.headers,
    };
    const proxy = http.request(options, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    proxy.on('error', () => { res.writeHead(502); res.end('Backend not reachable'); });
    req.pipe(proxy);
    return;
  }

  let filePath = path.join(DIST, req.url === '/' ? 'index.html' : req.url);
  if (!fs.existsSync(filePath)) filePath = path.join(DIST, 'index.html');
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, () => {
  console.log('Proxy server running at http://localhost:' + PORT);
});
