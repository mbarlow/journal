#!/usr/bin/env python3
# serve-https.py
# Simple HTTPS server for local development

import ssl
import http.server
import socketserver

PORT = 8443
Handler = http.server.SimpleHTTPRequestHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    # Create a self-signed certificate context
    context = ssl.create_default_context(ssl.Purpose.CLIENT_AUTH)
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    
    # For development only - creates temporary self-signed cert
    httpd.socket = ssl.wrap_socket(httpd.socket, 
                                   server_side=True,
                                   certfile=None,
                                   keyfile=None,
                                   ssl_version=ssl.PROTOCOL_TLS)
    
    print(f"Server running at https://localhost:{PORT}/")
    httpd.serve_forever()