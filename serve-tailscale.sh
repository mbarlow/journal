#!/bin/bash
# serve-tailscale.sh
# HTTPS server for Tailscale testing with self-signed certificate

echo "Setting up HTTPS server for Tailscale access..."

# Generate self-signed certificate if it doesn't exist
if [ ! -f cert.pem ] || [ ! -f key.pem ]; then
    echo "Generating self-signed certificate..."
    openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes -subj "/CN=localhost"
fi

echo "Starting HTTPS server on port 8443..."
echo "Access your journal at: https://[your-tailscale-ip]:8443"
echo "Note: You'll need to accept the security warning in your browser"
echo ""

# Use Python's built-in HTTPS server
python3 << 'EOF'
import ssl
import http.server
import socketserver

PORT = 8443

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers for better mobile support
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

Handler = MyHTTPRequestHandler

with socketserver.TCPServer(("0.0.0.0", PORT), Handler) as httpd:
    context = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER)
    context.load_cert_chain('cert.pem', 'key.pem')
    httpd.socket = context.wrap_socket(httpd.socket, server_side=True)
    
    print(f"HTTPS Server running on https://0.0.0.0:{PORT}/")
    print("Accept the certificate warning on your phone to proceed")
    httpd.serve_forever()
EOF