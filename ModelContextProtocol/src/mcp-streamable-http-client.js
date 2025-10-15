import { EventEmitter } from "events";
import http from "http";
import https from "https";
import { URL } from "url";
import { v4 as uuidv4 } from "uuid";

/**
 * MCP Streamable HTTP Client
 * 基于HTTP/1.1分块传输编码实现的MCP客户端
 * 支持双向流式通信，符合MCP最新传输协议规范
 */
export class MCPStreamableHTTPClient extends EventEmitter {
  constructor(options = {}) {
    super();

    this.serverUrl = options.serverUrl || "http://localhost:3000/mcp";
    this.timeout = options.timeout || 30000;
    this.retryAttempts = options.retryAttempts || 3;
    this.retryDelay = options.retryDelay || 1000;
    this.keepAliveInterval = options.keepAliveInterval || 30000;

    // 连接状态
    this.connected = false;
    this.connecting = false;
    this.isInitialized = false;

    // 请求管理
    this.requestId = 0;
    this.pendingRequests = new Map();

    // HTTP连接
    this.request = null;
    this.response = null;

    // 服务器信息
    this.serverInfo = null;
    this.serverCapabilities = null;
    this.tools = new Map();
    this.resources = new Map();

    // 缓冲区管理
    this.responseBuffer = "";

    // 心跳管理
    this.keepAliveTimer = null;
    this.lastActivity = Date.now();

    this.setupErrorHandling();
  }

  setupErrorHandling() {
    this.on("error", (error) => {
      console.error("MCPStreamableHTTPClient error:", error);
    });
  }

