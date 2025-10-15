import { WebSocket } from "ws";
import { v4 as uuidv4 } from "uuid";
import { EventEmitter } from "events";

/**
 * MCP WebSocket Client - 支持并发连接多个MCP服务器
 */
export class MCPWebSocketClient extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // server_name -> connection info
    this.pendingRequests = new Map(); // request_id -> promise resolver
    this.isInitialized = false;
  }

  /**
   * 初始化客户端
   */
  async initialize() {
    if (this.isInitialized) return;

    console.log("🚀 MCP Client initializing...");
    this.isInitialized = true;
    this.emit("initialized");
  }

  /**
   * 连接到MCP服务器
   * @param {string} serverName - 服务器名称
   * @param {string} endpoint - WebSocket端点
   * @param {Object} options - 连接选项
   */
  async connectServer(serverName, endpoint, options = {}) {
    if (this.connections.has(serverName)) {
      throw new Error(`Server ${serverName} already connected`);
    }

    console.log(`🔗 Connecting to MCP server: ${serverName}`);

    const connection = {
      serverName,
      endpoint,
      ws: null,
      status: "connecting",
      tools: new Map(),
      resources: new Map(),
      capabilities: {},
      lastPing: Date.now(),
    };

    try {
      // 创建WebSocket连接
      connection.ws = new WebSocket(endpoint, options);

      // 设置连接事件处理
      this.setupConnectionHandlers(connection);

      // 等待连接建立
      await this.waitForConnection(connection);

      // 执行握手
      await this.performHandshake(connection);

      this.connections.set(serverName, connection);
      console.log(`✅ Connected to ${serverName}`);

      this.emit("serverConnected", serverName);
      return connection;
    } catch (error) {
      console.error(`❌ Failed to connect to ${serverName}:`, error.message);
      throw error;
    }
  }

  /**
   * 设置连接事件处理器
   */
  setupConnectionHandlers(connection) {
    const { ws, serverName } = connection;

    ws.on("open", () => {
      connection.status = "connected";
      console.log(`📡 WebSocket connected to ${serverName}`);
    });

    ws.on("message", (data) => {
      this.handleMessage(connection, data);
    });

    ws.on("error", (error) => {
      console.error(`🚨 WebSocket error for ${serverName}:`, error.message);
      connection.status = "error";
      this.emit("serverError", serverName, error);
    });

    ws.on("close", () => {
      console.log(`🔌 WebSocket closed for ${serverName}`);
      connection.status = "disconnected";
      this.emit("serverDisconnected", serverName);
    });
  }

  /**
   * 等待WebSocket连接建立
   */
  waitForConnection(connection) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      connection.ws.once("open", () => {
        clearTimeout(timeout);
        resolve();
      });

      connection.ws.once("error", (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }

  /**
   * 执行MCP握手协议
   */
  async performHandshake(connection) {
    const initRequest = {
      jsonrpc: "2.0",
      id: uuidv4(),
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
        },
        clientInfo: {
          name: "mcp-client-toolkit",
          version: "1.0.0",
        },
      },
    };

    const response = await this.sendRequest(connection, initRequest);

    if (response.error) {
      throw new Error(`Handshake failed: ${response.error.message}`);
    }

    // 保存服务器能力
    connection.capabilities = response.result.capabilities || {};

    // 获取可用工具列表
    await this.loadServerTools(connection);

    // 获取可用资源列表
    await this.loadServerResources(connection);
  }

  /**
   * 加载服务器工具列表
   */
  async loadServerTools(connection) {
    try {
      const toolsRequest = {
        jsonrpc: "2.0",
        id: uuidv4(),
        method: "tools/list",
      };

      const response = await this.sendRequest(connection, toolsRequest);

      if (response.result && response.result.tools) {
        response.result.tools.forEach((tool) => {
          connection.tools.set(tool.name, tool);
        });
        console.log(
          `🔧 Loaded ${connection.tools.size} tools from ${connection.serverName}`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️  Failed to load tools from ${connection.serverName}:`,
        error.message
      );
    }
  }

  /**
   * 加载服务器资源列表
   */
  async loadServerResources(connection) {
    try {
      const resourcesRequest = {
        jsonrpc: "2.0",
        id: uuidv4(),
        method: "resources/list",
      };

      const response = await this.sendRequest(connection, resourcesRequest);

      if (response.result && response.result.resources) {
        response.result.resources.forEach((resource) => {
          connection.resources.set(resource.uri, resource);
        });
        console.log(
          `📚 Loaded ${connection.resources.size} resources from ${connection.serverName}`
        );
      }
    } catch (error) {
      console.warn(
        `⚠️  Failed to load resources from ${connection.serverName}:`,
        error.message
      );
    }
  }

  /**
   * 处理收到的消息
   */
  handleMessage(connection, data) {
    try {
      const message = JSON.parse(data.toString());

      // 处理响应消息
      if (message.id && this.pendingRequests.has(message.id)) {
        const resolver = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        resolver(message);
        return;
      }

      // 处理通知消息
      if (message.method) {
        this.handleNotification(connection, message);
      }
    } catch (error) {
      console.error(
        `❌ Failed to parse message from ${connection.serverName}:`,
        error.message
      );
    }
  }

  /**
   * 处理通知消息
   */
  handleNotification(connection, message) {
    console.log(
      `📢 Notification from ${connection.serverName}:`,
      message.method
    );
    this.emit("notification", connection.serverName, message);
  }

  /**
   * 发送请求到指定连接
   */
  sendRequest(connection, request, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (connection.status !== "connected") {
        reject(new Error(`Server ${connection.serverName} not connected`));
        return;
      }

      const requestId = request.id || uuidv4();
      request.id = requestId;

      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request timeout for ${connection.serverName}`));
      }, timeout);

      // 保存请求解析器
      this.pendingRequests.set(requestId, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });

      // 发送请求
      try {
        connection.ws.send(JSON.stringify(request));
      } catch (error) {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 调用工具 - 支持并发调用多个服务器
   * @param {string} serverName - 服务器名称
   * @param {string} toolName - 工具名称
   * @param {Object} args - 工具参数
   */
  async callTool(serverName, toolName, args = {}) {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`Server ${serverName} not connected`);
    }

    if (!connection.tools.has(toolName)) {
      throw new Error(`Tool ${toolName} not available on server ${serverName}`);
    }

    const request = {
      jsonrpc: "2.0",
      id: uuidv4(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    console.log(`🔧 Calling tool ${toolName} on ${serverName}`);
    const response = await this.sendRequest(connection, request);

    if (response.error) {
      throw new Error(`Tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * 访问资源
   * @param {string} serverName - 服务器名称
   * @param {string} uri - 资源URI
   */
  async accessResource(serverName, uri) {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`Server ${serverName} not connected`);
    }

    const request = {
      jsonrpc: "2.0",
      id: uuidv4(),
      method: "resources/read",
      params: {
        uri,
      },
    };

    console.log(`📚 Accessing resource ${uri} on ${serverName}`);
    const response = await this.sendRequest(connection, request);

    if (response.error) {
      throw new Error(`Resource access failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * 并发调用多个工具
   * @param {Array} calls - 调用配置数组 [{serverName, toolName, args}, ...]
   */
  async callToolsConcurrently(calls) {
    console.log(`🚀 Starting ${calls.length} concurrent tool calls`);

    const promises = calls.map(async (call, index) => {
      try {
        const result = await this.callTool(
          call.serverName,
          call.toolName,
          call.args
        );
        return { index, success: true, result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    console.log(`✅ Completed ${results.length} concurrent calls`);

    return results;
  }

  /**
   * 获取所有连接的服务器信息
   */
  getConnectedServers() {
    const servers = {};
    for (const [name, connection] of this.connections) {
      servers[name] = {
        status: connection.status,
        toolCount: connection.tools.size,
        resourceCount: connection.resources.size,
        capabilities: connection.capabilities,
      };
    }
    return servers;
  }

  /**
   * 断开指定服务器连接
   */
  async disconnectServer(serverName) {
    const connection = this.connections.get(serverName);
    if (!connection) return;

    if (connection.ws) {
      connection.ws.close();
    }

    this.connections.delete(serverName);
    console.log(`🔌 Disconnected from ${serverName}`);
  }

  /**
   * 断开所有连接
   */
  async disconnectAll() {
    const serverNames = Array.from(this.connections.keys());
    await Promise.all(serverNames.map((name) => this.disconnectServer(name)));
    console.log("🔌 All servers disconnected");
  }
}
