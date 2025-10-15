import { MCPStdioClient } from "../src/mcp-stdio-client.js";
import { v4 as uuidv4 } from "uuid";

const mcps = [
  {
    name: "figma-server",
    command: "npx",
    args: ["@thirdstrandstudio/mcp-figma", "--figma-token", "xxx"],
    description: "Figma integration server",
  },
  {
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
  },
  {
    name: "amap-mcp-server",
    command: "uvx",
    args: ["--python-preference", "system", "amap-mcp-server"],
    description: "Amap integration server",
    options: {
      env: {
        AMAP_MAPS_API_KEY: "xxx",
      },
    },
  },
  {
    name: "duckduckgo-mcp-server",
    command: "npx",
    args: [
      "-y",
      "@smithery/cli@latest",
      "run",
      "@nickclyde/duckduckgo-mcp-server",
      "--key",
      "xxx",
    ],
    description: "DuckDuckGo search server",
  },
];

const main = async () => {
  try {
    const client = new MCPStdioClient();
    await client.initialize();

    // 启动Figma服务器
    for (const mcp of mcps) {
      await client.startServer(mcp.name, mcp.command, mcp.args, mcp.options);
      console.log("🔧 Start server:", mcp.name);
    }

    // 1. 连接和会话管理
    //    initialize - 初始化连接，建立客户端和服务端的通信
    //    ping - 心跳检测，保持连接活跃状态
    //    notifications/initialized - 通知初始化完成
    // 2. 工具相关命令
    //    tools/list - 列出所有可用的工具
    //    tools/call - 调用指定的工具执行操作
    // 3. 资源相关命令
    //     resources/list - 列出所有可用的资源
    //     resources/read - 读取指定资源的内容
    //     resources/subscribe - 订阅资源变更通知
    //     resources/unsubscribe - 取消资源订阅
    // 4. 提示相关命令
    //    prompts/list - 列出所有可用的提示模板
    //    prompts/get - 获取指定提示模板的内容
    // 5. 日志相关命令
    //    logging/setLevel - 设置日志级别
    // 6. 补全相关命令
    //    completion/complete - 获取参数或值的自动补全建议

    // 列出可用服务
    const serverName = "amap-mcp-server";
    const servers = client.getRunningServers();
    const server = servers.get(serverName);

    await client.sendMCPRequest(server, {
      jsonrpc: "2.0",
      id: uuidv4(),
      method: "tools/list",
    });

    await client.callToolsConcurrently([
      { serverName: "figma-server", toolName: "figma_get_me", args: {} },
      {
        serverName: "playwright-mcp",
        toolName: "browser_navigate",
        args: { url: "https://www.baidu.com" },
      },
      {
        serverName: "amap-mcp-server",
        toolName: "maps_geo",
        args: { address: "深圳宝安" },
      },
    ]);

    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "ping" }); // 执行命令 ping
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "notifications/initialized" }); // 初始化完成
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "tools/list" }); // 拉取工具列表
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "tools/call", params: { name: "figma_get_me", arguments: {} } }); // 调用工具
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "resources/list" }); // 拉取资源列表
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "resources/read", params: { uri: "figma://user" } }); // 读取资源
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "resources/subscribe", params: { uri: "figma://user" } }); // 订阅资源
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "resources/unsubscribe", params: { uri: "figma://user" } }); // 取消订阅资源
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "prompts/list" }); // 拉取提示列表
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "prompts/get", params: { name: "figma_get_me" } }); // 获取提示
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "logging/setLevel", params: { level: "debug" } }); // 设置日志级别
    // await client.sendMCPRequest(figmaServer, { jsonrpc: "2.0", id: uuidv4(), method: "completion/complete", params: { text: "figma_get_me" } }); // 获取补全建议
  } catch (error) {
    console.error("❌ Figma server test failed:", error.message);
    throw error;
  }
};

main();
