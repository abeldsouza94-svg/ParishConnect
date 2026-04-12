const net = require('net');
const http = require('http');
const ws = require('ws');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');
const log = require('../common/logger.js');

class TunnelServer {
  constructor(configPath) {
    this.config = this.loadConfig(configPath);
    this.tunnels = new Map();        // remotePort -> clientSocket
    this.httpTunnels = new Map();     // remoteDomain -> clientSocket
    this.tunnelServers = new Map();  // remotePort -> net.Server
    this.connections = new Map();   // connectionId -> { socket, state, buffer }
    this.httpConnections = new Map(); // connectionId -> { socket, state, buffer }
    this.connectionIdCounter = 0;

    // Encryption configuration
    this.cryptoConfig = {
      algorithm: 'aes-256-gcm',
      key: crypto.scryptSync(this.config.crypto.password, 'salt', 32),
      ivLength: 12
    };
  }

  encrypt(data) {
    const iv = crypto.randomBytes(this.cryptoConfig.ivLength);
    const cipher = crypto.createCipheriv(this.cryptoConfig.algorithm, this.cryptoConfig.key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
  }

  decrypt(encryptedData) {
    const iv = encryptedData.subarray(0, this.cryptoConfig.ivLength);
    const authTag = encryptedData.subarray(this.cryptoConfig.ivLength, this.cryptoConfig.ivLength + 16);
    const data = encryptedData.subarray(this.cryptoConfig.ivLength + 16);
    const decipher = crypto.createDecipheriv(this.cryptoConfig.algorithm, this.cryptoConfig.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(data), decipher.final()]);
  }

