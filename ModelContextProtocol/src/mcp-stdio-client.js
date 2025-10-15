import { spawn } from "child_process";
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";

/**
 * 真实MCP协议的stdio客户端实现
 * 基于标准输入输出与MCP服务器通信
 */
export class MCPStdioClient extends EventEmitter {
  constructor() {
    super();
    this.servers = new Map(); // server_name -> server info
    this.pendingRequests = new Map(); // request_id -> promise resolver
    this.isInitialized = false;
  }

  /**
   * 初始化客户端
   */
  async initialize() {
    if (this.isInitialized) return;
    console.log("🚀 MCP Stdio Client initializing...");
    this.isInitialized = true;
    this.emit("initialized");
  }

  /**
   * 启动MCP服务器进程并建立stdio连接
   * @param {string} serverName - 服务器名称
   * @param {string} command - 启动命令
   * @param {Array} args - 命令参数
   * @param {Object} options - 启动选项
   */
  async startServer(serverName, command, args = [], options = {}) {
    if (this.servers.has(serverName)) {
      throw new Error(`Server ${serverName} already started`);
    }
    console.log(`🔗 Starting MCP server: ${serverName}`);
    console.log(`   Command: ${command} ${args.join(" ")} ${JSON.stringify(options)}`);
    const serverInfo = {
      serverName,
      command,
      args,
      options,
      process: null,
      status: "starting",
      tools: new Map(),
      resources: new Map(),
      capabilities: {},
      messageBuffer: "",
      lastPing: Date.now(),
    };
    try {
      // 启动子进程
      serverInfo.process = spawn(command, args, {
        stdio: ["pipe", "pipe", "pipe"],
        ...options,
        env: { ...process.env, ...options.env },
      });
      this.setupProcessHandlers(serverInfo); // 设置进程事件处理
      await this.waitForProcessStart(serverInfo); // 等待进程启动
      await this.performMCPHandshake(serverInfo); // 执行MCP握手
      await this.loadServerCapabilities(serverInfo); // 获取可用工具和资源
      this.servers.set(serverName, serverInfo);
      console.log(`✅ MCP server ${serverName} started successfully`);
      this.emit("serverStarted", serverName);
      return serverInfo;
    } catch (error) {
      console.error(`❌ Failed to start MCP server ${serverName}:`, error.message);
      if (serverInfo.process) {
        serverInfo.process.kill();
      }
      throw error;
    }
  }

  /**
   * 设置进程事件处理器
   */
  setupProcessHandlers(serverInfo) {
    const { process: proc, serverName } = serverInfo;
    proc.on("spawn", () => {
      serverInfo.status = "running";
      console.log(`📡 MCP server process spawned: ${serverName}`);
    });
    proc.stdout.on("data", (data) => {
      this.handleStdoutData(serverInfo, data);
    });
    proc.stderr.on("data", (data) => {
      // console.error(`🚨 MCP server stderr [${serverName}]:`, data.toString());
    });
    proc.on("error", (error) => {
      console.error(`🚨 MCP server process error [${serverName}]:`, error.message);
      serverInfo.status = "error";
      this.emit("serverError", serverName, error);
    });
    proc.on("exit", (code, signal) => {
      console.log(`🔌 MCP server exited [${serverName}]: code=${code}, signal=${signal}`);
      serverInfo.status = "stopped";
      this.emit("serverStopped", serverName, code, signal);
    });
  }

