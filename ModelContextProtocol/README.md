# MCP Client Toolkit

一个基础的 MCP (Model Context Protocol) 客户端工具，支持并发连接和调用多个 MCP 服务器。

## 🚀 特性

- ✅ **多协议支持**：支持WebSocket、Stdio、SSE和Streamable HTTP四种传输协议
- ✅ **并发连接**：同时连接多个 MCP 服务器
- ✅ **工具调用**：支持调用服务器提供的工具
- ✅ **资源访问**：访问服务器资源
- ✅ **并发执行**：批量并发调用多个工具
- ✅ **事件驱动**：基于 EventEmitter 的事件系统
- ✅ **连接管理**：自动重连和连接状态管理
- ✅ **错误处理**：完善的错误处理机制
- 🌊 **Streamable HTTP**：基于HTTP/1.1分块传输的现代化协议支持

## 📦 安装

```bash
cd mcp
npm install
```

## 🎯 快速开始

### WebSocket协议 (演示用)

```javascript
import { createMCPWebSocketClient } from './src/index.js';

// 创建WebSocket客户端
const client = await createMCPWebSocketClient();

// 连接服务器
await client.connectServer('my-server', 'ws://localhost:8080/mcp');

// 调用工具
const result = await client.callTool('my-server', 'my-tool', {
  param1: 'value1',
  param2: 'value2'
});

// 访问资源
const resource = await client.accessResource('my-server', 'file://data.json');
```

### Streamable HTTP协议 (推荐) 🌊

```javascript
import { createMCPStreamableHTTPClient } from './src/index.js';

// 创建Streamable HTTP客户端
const client = await createMCPStreamableHTTPClient({
  serverUrl: 'http://localhost:3000/mcp',
  timeout: 30000,
  retryAttempts: 3
});

// 调用工具
const result = await client.callTool('echo', {
  message: 'Hello Streamable HTTP!'
});

// 访问资源
const resources = await client.listResources();
const resourceData = await client.readResource('memory://server-info');

// 断开连接
await client.disconnect();
```

### 统一客户端 (多协议支持)

```javascript
import { createUnifiedMCPClient } from './src/index.js';

// 创建统一客户端，自动选择最佳协议
const client = await createUnifiedMCPClient();

// 支持所有协议的服务器连接
await client.connectWebSocketServer('ws-server', 'ws://localhost:8080');
await client.connectSSEServer('sse-server', 'http://localhost:8081/sse');
// Streamable HTTP通过统一客户端自动处理
```

### 并发调用

```javascript
// 并发调用多个工具
const calls = [
  {
    serverName: 'weather-server',
    toolName: 'get-weather',
    arguments: { city: 'Beijing' }
  },
  {
    serverName: 'email-server',
    toolName: 'send-email', 
    arguments: { to: 'user@example.com', subject: 'Hello' }
  }
];

const results = await client.callToolsConcurrently(calls);
```

### 事件监听

```javascript
// 监听连接事件
client.on('serverConnected', (serverName) => {
  console.log(`✅ ${serverName} connected`);
});

client.on('serverError', (serverName, error) => {
  console.error(`❌ ${serverName} error:`, error.message);
});

client.on('notification', (serverName, message) => {
  console.log(`📢 Notification from ${serverName}:`, message);
});
```

## 🏗️ 架构设计

### 核心组件

```
MCPClient
├── 连接管理 (ConnectionManager)
├── 请求路由 (RequestRouter)  
├── 并发控制 (ConcurrencyController)
├── 事件系统 (EventEmitter)
└── 错误处理 (ErrorHandler)
```

### 连接模型

```
单一 MCP Client
├── 连接1: Server A (WebSocket)
├── 连接2: Server B (WebSocket)
└── 连接3: Server C (WebSocket)
```

## 📚 API 文档

### MCPClient

#### 构造函数
```javascript
const client = new MCPClient();
```

#### 方法

##### `initialize()`
初始化客户端
```javascript
await client.initialize();
```

##### `connectServer(serverName, endpoint, options)`
连接到 MCP 服务器
- `serverName`: 服务器名称
- `endpoint`: WebSocket 端点
- `options`: 连接选项

##### `callTool(serverName, toolName, arguments)`
调用工具
- `serverName`: 服务器名称
- `toolName`: 工具名称
- `arguments`: 工具参数

##### `callToolsConcurrently(calls)`
并发调用多个工具
- `calls`: 调用配置数组

##### `accessResource(serverName, uri)`
访问资源
- `serverName`: 服务器名称
- `uri`: 资源 URI

##### `getConnectedServers()`
获取已连接服务器信息

##### `disconnectServer(serverName)`
断开指定服务器连接

##### `disconnectAll()`
断开所有连接

### 事件

- `initialized`: 客户端初始化完成
- `serverConnected`: 服务器连接成功
- `serverDisconnected`: 服务器断开连接
- `serverError`: 服务器错误
- `notification`: 收到服务器通知

## 🧪 测试

```bash
npm test
```

## 📖 示例

```bash
npm run example
```

## 🔧 配置

### 连接配置示例

```javascript
const serverConfig = {
  name: 'my-server',
  endpoint: 'ws://localhost:8080/mcp',
  options: {
    headers: {
      'Authorization': 'Bearer token'
    },
    timeout: 30000
  }
};
```

## 🚨 错误处理

客户端提供完善的错误处理：

```javascript
try {
  const result = await client.callTool('server', 'tool', {});
} catch (error) {
  if (error.message.includes('not connected')) {
    // 处理连接错误
  } else if (error.message.includes('timeout')) {
    // 处理超时错误
  } else {
    // 处理其他错误
  }
}
```

## 🔄 并发控制

支持多种并发模式：

1. **并行调用**：同时调用多个不同服务器的工具
2. **批量处理**：批量处理多个请求
3. **负载均衡**：在多个服务器间分配请求

## 📈 性能优化

- WebSocket 连接复用
- 请求去重和缓存
- 自动重连机制
- 连接池管理

## 🛠️ 开发

### 项目结构

```
mcp/
├── src/
│   ├── mcp-ws-client.js    # 核心客户端实现
│   └── index.js         # 主入口文件
├── examples/
│   └── basic-usage.js   # 使用示例
├── tests/
│   └── test.js          # 测试套件
├── package.json
└── README.md
```

### 扩展功能

可以通过继承 `MCPClient` 类来扩展功能：

```javascript
class CustomMCPClient extends MCPClient {
  async customMethod() {
    // 自定义功能
  }
}
```

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📞 支持

如有问题，请创建 Issue 或联系维护者。