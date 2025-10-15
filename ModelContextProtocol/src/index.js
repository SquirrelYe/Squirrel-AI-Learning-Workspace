import { MCPWebSocketClient } from "./mcp-ws-client.js";
import { MCPStdioClient } from "./mcp-stdio-client.js";
import { MCPSSEClient } from "./mcp-sse-client.js";
import { MCPStreamableHTTPClient } from "./mcp-streamable-http-client.js";
import { MCPUnifiedClient } from "./mcp-unified-client.js";

// 导出主要类
export { MCPWebSocketClient } from "./mcp-ws-client.js";
export { MCPStdioClient } from "./mcp-stdio-client.js";
export { MCPSSEClient } from "./mcp-sse-client.js";
export { MCPStreamableHTTPClient } from "./mcp-streamable-http-client.js";
export { MCPUnifiedClient } from "./mcp-unified-client.js";

// 创建默认客户端实例
export const defaultMCPWebSocketClient = new MCPWebSocketClient();
export const defaultMCPStdioClient = new MCPStdioClient();
export const defaultMCPSSEClient = new MCPSSEClient();
export const defaultMCPStreamableHTTPClient = new MCPStreamableHTTPClient();
export const defaultMCPUnifiedClient = new MCPUnifiedClient();

// 兼容性别名
export const defaultWebSocketClient = defaultMCPWebSocketClient;
export const defaultStdioClient = defaultMCPStdioClient;
export const defaultSSEClient = defaultMCPSSEClient;
export const defaultStreamableHTTPClient = defaultMCPStreamableHTTPClient;
export const defaultUnifiedClient = defaultMCPUnifiedClient;

/**
 * 便捷函数：快速创建并初始化WebSocket客户端
 */
export async function createMCPWebSocketClient() {
  const client = new MCPWebSocketClient();
  await client.initialize();
  return client;
}

/**
 * 便捷函数：快速创建并初始化WebSocket客户端（兼容性别名）
 */
export async function createMCPClient() {
  return await createMCPWebSocketClient();
}

/**
 * 便捷函数：创建Stdio MCP客户端
 */
export async function createMCPStdioClient() {
  const client = new MCPStdioClient();
  await client.initialize();
  return client;
}

/**
 * 便捷函数：创建SSE MCP客户端
 */
export async function createMCPSSEClient() {
  const client = new MCPSSEClient();
  await client.initialize();
  return client;
}

/**
 * 便捷函数：创建Streamable HTTP MCP客户端
 */
export async function createMCPStreamableHTTPClient(options = {}) {
  const client = new MCPStreamableHTTPClient(options);
  await client.initialize();
  return client;
}

/**
 * 便捷函数：创建统一MCP客户端
 */
export async function createUnifiedMCPClient() {
  const client = new MCPUnifiedClient();
  await client.initialize();
  return client;
}

/**
 * 便捷函数：连接多个WebSocket服务器
 * @param {Array} servers - 服务器配置数组
 */
export async function connectMultipleWebSocketServers(servers) {
  const client = await createMCPWebSocketClient();

  const connections = await Promise.allSettled(servers.map((server) => client.connectServer(server.name, server.endpoint, server.options)));

  const successful = connections.filter((result) => result.status === "fulfilled");
  const failed = connections.filter((result) => result.status === "rejected");

  console.log(`✅ Connected to ${successful.length} WebSocket servers`);
  if (failed.length > 0) {
    console.warn(`⚠️  Failed to connect to ${failed.length} WebSocket servers`);
  }

  return client;
}

/**
 * 便捷函数：连接多个服务器（兼容性别名）
 */
export async function connectMultipleServers(servers) {
  return await connectMultipleWebSocketServers(servers);
}

// 如果直接运行此文件，显示帮助信息
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`
🤖 MCP Client Toolkit v1.0.0

Usage:
  npm start              - Start interactive mode
  npm run example        - Run basic usage example
  npm test              - Run tests

Features:
  ✅ Concurrent connections to multiple MCP servers
  ✅ Tool calling with error handling
  ✅ Resource access
  ✅ Event-driven architecture
  ✅ Connection management
  ✅ Batch operations

Example:
  import { createMCPWebSocketClient } from './src/index.js';
  
  const client = await createMCPWebSocketClient();
  await client.connectServer('my-server', 'ws://localhost:8080');
  const result = await client.callTool('my-server', 'my-tool', {param: 'value'});
  `);
}
