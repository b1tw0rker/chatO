# ChatO

![virtualXS version](https://img.shields.io/badge/version-v1.0.0-green.svg) ![Letztes Update](https://img.shields.io/github/last-commit/b1tw0rker/chatO.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)

# Install howto

1.) Checkout
2.) npm install

Based on an idea from Chatcord - Chatserver with rooms - https://github.com/bradtraversy/chatcord

https://github.com/invingagan1/express-https-server-socket

https://expressjs.com/de/starter/static-files.html

https://medium.com/flutter-community/realtime-chat-app-one-to-one-using-flutter-socket-io-node-js-acd4152c6a00 -- one to one chat with flutter

https://socket.io/docs/v3/rooms/index.html -- rooms

https://socket.io/docs/v3/emit-cheatsheet/index.html

https://socket.io/docs/v4/admin-ui/

https://socket.io/docs/v4/admin-ui/

### Startscript

https://nodesource.com/blog/running-your-node-js-app-with-systemd-part-1/

### Linux StartScript

#### Name: bwChartServer.service

[Unit]
Description=bwChatServer - Operator ChatBot System
Documentation=https://www.host-x.de
After=network.target

[Service]
Environment=NODE_PORT=3000
Type=simple
User=root
ExecStart=/usr/bin/node /opt/bwChatServer/srv.js
Restart=on-failure
Environment=PATH=/usr/bin:/usr/local/bin
Environment=NODE_ENV=production
WorkingDirectory=/opt/bwChatServer/

[Install]
WantedBy=multi-user.target
