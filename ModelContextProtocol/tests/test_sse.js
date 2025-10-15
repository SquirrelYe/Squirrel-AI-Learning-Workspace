import { MCPSSEClient } from "../src/mcp-sse-client.js";
import { v4 as uuidv4 } from "uuid";

const main = async () => {
  try {
    const client = new MCPSSEClient();
    await client.initialize();

    const serverName = "amap-mcp-server";
    const endpoint = "http://0.0.0.0:8000/sse";

    const connection = await client.connectServer(serverName, endpoint);
    console.log("🔧 Start server:", serverName);

    // 设置连接状态为已连接（因为connectServer方法没有完全设置）
    connection.status = "connected";
    client.connections.set(serverName, connection);

    // 列出可用服务
    await client.sendMCPRequest(connection, { jsonrpc: "2.0", id: uuidv4(), method: "tools/list" });
  } catch (error) {
    console.error("❌ Figma server test failed:", error.message);
    throw error;
  }
};

main();
