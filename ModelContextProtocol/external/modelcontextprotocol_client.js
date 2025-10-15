import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { WebSocketClientTransport } from "@modelcontextprotocol/sdk/client/webSocket.js";

// 创建一个基于 stdio 的 MCP 客户端
async function createStdioMcpClient(config) {
  const { name, command, args, options } = config;
  const transport = new StdioClientTransport({
    command: command,
    args: args || [],
    env: { ...process.env, ...options.env },
  });
  const client = new Client(
    { name: name || "mcp-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  client.onerror = (err) =>
    console.error(`[MCP:${name || "server"}] error:`, err);
  await client.connect(transport);
  const close = async () => {
    try { await client.close(); } catch {} // prettier-ignore
    try { await transport.close(); } catch {} // prettier-ignore
  };
  return { client, transport, close };
}

// 创建一个基于 SSE 的 MCP 客户端
async function createSseMcpClient(config) {
  const { name, url } = config;
  const transport = new SSEClientTransport(new URL(url));
  const client = new Client(
    { name: name || "mcp-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  client.onerror = (err) =>
    console.error(`[MCP:${name || "server"}] error:`, err);
  await client.connect(transport);
  const close = async () => {
    try { await client.close(); } catch {} // prettier-ignore
    try { await transport.close(); } catch {} // prettier-ignore
  };
  return { client, transport, close };
}

// 创建一个基于 StreamableHTTP 的 MCP 客户端
async function createStreamableHttpMcpClient(config) {
  const { name, url } = config;
  const transport = new StreamableHTTPClientTransport(url);
  const client = new Client(
    { name: name || "mcp-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  client.onerror = (err) =>
    console.error(`[MCP:${name || "server"}] error:`, err);
  await client.connect(transport);
  const close = async () => {
    try { await client.close(); } catch {} // prettier-ignore
    try { await transport.close(); } catch {} // prettier-ignore
  };
  return { client, transport, close };
}

// 创建一个基于 WebSocket 的 MCP 客户端
async function createWebSocketMcpClient(config) {
  const { name, url } = config;
  const transport = new WebSocketClientTransport(new URL(url));
  const client = new Client(
    { name: name || "mcp-client", version: "1.0.0" },
    { capabilities: { tools: {} } }
  );
  client.onerror = (err) =>
    console.error(`[MCP:${name || "server"}] error:`, err);
  await client.connect(transport);
  const close = async () => {
    try { await client.close(); } catch {} // prettier-ignore
    try { await transport.close(); } catch {} // prettier-ignore
  };
  return { client, transport, close };
}

// ########################################################################

// 测试Stdio MCP客户端
async function testStdioMcpClient() {
  const amap = {
    name: "amap-mcp-server",
    command: "uvx",
    args: ["--python-preference", "system", "amap-mcp-server"],
    description: "Amap integration server",
    options: {
      env: {
        AMAP_MAPS_API_KEY: "xxx",
      },
    },
  };
  const playwright = {
    name: "playwright-mcp",
    command: "npx",
    args: [
      "-y",
      "@smithery/cli@latest",
      "run",
      "@microsoft/playwright-mcp",
      "--key",
      "xxx",
    ],
    description: "Playwright automation server",
    options: { env: {} },
  };
  const { client, transport, close } = await createStdioMcpClient(amap);

  client.onerror = (err) => {
    console.error("client error:", err);
    process.exitCode = 1;
  };

  try {
    // const res = await client.callTool({ name: "browser_navigate", arguments: { url: "https://www.baidu.com" } });
    // console.log("invoke result:", JSON.stringify(res, null, 2));

    const res = await client.callTool({
      name: "maps_geo",
      arguments: { address: "深圳宝安" },
    });
    console.log("invoke result:", JSON.stringify(res, null, 2));

    const tools = await client.listTools();
    console.log("tools:", JSON.stringify(tools, null, 2));
  } catch (e) {
    console.error("invoke error:", e);
    process.exitCode = 1;
  } finally {
    // await close();
  }
}

// 测试SSE MCP客户端
async function testSseMcpClient() {
  const { client, transport, close } = await createSseMcpClient({
    name: "amap-mcp-server",
    url: "http://127.0.0.1.:8000/sse",
    description: "Amap integration server",
  });

  transport.onmessage = (event) => {
    console.log("sse message:", event);
  };

  client.onerror = (err) => {
    console.error("client error:", err);
    process.exitCode = 1;
  };

  console.log("client:", client);
  console.log("transport:", transport);

  try {
    const res = await client.callTool({
      name: "maps_geo",
      arguments: { address: "深圳宝安" },
    });
    console.log("invoke result:", JSON.stringify(res, null, 2));

    const tools = await client.listTools();
    console.log("tools:", JSON.stringify(tools, null, 2));
  } catch (e) {
    console.error("invoke error:", e);
    process.exitCode = 1;
  } finally {
    // await close();
  }
}

// 测试StreamableHTTP MCP客户端
async function testStreamableHttpMcpClient() {
  const { client, transport, close } = await createStreamableHttpMcpClient({
    name: "amap-mcp-server",
    url: "http://0.0.0.0:8000/mcp",
    description: "Amap integration server",
  });

  client.onerror = (err) => {
    console.error("client error:", err);
    process.exitCode = 1;
  };

  try {
    const res = await client.callTool({
      name: "maps_geo",
      arguments: { address: "深圳宝安" },
    });
    console.log("invoke result:", JSON.stringify(res, null, 2));

    const tools = await client.listTools();
    console.log("tools:", JSON.stringify(tools, null, 2));
  } catch (e) {
    console.error("invoke error:", e);
    process.exitCode = 1;
  } finally {
    // await close();
  }
}

// 测试WebSocket MCP客户端
async function testWebSocketMcpClient() {
  const { client, transport, close } = await createWebSocketMcpClient({
    name: "amap-mcp-server",
    url: "ws://0.0.0.0:8000/ws",
    description: "Amap integration server",
  });

  client.onerror = (err) => {
    console.error("client error:", err);
    process.exitCode = 1;
  };

  try {
    const res = await client.callTool({
      name: "maps_geo",
      arguments: { address: "深圳宝安" },
    });
    console.log("invoke result:", JSON.stringify(res, null, 2));

    const tools = await client.listTools();
    console.log("tools:", JSON.stringify(tools, null, 2));
  } catch (e) {
    console.error("invoke error:", e);
    process.exitCode = 1;
  } finally {
    // await close();
  }
}

// ########################################################################

// 测试入口
if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    // await testStdioMcpClient();
    // await testSseMcpClient();
    // await testStreamableHttpMcpClient();
    // await testWebSocketMcpClient(); // 暂时用不了，内部存在问题
  })();
}
