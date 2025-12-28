#!/bin/bash

# Add writepretend.com redirect to nginx config
sudo bash -c 'cat >> /etc/nginx/sites-enabled/my1eparty << "EOF"

# Redirect writepretend.com to my1e.party
server {
    listen 80;
    server_name writepretend.com www.writepretend.com;
    return 301 https://my1e.party$request_uri;
}
EOF
'

# Test and reload nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✅ writepretend.com redirect added!"
