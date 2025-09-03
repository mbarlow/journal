// https-server.js
// Simple HTTPS server for Tailscale development

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Generate self-signed certificate if needed
if (!fs.existsSync('cert.pem') || !fs.existsSync('key.pem')) {
    console.log('Generating self-signed certificate...');
    execSync('openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"', { stdio: 'inherit' });
}

const options = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
};

https.createServer(options, (req, res) => {
    const filePath = path.join(__dirname, req.url === '/' ? '/index.html' : req.url);
    const extname = path.extname(filePath).toLowerCase();
    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
        if (error) {
            res.writeHead(404);
            res.end('File not found');
            return;
        }

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
    });
}).listen(8443, '0.0.0.0', () => {
    console.log('HTTPS server running on https://0.0.0.0:8443/');
    console.log('Access via Tailscale: https://[your-tailscale-ip]:8443');
    console.log('You\'ll need to accept the security warning on your phone');
});