  /**
   * 处理stdout数据 - MCP消息可能跨多个数据块
   */
  handleStdoutData(serverInfo, data) {
    serverInfo.messageBuffer += data.toString();
    // 处理完整的JSON-RPC消息（以换行符分隔）
    const lines = serverInfo.messageBuffer.split("\n");
    serverInfo.messageBuffer = lines.pop() || ""; // 保留不完整的行
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line.trim());
          this.handleMCPMessage(serverInfo, message);
        } catch (error) {
          console.error(`❌ Failed to parse MCP message from ${serverInfo.serverName}:`, error.message);
          console.error(`   Raw message: ${line}`);
        }
      }
    }
  }

  /**
   * 处理MCP消息
   */
  handleMCPMessage(serverInfo, message) {
    // 处理响应消息
    if (message.id && this.pendingRequests.has(message.id)) {
      const resolver = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      resolver(message);
      return;
    }
    // 处理通知消息
    if (message.method) {
      this.handleMCPNotification(serverInfo, message);
    }
  }

  /**
   * 处理MCP通知
   */
  handleMCPNotification(serverInfo, message) {
    console.log(`📢 MCP notification from ${serverInfo.serverName}:`, message.method);
    this.emit("notification", serverInfo.serverName, message);
  }

  /**
   * 等待进程启动
   */
  waitForProcessStart(serverInfo) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Process start timeout"));
      }, 10000);
      const checkStart = () => {
        if (serverInfo.status === "running") {
          clearTimeout(timeout);
          resolve();
        } else if (serverInfo.status === "error") {
          clearTimeout(timeout);
          reject(new Error("Process failed to start"));
        } else {
          setTimeout(checkStart, 100);
        }
      };
      checkStart();
    });
  }

  /**
   * 执行MCP握手协议
   */
  async performMCPHandshake(serverInfo) {
    console.log(`🤝 Performing MCP handshake with ${serverInfo.serverName}`);
    // 发送initialize请求
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
    const response = await this.sendMCPRequest(serverInfo, initRequest, undefined, false);
    if (response.error) {
      throw new Error(`MCP handshake failed: ${response.error.message}`);
    }
    // 保存服务器能力
    serverInfo.capabilities = response.result.capabilities || {};
    // 发送initialized通知
    const initializedNotification = {
      jsonrpc: "2.0",
      method: "notifications/initialized",
    };
    this.sendMCPNotification(serverInfo, initializedNotification);
  }

  /**
   * 加载服务器能力（工具和资源）
   */
  async loadServerCapabilities(serverInfo) {
    // 加载工具列表
    if (serverInfo.capabilities.tools) {
      try {
        const toolsRequest = {
          jsonrpc: "2.0",
          id: uuidv4(),
          method: "tools/list",
        };
        const response = await this.sendMCPRequest(serverInfo, toolsRequest, undefined, false);
        if (response.result && response.result.tools) {
          response.result.tools.forEach((tool) => {
            serverInfo.tools.set(tool.name, tool);
          });
          console.log(`🔧 Loaded ${serverInfo.tools.size} tools from ${serverInfo.serverName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load tools from ${serverInfo.serverName}:`, error.message);
      }
    }
    // 加载资源列表
    if (serverInfo.capabilities.resources) {
      try {
        const resourcesRequest = {
          jsonrpc: "2.0",
          id: uuidv4(),
          method: "resources/list",
        };
        const response = await this.sendMCPRequest(serverInfo, resourcesRequest, undefined, false);
        if (response.result && response.result.resources) {
          response.result.resources.forEach((resource) => {
            serverInfo.resources.set(resource.uri, resource);
          });
          console.log(`📚 Loaded ${serverInfo.resources.size} resources from ${serverInfo.serverName}`);
        }
      } catch (error) {
        console.warn(`⚠️  Failed to load resources from ${serverInfo.serverName}:`, error.message);
      }
    }
  }

  /**
   * 发送MCP请求
   */
  sendMCPRequest(serverInfo, request, timeout = 30000, logging = true) {
    return new Promise((resolve, reject) => {
      if (serverInfo.status !== "running") {
        reject(new Error(`MCP server ${serverInfo.serverName} not running`));
        return;
      }
      const requestId = request.id || uuidv4();
      request.id = requestId;
      // 设置超时
      const timeoutId = setTimeout(() => {
        logging && console.log(`❌ MCP request timeout for ${serverInfo.serverName}`);
        this.pendingRequests.delete(requestId);
        reject(new Error(`MCP request timeout for ${serverInfo.serverName}`));
      }, timeout);
      // 保存请求解析器
      this.pendingRequests.set(requestId, (response) => {
        logging && console.log(`⬅ Received response from ${serverInfo.serverName}: `, response);
        clearTimeout(timeoutId);
        resolve(response);
      });
      // 发送请求到stdin
      try {
        const message = JSON.stringify(request) + "\n";
        if (logging) {
          console.log(`\n⮕ Sending request to ${serverInfo.serverName}:`, JSON.stringify(request));
          console.log(request);
        }
        serverInfo.process.stdin.write(message);
      } catch (error) {
        this.pendingRequests.delete(requestId);
        clearTimeout(timeoutId);
        reject(error);
      }
    });
  }

  /**
   * 发送MCP通知（无需响应）
   */
  sendMCPNotification(serverInfo, notification) {
    if (serverInfo.status !== "running") {
      throw new Error(`MCP server ${serverInfo.serverName} not running`);
    }
    try {
      const message = JSON.stringify(notification) + "\n";
      serverInfo.process.stdin.write(message);
    } catch (error) {
      console.error(`❌ Failed to send notification to ${serverInfo.serverName}:`, error.message);
      throw error;
    }
  }

  /**
   * 调用MCP工具
   */
  async callTool(serverName, toolName, args = {}) {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`MCP server ${serverName} not started`);
    }
    if (!serverInfo.tools.has(toolName)) {
      throw new Error(`Tool ${toolName} not available on MCP server ${serverName}`);
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
    const response = await this.sendMCPRequest(serverInfo, request);
    if (response.error) {
      throw new Error(`MCP tool call failed: ${response.error.message}`);
    }
    return response.result;
  }

  /**
   * 访问MCP资源
   */
  async accessResource(serverName, uri) {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) {
      throw new Error(`MCP server ${serverName} not started`);
    }
    const request = { jsonrpc: "2.0", id: uuidv4(), method: "resources/read", params: { uri } };
    console.log(`📚 Accessing MCP resource ${uri} on ${serverName}`);
    const response = await this.sendMCPRequest(serverInfo, request);
    if (response.error) {
      throw new Error(`MCP resource access failed: ${response.error.message}`);
    }
    return response.result;
  }

  /**
   * 并发调用多个MCP工具
   */
  async callToolsConcurrently(calls) {
    console.log(`🚀 Starting ${calls.length} concurrent MCP tool calls`);
    const promises = calls.map(async (call, index) => {
      try {
        const result = await this.callTool(call.serverName, call.toolName, call.args);
        return { index, success: true, result };
      } catch (error) {
        return { index, success: false, error: error.message };
      }
    });
    const results = await Promise.all(promises);
    console.log(`✅ Completed ${results.length} concurrent MCP calls`);
    return results;
  }

  /**
   * 获取所有MCP服务器信息
   */
  getRunningServers() {
    return this.servers;
  }

  /**
   * 停止MCP服务器
   */
  async stopServer(serverName) {
    const serverInfo = this.servers.get(serverName);
    if (!serverInfo) return;
    console.log(`🛑 Stopping MCP server: ${serverName}`);
    if (serverInfo.process) {
      // 优雅关闭
      serverInfo.process.stdin.end();
      // 等待进程结束，如果超时则强制杀死
      setTimeout(() => {
        if (serverInfo.process && !serverInfo.process.killed) {
          serverInfo.process.kill("SIGTERM");
          setTimeout(() => {
            if (serverInfo.process && !serverInfo.process.killed) {
              serverInfo.process.kill("SIGKILL");
            }
          }, 5000);
        }
      }, 3000);
    }
    this.servers.delete(serverName);
    console.log(`🔌 MCP server ${serverName} stopped`);
  }

  /**
   * 停止所有MCP服务器
   */
  async stopAllServers() {
    const serverNames = Array.from(this.servers.keys());
    await Promise.all(serverNames.map((name) => this.stopServer(name)));
    console.log("🔌 All MCP servers stopped");
  }
}