  loadConfig(configPath) {
    try {
      const filePath = path.resolve(process.cwd(), configPath);
      return yaml.load(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {
      throw new Error(`Server config error: ${e.message}`);
    }
  }

  start() {
    // TCP control server
    const server = net.createServer(socket => this.handleControlConnection(socket));
    server.listen(this.config.port, () => {
      log.info('Server', `Control server listening on ${this.config.port}`);
    });

    // HTTP control server
    const httpServer = http.createServer((req, res) => { this.handleHttpControlConnection(req, res); });
    // HTTP control server with websocket shared port server
    const wsServer = new ws.Server({ server: httpServer });
    wsServer.on('connection', (ws, request) => { this.handleHttpWsControlConnection(ws, request) });

    httpServer.listen(this.config.httpPort, () => {
      log.info('Server', `Control HTTP server listening on ${this.config.httpPort}`);
    });
  }

  handleHttpWsControlConnection(ws, request) {
    const host = request.headers['host'].split(':')[0];
    const tunnelSocket = this.httpTunnels.get(host);
    if (!tunnelSocket) {
      ws.send(`Domain not registered`);
      ws.close();
      return;
    }

    const connectionId = this.generateConnectionId();
    this.httpConnections.set(connectionId, { ws, host });
    const headerJson = {
      url: request.url,
      headers: request.headers,
      host: host
    };
    const headerPacket = Buffer.concat([
      Buffer.from([0x46]), // HTTP WS data handling
      this.buildConnectionIdBuffer(connectionId),
      Buffer.from([0x43]), // C means JSON header data
      Buffer.from(JSON.stringify(headerJson), 'utf8')
    ]);
    this.sendPacket(tunnelSocket, headerPacket);

    ws.on('message', (message) => {
      const dataPacket = Buffer.concat([
        Buffer.from([0x46]), // HTTP WS data handling
        this.buildConnectionIdBuffer(connectionId),
        Buffer.from([0x44]), // D means data
        Buffer.from(message.toString('utf8'), 'utf8')
      ]);
      this.sendPacket(tunnelSocket, dataPacket);
    });

    ws.on('close', () => {
      const endPacket = Buffer.concat([
        Buffer.from([0x46]), // HTTP WS data handling
        this.buildConnectionIdBuffer(connectionId),
        Buffer.from([0x45])  // E means data transfer complete
      ]);
      this.sendPacket(tunnelSocket, endPacket);
    });
  }

  handleHttpControlConnection(req, res) {
    const host = req.headers['host'].split(':')[0];
    const tunnelSocket = this.httpTunnels.get(host);

    if (!tunnelSocket) {
      res.statusCode = 404; // Status code
      res.setHeader('Content-Type', 'text/plain'); // Set response header
      res.end('Domain not registered');
      return;
    }

    const connectionId = this.generateConnectionId();
    this.httpConnections.set(connectionId, { res, host });

    // Protocol format: [command(0x45)][connectionId(4 bytes)][subcommand][JSON header data]
    const headerJson = {
      method: req.method,
      url: req.url,
      headers: req.headers,
      connectionId: connectionId,
      host: host
    };
    const headerPacket = Buffer.concat([
      Buffer.from([0x45]), // HTTP data handling
      this.buildConnectionIdBuffer(connectionId),
      Buffer.from([0x43]), // C means JSON header data
      Buffer.from(JSON.stringify(headerJson), 'utf8')
    ]);
    this.sendPacket(tunnelSocket, headerPacket);

    // Handle content body
    req.on('data', chunk => {
      const dataPacket = Buffer.concat([
        Buffer.from([0x45]), // HTTP data handling
        this.buildConnectionIdBuffer(connectionId),
        Buffer.from([0x44]), // D means data
        chunk
      ]);
      this.sendPacket(tunnelSocket, dataPacket);
    })

    req.on('end', () => {
      const endPacket = Buffer.concat([
        Buffer.from([0x45]), // HTTP data handling
        this.buildConnectionIdBuffer(connectionId),
        Buffer.from([0x45])  // E means data transfer complete
      ]);
      this.sendPacket(tunnelSocket, endPacket);
    })

  }

  handleControlConnection(clientSocket) {
    let buffer = Buffer.alloc(0);
    
    clientSocket.on('data', data => {
      buffer = Buffer.concat([buffer, data]);
      while (buffer.length >= 4) {
        const pkgLen = buffer.readUInt32BE(0);
        if (buffer.length < 4 + pkgLen) break;
        
        const packet = buffer.slice(4, 4 + pkgLen);
        buffer = buffer.slice(4 + pkgLen);
        const decryptedPacket = this.decrypt(packet);
        this.processPacket(clientSocket, decryptedPacket);
      }
    });

    clientSocket.on('error', err => {
      log.error('Server', `Control socket error: ${err.message}`);
    });

    clientSocket.on('close', () => {
      log.info('Server', `Tunnel client disconnected `);
      this.closeClientTunnalsAndServers(clientSocket);
    });
  }

  closeClientTunnalsAndServers(clientSocket) {
    for (const [remotePort, socket] of this.tunnels.entries()) {
      if (socket === clientSocket) {
        this.tunnels.delete(remotePort);
        const server = this.tunnelServers.get(remotePort);
        if (server) {
          server.close();
          if(server._sockets) {
            server._sockets.forEach((socket) => {
              socket.destroy(); // Force close connection 
            });
            server._sockets.clear();
          }
        }
      }
    }
    // Close HTTP tunnel
    for (const [domain, socket] of this.httpTunnels.entries()) {
      if (socket === clientSocket) {
        log.info('Server', `Closed HTTP tunnel for domain ${domain}`);
        this.httpTunnels.delete(domain);
      }
    }
  }

  processPacket(clientSocket, packet) {
    const cmd = packet[0]; // Command byte is always first
    const payload = packet.slice(1);

    switch (cmd) {
      case 0x52: // 'R' Register tunnel
        if (payload[0] === 0x48) { // H means HTTP registration
          this.handleHttpRegister(clientSocket, payload.slice(1));
        } else {
          this.handleRegister(clientSocket, payload);
        }
        break;
      case 0x41: // 'A' ACK confirmation
      case 0x44: // 'D' TCP data transmission
        this.handleConnectionData(cmd, payload);
        break;
      case 0x45: // 'D' HTTP data transmission
        this.handleHttpConnectionData(cmd, payload);
        break;
      case 0x46: // 'E' HTTP WS data transmission
        this.handleHttpWsConnectionData(cmd, payload);
        break;
      case 0x48: // 'H' Heartbeat packet
        // Reply with the same heartbeat packet after receiving
        const response = Buffer.alloc(1);
        response.writeUInt8(0x48, 0);
        this.sendPacket(clientSocket, response);
        break;
    }
  }

  handleHttpWsConnectionData(cmd, payload){
    const connectionId = payload.readUInt32BE(0);
    const subCmd = payload[4]; // Subcommand
    const data = payload.slice(5); // Data
    const conn = this.httpConnections.get(connectionId);
    if (!conn) return;
    switch (subCmd) {
      case 0x43: // 'C' means JSON header data
        break;
      case 0x44: // 'D' means data
        // 检查是否是第一次写入数据，如果是则需要解析头信息并设置响应头
        conn.ws.send(data.toString('utf8'));
        break;
      case 0x45: // 'E' means end
        conn.ws.close();
        this.httpConnections.delete(connectionId);
        break;
    }
  }

  handleHttpConnectionData(cmd, payload){
    const connectionId = payload.readUInt32BE(0);
    const subCmd = payload[4]; // Subcommand
    const data = payload.slice(5); // Data
    const conn = this.httpConnections.get(connectionId);
    if (!conn) return;
    switch (subCmd) {
      case 0x43: // 'C' means JSON header data
        const headersJson = JSON.parse(data.toString('utf8'));
        conn.res.writeHead(headersJson.statusCode, headersJson.headers);
        break;
      case 0x44: // 'D' means data
        // Check if first write, parse header info and set response headers if needed
        conn.res.write(data);
        break;
      case 0x45: // 'E' means HTTP end
        conn.res.end();
        this.httpConnections.delete(connectionId);
        break;
    }
  }


  handleRegister(clientSocket, payload) {
    const remotePort = payload.readUInt16BE(0);
    if (this.tunnels.has(remotePort)) return;
    
    this.tunnels.set(remotePort, clientSocket);
    log.info('Server', `Registered port ${remotePort}`);
    this.createPublicServer(remotePort, clientSocket);
  }

  /**
   * HTTP domain registration
   * @param {*} clientSocket 
   * @param {*} payload 
   */
  handleHttpRegister(clientSocket, payload) {
    const domain = payload.toString('utf8');
    if (this.httpTunnels.has(domain)) {
      this.sendNoticePacket(clientSocket, this.buildNoticeHttpJson(false, domain, 'Domain is already occupied'));
      return;
    }

    this.httpTunnels.set(domain, clientSocket);
    this.sendNoticePacket(clientSocket, this.buildNoticeHttpJson(true, domain, 'Domain registration successful'));
    log.info('Server', `Registered HTTP domain ${domain}`);
  }

  createPublicServer(remotePort, clientSocket) {
    if (this.tunnelServers.has(remotePort)) {
      this.sendNoticePacket(clientSocket, this.buildNoticeTcpJson(false, remotePort, 'Port is already occupied'));
      return;
    }

    const server = net.createServer(externalSocket => {
      if (!server._sockets) server._sockets = new Set();
      server._sockets.add(externalSocket);
      const connectionId = this.generateConnectionId();
      externalSocket.pause();

      // Initialize connection state
      this.connections.set(connectionId, {
        socket: externalSocket,
        state: 'connecting',
        timer: setTimeout(() => {
          log.info('Server', `Connection ${connectionId} timeout`);
          externalSocket.destroy();
          this.connections.delete(connectionId);
        }, 5000)
      });

      // Build CONNECT packet (protocol version 1)
      const packet = Buffer.alloc(7);
      packet.writeUInt8(0x43, 0);        // Command byte
      packet.writeUInt32BE(connectionId, 1); // Connection ID
      packet.writeUInt16BE(remotePort, 5);    // Port number
      this.sendPacket(clientSocket, packet);

      // Listen to external connection data (fix point)
      externalSocket.on('data', data => {
        const conn = this.connections.get(connectionId);
        if (!conn) return;

        // Build DATA packet (protocol version 1)
        const dataPacket = Buffer.alloc(5 + data.length);
        dataPacket.writeUInt8(0x44, 0);       // Command byte
        dataPacket.writeUInt32BE(connectionId, 1); // Connection ID
        data.copy(dataPacket, 5);
        this.sendPacket(clientSocket, dataPacket);
      });

      externalSocket.on('close', () => {
        this.connections.delete(connectionId);
        server._sockets.delete(externalSocket);
      });

      externalSocket.on('error', err => {
        log.error('Server', `External socket error: ${err.message}`);
        this.connections.delete(connectionId);
      });
    });

    server.listen(remotePort, () => {
      log.info('Server', `Public server listening on ${remotePort}`);
      this.sendNoticePacket(clientSocket, this.buildNoticeTcpJson(true, remotePort, 'Remote port is open'));
    });
    server.on('error', (err) => {
      log.error('Server', `Failed to start public server on port ${remotePort}: ${err.message}`);
      this.sendNoticePacket(clientSocket, this.buildNoticeTcpJson(false, remotePort, `${err.message}`));
      server.close(); // Close the serve
    });
    server.on('close', () => {
      log.info('Server', `Public server closed for port ${remotePort}`);
      this.sendNoticePacket(clientSocket, this.buildNoticeTcpJson(false, remotePort, 'Remote port is closed'));
      this.tunnels.delete(remotePort); 
      this.tunnelServers.delete(remotePort);
    });
    this.tunnelServers.set(remotePort, server);
  }

  handleConnectionData(cmd, payload) {
    const connectionId = payload.readUInt32BE(0);
    const conn = this.connections.get(connectionId);
    if (!conn) return;

    switch (cmd) {
      case 0x41: // ACK processing
        if (conn.state === 'connecting') {
          conn.state = 'ready';
          conn.socket.resume();
          clearTimeout(conn.timer);
        }
        break;
      case 0x44: // Data processing
        const data = payload.slice(4);
        if (conn.state === 'ready') {
          conn.socket.write(data);
        } else {
          conn.buffer.push(data);
        }
        break;
    }
  }

  generateConnectionId() {
    this.connectionIdCounter = (this.connectionIdCounter + 1) % 0xFFFFFFFF;
    return this.connectionIdCounter;
  }

  sendPacket(socket, data) {
    const lengthHeader = Buffer.alloc(4);
    const encryptedData = this.encrypt(data);
    lengthHeader.writeUInt32BE(encryptedData.length, 0);
    socket.write(Buffer.concat([lengthHeader, encryptedData]));
  }

  /**
   * Send notification
   * @param {*} clientSocket 
   * @param {*} noticeJson 
   */
  sendNoticePacket(clientSocket, noticeJson) {
    const noticeBuffer = Buffer.from(JSON.stringify(noticeJson), 'utf8');
    const dataPacket = Buffer.alloc(1 + noticeBuffer.length);
    dataPacket.writeUInt8(0x4E, 0);       // Command byte
    noticeBuffer.copy(dataPacket, 1);
    this.sendPacket(clientSocket, dataPacket);
  }

  /**
   * Build TCP notification JSON
   * @param {*} success 
   * @param {*} remotePort 
   * @param {*} message 
   * @returns 
   */
  buildNoticeTcpJson(success, remotePort, message) {
    return {
      success: success,
      type: 'tcp',
      remotePort: remotePort,
      message: message
    };
  }

  /**
   * Build HTTP notification JSON
   * @param {*} success 
   * @param {*} remoteDomain 
   * @param {*} message 
   * @returns 
   */
  buildNoticeHttpJson(success, remoteDomain, message) {
    return {
      success: success,
      type: 'http',
      remoteDomain: remoteDomain,
      message: message
    };
  }

  buildConnectionIdBuffer(connectionId) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32BE(connectionId, 0);
    return buffer;
  }
}

module.exports = {
  TunnelServer
};