  /**
   * 初始化并连接到MCP服务器
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.connecting) {
      // 等待当前连接完成
      return new Promise((resolve, reject) => {
        this.once("connected", resolve);
        this.once("error", reject);
      });
    }

    this.connecting = true;
    console.log("🚀 MCP Streamable HTTP Client initializing...");

    try {
      await this.connect();
      await this.performHandshake();
      await this.loadServerCapabilities();

      this.connected = true;
      this.connecting = false;
      this.isInitialized = true;

      this.startKeepAlive();
      this.emit("connected");
      console.log("✅ Streamable HTTP MCP客户端连接成功");
    } catch (error) {
      this.connecting = false;
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 建立HTTP流式连接
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const url = new URL(this.serverUrl);
      const isHttps = url.protocol === "https:";
      const httpModule = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Transfer-Encoding": "chunked",
          Connection: "keep-alive",
          Accept: "application/json",
          "User-Agent": "MCP-StreamableHTTP-Client/1.0",
        },
        timeout: this.timeout,
      };

      this.request = httpModule.request(options, (response) => {
        this.response = response;

        if (response.statusCode !== 200) {
          reject(
            new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`)
          );
          return;
        }

        // 设置响应处理
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          this.handleResponseChunk(chunk);
        });

        response.on("end", () => {
          this.handleConnectionEnd();
        });

        response.on("error", (error) => {
          this.emit("error", error);
        });

        resolve();
      });

      this.request.on("error", (error) => {
        reject(error);
      });

      this.request.on("timeout", () => {
        reject(new Error("Connection timeout"));
      });
    });
  }

  /**
   * 处理响应数据块
   */
  handleResponseChunk(chunk) {
    this.responseBuffer += chunk;

    // 处理完整的JSON消息
    let lines = this.responseBuffer.split("\n");
    this.responseBuffer = lines.pop() || ""; // 保留不完整的行

    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line.trim());
          this.handleMessage(message);
        } catch (error) {
          console.error("解析消息失败:", error, "Raw line:", line);
        }
      }
    }
  }

  /**
   * 处理连接结束
   */
  handleConnectionEnd() {
    this.connected = false;
    this.emit("disconnected");
    console.log("🔌 Streamable HTTP连接已断开");
  }

  /**
   * 执行MCP握手协议
   */
  async performHandshake() {
    console.log("🤝 Performing MCP handshake via Streamable HTTP");

    const initializeRequest = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
          resources: {},
        },
        clientInfo: {
          name: "mcp-streamable-http-client-toolkit",
          version: "1.0.0",
        },
      },
    };

    const response = await this.sendRequest(initializeRequest);

    if (response.error) {
      throw new Error(
        `MCP Streamable HTTP handshake failed: ${response.error.message}`
      );
    }

    this.serverInfo = response.result.serverInfo;
    this.serverCapabilities = response.result.capabilities || {};

    // 发送initialized通知
    await this.sendNotification({
      jsonrpc: "2.0",
      method: "notifications/initialized",
    });

    console.log("🤝 MCP握手完成");
    console.log("📋 服务器信息:", this.serverInfo);
    console.log("🔧 服务器能力:", Object.keys(this.serverCapabilities));
  }

  /**
   * 加载服务器能力（工具和资源）
   */
  async loadServerCapabilities() {
    // 加载工具列表
    if (this.serverCapabilities.tools) {
      try {
        const toolsRequest = {
          jsonrpc: "2.0",
          id: this.getNextRequestId(),
          method: "tools/list",
        };

        const response = await this.sendRequest(toolsRequest);

        if (response.result && response.result.tools) {
          response.result.tools.forEach((tool) => {
            this.tools.set(tool.name, tool);
          });
          console.log(
            `🔧 Loaded ${this.tools.size} tools from Streamable HTTP server`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️  Failed to load tools from Streamable HTTP server:`,
          error.message
        );
      }
    }

    // 加载资源列表
    if (this.serverCapabilities.resources) {
      try {
        const resourcesRequest = {
          jsonrpc: "2.0",
          id: this.getNextRequestId(),
          method: "resources/list",
        };

        const response = await this.sendRequest(resourcesRequest);

        if (response.result && response.result.resources) {
          response.result.resources.forEach((resource) => {
            this.resources.set(resource.uri, resource);
          });
          console.log(
            `📚 Loaded ${this.resources.size} resources from Streamable HTTP server`
          );
        }
      } catch (error) {
        console.warn(
          `⚠️  Failed to load resources from Streamable HTTP server:`,
          error.message
        );
      }
    }
  }

  /**
   * 启动心跳保持连接
   */
  startKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(async () => {
      try {
        if (
          this.connected &&
          Date.now() - this.lastActivity > this.keepAliveInterval
        ) {
          await this.ping();
        }
      } catch (error) {
        console.warn("心跳检查失败:", error.message);
        this.emit("error", error);
      }
    }, this.keepAliveInterval);
  }

  /**
   * 发送ping请求保持连接活跃
   */
  async ping() {
    const pingRequest = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "ping",
    };

    try {
      await this.sendRequest(pingRequest);
      this.lastActivity = Date.now();
    } catch (error) {
      console.error("Ping failed:", error.message);
      throw error;
    }
  }

  /**
   * 发送请求并等待响应
   */
  async sendRequest(request) {
    return new Promise((resolve, reject) => {
      const requestId = request.id;

      // 设置超时
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`请求超时: ${requestId}`));
      }, this.timeout);

      // 存储待处理请求
      this.pendingRequests.set(requestId, {
        resolve: (response) => {
          clearTimeout(timeout);
          resolve(response);
        },
        reject: (error) => {
          clearTimeout(timeout);
          reject(error);
        },
      });

      // 发送请求
      this.sendMessage(request);
    });
  }

  /**
   * 发送通知（无需响应）
   */
  async sendNotification(notification) {
    this.sendMessage(notification);
  }

  /**
   * 发送消息到服务器
   */
  sendMessage(message) {
    if (!this.request || !this.connected) {
      throw new Error("未连接到服务器");
    }

    const messageStr = JSON.stringify(message) + "\n";

    try {
      this.request.write(messageStr);
    } catch (error) {
      this.emit("error", error);
      throw error;
    }
  }

  /**
   * 处理收到的消息
   */
  handleMessage(message) {
    if (message.id && this.pendingRequests.has(message.id)) {
      // 这是对请求的响应
      const pending = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      pending.resolve(message);
    } else if (message.method) {
      // 这是服务器发送的通知或请求
      this.emit("notification", message);
    } else {
      console.warn("收到未知消息:", message);
    }
  }

  /**
   * 获取下一个请求ID
   */
  getNextRequestId() {
    return uuidv4();
  }

  /**
   * 列出可用工具
   */
  async listTools() {
    if (!this.connected) {
      throw new Error("客户端未连接");
    }

    const request = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "tools/list",
    };

    const response = await this.sendRequest(request);

    if (response.error) {
      throw new Error(`获取工具列表失败: ${response.error.message}`);
    }

    return response.result.tools || [];
  }

  /**
   * 调用工具
   */
  async callTool(toolName, args = {}) {
    if (!this.connected) {
      throw new Error("Streamable HTTP client not connected");
    }

    if (!this.tools.has(toolName)) {
      throw new Error(
        `Tool ${toolName} not available on Streamable HTTP server`
      );
    }

    const request = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    };

    console.log(`🔧 Calling tool ${toolName} on Streamable HTTP server`);
    const response = await this.sendRequest(request);

    if (response.error) {
      throw new Error(
        `Streamable HTTP tool call failed: ${response.error.message}`
      );
    }

    return response.result;
  }

  /**
   * 并发调用多个工具
   */
  async callToolsConcurrently(calls) {
    console.log(
      `🚀 Starting ${calls.length} concurrent Streamable HTTP tool calls`
    );

    const promises = calls.map(async (call, index) => {
      try {
        const result = await this.callTool(call.toolName, call.args);
        return { index, success: true, result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });

    const results = await Promise.all(promises);
    console.log(
      `✅ Completed ${results.length} concurrent Streamable HTTP calls`
    );

    return results;
  }

  /**
   * 列出可用资源
   */
  async listResources() {
    if (!this.connected) {
      throw new Error("客户端未连接");
    }

    const request = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "resources/list",
    };

    const response = await this.sendRequest(request);

    if (response.error) {
      throw new Error(`获取资源列表失败: ${response.error.message}`);
    }

    return response.result.resources || [];
  }

  /**
   * 访问资源
   */
  async accessResource(uri) {
    if (!this.connected) {
      throw new Error("Streamable HTTP client not connected");
    }

    const request = {
      jsonrpc: "2.0",
      id: this.getNextRequestId(),
      method: "resources/read",
      params: {
        uri: uri,
      },
    };

    console.log(`📚 Accessing resource ${uri} on Streamable HTTP server`);
    const response = await this.sendRequest(request);

    if (response.error) {
      throw new Error(
        `Streamable HTTP resource access failed: ${response.error.message}`
      );
    }

    return response.result;
  }

  /**
   * 读取资源（别名方法）
   */
  async readResource(uri) {
    return this.accessResource(uri);
  }

  /**
   * 获取连接状态
   */
  isConnected() {
    return this.connected;
  }

  /**
   * 获取服务器信息
   */
  getServerInfo() {
    return {
      info: this.serverInfo,
      capabilities: this.serverCapabilities,
    };
  }

  /**
   * 断开连接
   */
  async disconnect() {
    if (!this.connected && !this.connecting) {
      return;
    }

    console.log("🔌 Disconnecting from Streamable HTTP server");

    try {
      // 停止心跳
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }

      // 清理待处理请求
      for (const [id, pending] of this.pendingRequests) {
        pending.reject(new Error("Connection disconnected"));
      }
      this.pendingRequests.clear();

      // 关闭HTTP连接
      if (this.request) {
        this.request.end();
        this.request = null;
      }

      if (this.response) {
        this.response = null;
      }

      // 重置状态
      this.connected = false;
      this.connecting = false;
      this.isInitialized = false;
      this.responseBuffer = "";

      // 清理服务器信息
      this.tools.clear();
      this.resources.clear();

      this.emit("disconnected");
      console.log("🔌 Streamable HTTP server disconnected");
    } catch (error) {
      this.emit("error", error);
    }
  }

  /**
   * 获取连接的服务器信息
   */
  getServerInfo() {
    return {
      connected: this.connected,
      serverInfo: this.serverInfo,
      capabilities: this.serverCapabilities,
      toolCount: this.tools.size,
      resourceCount: this.resources.size,
      tools: Array.from(this.tools.keys()),
      resources: Array.from(this.resources.keys()),
    };
  }

  /**
   * 重连机制
   */
  async reconnect() {
    console.log("🔄 尝试重新连接...");

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        await this.disconnect();
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryDelay * attempt)
        );
        await this.initialize();

        console.log(`✅ 重连成功 (尝试 ${attempt}/${this.retryAttempts})`);
        return;
      } catch (error) {
        console.error(
          `❌ 重连失败 (尝试 ${attempt}/${this.retryAttempts}):`,
          error.message
        );

        if (attempt === this.retryAttempts) {
          throw new Error(`重连失败，已尝试 ${this.retryAttempts} 次`);
        }
      }
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    if (!this.connected) {
      return { status: "disconnected" };
    }

    try {
      const startTime = Date.now();
      await this.listTools(); // 使用简单的工具列表请求作为健康检查
      const responseTime = Date.now() - startTime;

      return {
        status: "healthy",
        responseTime: responseTime,
        serverInfo: this.serverInfo,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        error: error.message,
      };
    }
  }
}

/**
 * 创建Streamable HTTP MCP客户端的便捷函数
 */
export async function createMCPStreamableHTTPClient(options = {}) {
  const client = new MCPStreamableHTTPClient(options);
  await client.initialize();
  return client;
}

export default MCPStreamableHTTPClient;
