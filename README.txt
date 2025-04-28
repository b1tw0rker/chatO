# Startscrtipt
# Name: bwChartServer.service

[Unit]
Description=chatO - Operator Chat System
Documentation=https://www.host-x.de
After=network.target

[Service]
Environment=NODE_PORT=3000
Type=simple
User=root
ExecStart=/usr/bin/node /opt/chatO/srv.js
Restart=on-failure
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/opt/chatO/

[Install]
WantedBy=multi-user.target
