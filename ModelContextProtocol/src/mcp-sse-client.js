import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { EventSource } from "eventsource";
import fetch from "node-fetch";

/**
 * MCP SSE (Server-Sent Events) 客户端实现
 * 基于HTTP SSE协议与MCP服务器通信
 */
export class MCPSSEClient extends EventEmitter {
  constructor(options = {}) {
    super();
    this.connections = new Map(); // server_name -> connection info
    this.pendingRequests = new Map(); // request_id -> promise resolver
    this.isInitialized = false;
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * 初始化SSE客户端
   */
  async initialize() {
    if (this.isInitialized) return;
    console.log("🚀 MCP SSE Client initializing...");
    this.isInitialized = true;
    this.emit("initialized");
  }

  /**
   * 连接到MCP SSE服务器
   * @param {string} serverName - 服务器名称
   * @param {string} endpoint - SSE端点URL
   * @param {Object} options - 连接选项
   */
  async connectServer(serverName, endpoint, options = {}) {
    if (this.connections.has(serverName)) {
      throw new Error(`SSE Server ${serverName} already connected`);
    }
    console.log(`🔗 Connecting to MCP SSE server: ${serverName}`);
    console.log(`   Endpoint: ${endpoint}`);
    const connection = {
      serverName,
      endpoint,
      eventSource: null,
      status: "connecting",
      tools: new Map(),
      resources: new Map(),
      capabilities: {},
      lastPing: Date.now(),
    };
    try {
      const eventSource = new EventSource(endpoint); // 创建EventSource连接
      connection.eventSource = eventSource;

      eventSource.onmessage = (event) => {
        console.log(`💬 Received message from ${serverName}`, event);
      };
      this.setupSSEHandlers(connection); // 设置SSE事件处理
      await this.waitForSSEConnection(connection); // 等待连接建立
      await this.performMCPHandshake(connection); // 执行MCP握手
      this.connections.set(serverName, connection);
      console.log(`✅ Connected to SSE server ${serverName}`);
      this.emit("serverConnected", serverName);
      return connection;
    } catch (error) {
      console.error(`❌ Failed to connect to SSE server ${serverName}:`, error.message);
      if (connection.eventSource) {
        connection.eventSource.close();
      }
      throw error;
    }
  }

  /**
   * 设置SSE事件处理器
   */
  setupSSEHandlers(connection) {
    const { eventSource, serverName } = connection;
    eventSource.onopen = () => {
      connection.status = "connected";
      console.log(`📡 SSE connection opened to ${serverName}`);
    };
    eventSource.onmessage = (event) => {
      this.handleSSEMessage(connection, event);
    };
    eventSource.onerror = (error) => {
      console.error(`🚨 SSE error for ${serverName}:`, error);
      connection.status = "error";
      this.emit("serverError", serverName, error);
    };
    // 监听自定义事件类型
    eventSource.addEventListener("mcp-response", (event) => {
      this.handleMCPResponse(connection, event);
    });
    eventSource.addEventListener("mcp-notification", (event) => {
      this.handleMCPNotification(connection, event);
    });
  }

  /**
   * 处理SSE消息
   */
  handleSSEMessage(connection, event) {
    console.log(`💬 Received SSE message from ${connection.serverName}`, event);
    try {
      const data = JSON.parse(event.data);
      this.processMCPMessage(connection, data);
    } catch (error) {
      console.error(`❌ Failed to parse SSE message from ${connection.serverName}:`, error.message);
    }
  }

  /**
   * 处理MCP响应事件
   */
  handleMCPResponse(connection, event) {
    try {
      const response = JSON.parse(event.data);
      this.processMCPMessage(connection, response);
    } catch (error) {
      console.error(`❌ Failed to parse MCP response from ${connection.serverName}:`, error.message);
    }
  }

  /**
   * 处理MCP通知事件
   */
  handleMCPNotification(connection, event) {
    try {
      const notification = JSON.parse(event.data);
      console.log(`📢 MCP notification from ${connection.serverName}:`, notification.method);
      this.emit("notification", connection.serverName, notification);
    } catch (error) {
      console.error(`❌ Failed to parse MCP notification from ${connection.serverName}:`, error.message);
    }
  }

  /**
   * 处理MCP消息
   */
  processMCPMessage(connection, message) {
    // 处理响应消息
    if (message.id && this.pendingRequests.has(message.id)) {
      const resolver = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      resolver(message);
      return;
    }
    // 处理通知消息
    if (message.method) {
      console.log(`📢 MCP notification from ${connection.serverName}:`, message.method);
      this.emit("notification", connection.serverName, message);
    }
  }

  /**
   * 等待SSE连接建立
   */
  waitForSSEConnection(connection) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("SSE connection timeout"));
      }, 10000);
      const checkConnection = () => {
        if (connection.status === "connected") {
          clearTimeout(timeout);
          resolve();
        } else if (connection.status === "error") {
          clearTimeout(timeout);
          reject(new Error("SSE connection failed"));
        } else {
          setTimeout(checkConnection, 100);
        }
      };
      checkConnection();
    });
  }

  /**
   * 执行MCP握手协议
   */
  async performMCPHandshake(connection) {
    console.log(`🤝 Performing MCP handshake with ${connection.serverName} via SSE`);
    try {
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
            name: "mcp-sse-client-toolkit",
            version: "1.0.0",
          },
        },
      };
      const response = await this.sendMCPRequest(connection, initRequest);
      if (response && response.error) {
        throw new Error(`MCP SSE handshake failed: ${response.error.message}`);
      }
      // 保存服务器能力
      if (response && response.result) {
        connection.capabilities = response.result.capabilities || {};
        console.log(`🔧 SSE Server capabilities:`, Object.keys(connection.capabilities));
      } else {
        console.log(`⚠️ No handshake response from ${connection.serverName}, assuming basic capabilities`);
        connection.capabilities = { tools: {}, resources: {} };
      }
      // 发送initialized通知
      try {
        const initializedNotification = { jsonrpc: "2.0", method: "notifications/initialized" };
        await this.sendMCPNotification(connection, initializedNotification);
      } catch (error) {
        console.warn(`⚠️ Failed to send initialized notification to ${connection.serverName}:`, error.message);
      }
      // 获取可用工具和资源
      await this.loadServerCapabilities(connection);
    } catch (error) {
      console.warn(`⚠️ MCP handshake partially failed for ${connection.serverName}:`, error.message);
      // 设置默认能力以继续工作
      connection.capabilities = { tools: {}, resources: {} };
    }
  }

  /**
   * 加载服务器能力
   */
  async loadServerCapabilities(connection) {
    // 加载工具列表
    if (connection.capabilities.tools) {
      try {
        const toolsRequest = { jsonrpc: "2.0", id: uuidv4(), method: "tools/list" };
        const response = await this.sendMCPRequest(connection, toolsRequest);
        if (response.result && response.result.tools) {
          response.result.tools.forEach((tool) => {
            connection.tools.set(tool.name, tool);
          });
          console.log(`🔧 Loaded ${connection.tools.size} tools from SSE server ${connection.serverName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load tools from SSE server ${connection.serverName}:`, error.message);
      }
    }

    // 加载资源列表
    if (connection.capabilities.resources) {
      try {
        const resourcesRequest = {
          jsonrpc: "2.0",
          id: uuidv4(),
          method: "resources/list",
        };

        const response = await this.sendMCPRequest(connection, resourcesRequest);

        if (response.result && response.result.resources) {
          response.result.resources.forEach((resource) => {
            connection.resources.set(resource.uri, resource);
          });
          console.log(`📚 Loaded ${connection.resources.size} resources from SSE server ${connection.serverName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load resources from SSE server ${connection.serverName}:`, error.message);
      }
    }
  }

  /**
   * 发送MCP请求（通过HTTP POST）
   */
  async sendMCPRequest(connection, request, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (connection.status !== "connected") {
        reject(new Error(`SSE Server ${connection.serverName} not connected`));
        return;
      }

      const requestId = request.id || uuidv4();
      request.id = requestId;

      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        console.warn(`⚠️ SSE request timeout for ${connection.serverName}, continuing...`);
        resolve(null); // 返回null而不是拒绝
      }, timeout);

      // 保存请求解析器
      this.pendingRequests.set(requestId, (response) => {
        clearTimeout(timeoutId);
        resolve(response);
      });

      // 通过HTTP POST发送请求
      this.postMCPMessage(connection, request).catch((error) => {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutId);
        console.warn(`⚠️ Failed to send MCP request to ${connection.serverName}:`, error.message);
        resolve(null); // 返回null而不是拒绝，允许SSE-only模式
      });
    });
  }

  /**
   * 通过HTTP POST发送MCP消息
   */
  async postMCPMessage(connection, message) {
    const uuid = uuidv4();
    const postEndpoint = connection.endpoint.replace("/sse", `/messages/?session_id=${uuid}`);
    try {
      const response = await fetch(postEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(message) });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      throw new Error(`Failed to post MCP message: ${error.message}`);
    }
  }

  /**
   * 发送MCP通知（通过HTTP POST）
   */
  async sendMCPNotification(connection, notification) {
    if (connection.status !== "connected") {
      throw new Error(`SSE Server ${connection.serverName} not connected`);
    }
    try {
      await this.postMCPMessage(connection, notification);
    } catch (error) {
      console.warn(`⚠️ Failed to send SSE notification to ${connection.serverName}:`, error.message);
      // 不抛出异常，允许SSE-only模式继续工作
    }
  }

  /**
   * 调用工具
   */
  async callTool(serverName, toolName, args = {}) {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`SSE Server ${serverName} not connected`);
    }

    if (!connection.tools.has(toolName)) {
      throw new Error(`Tool ${toolName} not available on SSE server ${serverName}`);
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

    console.log(`🔧 Calling tool ${toolName} on SSE server ${serverName}`);
    const response = await this.sendMCPRequest(connection, request);

    if (response.error) {
      throw new Error(`SSE tool call failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * 访问资源
   */
  async accessResource(serverName, uri) {
    const connection = this.connections.get(serverName);
    if (!connection) {
      throw new Error(`SSE Server ${serverName} not connected`);
    }

    const request = {
      jsonrpc: "2.0",
      id: uuidv4(),
      method: "resources/read",
      params: {
        uri,
      },
    };

    console.log(`📚 Accessing resource ${uri} on SSE server ${serverName}`);
    const response = await this.sendMCPRequest(connection, request);

    if (response.error) {
      throw new Error(`SSE resource access failed: ${response.error.message}`);
    }

    return response.result;
  }

  /**
   * 并发调用多个工具
   */
  async callToolsConcurrently(calls) {
    console.log(`🚀 Starting ${calls.length} concurrent SSE tool calls`);

    const promises = calls.map(async (call, index) => {
      try {
        const result = await this.callTool(call.serverName, call.toolName, call.args);
        return { index, success: true, result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    console.log(`✅ Completed ${results.length} concurrent SSE calls`);

    return results;
  }

  /**
   * 获取所有连接的服务器信息
   */
  getConnectedServers() {
    return this.connections;
  }

  /**
   * 断开SSE服务器连接
   */
  async disconnectServer(serverName) {
    const connection = this.connections.get(serverName);
    if (!connection) return;

    console.log(`🔌 Disconnecting from SSE server: ${serverName}`);

    if (connection.eventSource) {
      connection.eventSource.close();
    }

    this.connections.delete(serverName);
    console.log(`🔌 Disconnected from SSE server ${serverName}`);
  }

  /**
   * 断开所有SSE连接
   */
  async disconnectAll() {
    const serverNames = Array.from(this.connections.keys());
    await Promise.all(serverNames.map((name) => this.disconnectServer(name)));
    console.log("🔌 All SSE servers disconnected");
  }
}
