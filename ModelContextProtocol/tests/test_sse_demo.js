import { EventSource } from "eventsource";
import { EventEmitter } from "events";
import axios from "axios";

class MCPSSEClientWithEventSource extends EventEmitter {
  constructor(baseUrl) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.sseEventSource = null;
    this.currentEndpoint = null;
  }

  async connect() {
    return new Promise((resolve, reject) => {
      const sseUrl = `${this.baseUrl}/sse`;
      this.sseEventSource = new EventSource(sseUrl);
      this.sseEventSource.onopen = () => {
        console.log("SSE connection opened");
        resolve();
      };

      this.sseEventSource.onerror = (error) => {
        console.error("SSE connection error:", error);
        if (this.sseEventSource.readyState === EventSource.CLOSED) {
          this.emit("sseDisconnected");
        } else {
          this.emit("error", error);
          reject(error);
        }
      };

      // 监听endpoint事件
      this.sseEventSource.addEventListener("endpoint", (event) => {
        console.log(`Received endpoint: ${event.data}`);
        const endpointUrl = event.data.startsWith("http") ? event.data : `${this.baseUrl}${event.data}`;
        this.currentEndpoint = endpointUrl;
        this.emit("endpointReceived", event.data);
      });

      // 监听所有其他事件
      this.sseEventSource.onmessage = (event) => {
        console.log(`Received message: ${event.data}`);
        this.emit("sseMessage", event.data);
      };
    });
  }

  // 发送消息到endpoint
  async sendMessage(message) {
    if (!this.currentEndpoint) {
      throw new Error("No endpoint available");
    }
    console.log(`Sending message to endpoint: ${this.currentEndpoint}`, message);
    return new Promise((resolve, reject) => {
      axios
        .post(this.currentEndpoint, message, {
          headers: "Content-Type: application/json",
        })
        .then((response) => {
          resolve(response);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  closeSseConnection() {
    if (this.sseEventSource) {
      this.sseEventSource.close();
      this.sseEventSource = null;
      console.log("SSE connection closed");
    }
  }

  close() {
    this.closeSseConnection();
    this.closeEndpointConnection();
  }
}

async function main() {
  const client = new MCPSSEClientWithEventSource("http://0.0.0.0:8000");

  // 监听事件
  client.on("endpointReceived", (endpoint) => {
    console.log(`切换到新的端点: ${endpoint}`);

    // 连接成功后可以发送消息
    client
      .sendMessage({
        jsonrpc: "2.0",
        id: "e6fdb296-a794-49ae-b2d1-0400e85c8d63",
        method: "tools/call",
        params: { name: "maps_geo", arguments: { address: "深圳宝安" } },
      })
      .then((response) => console.log("Message sent:", response))
      .catch((error) => console.error("Send message error:", error));
  });

  client.on("sseEvent", ({ event, data }) => {
    console.log(`SSE事件: ${event}, 数据: ${data}`);
  });

  client.on("error", (error) => {
    console.error("客户端错误:", error);
  });

  try {
    await client.connect();
    console.log("客户端已连接");
  } catch (error) {
    console.error("连接失败:", error);
  }

  // 程序退出时清理连接
  process.on("SIGINT", () => {
    console.log("关闭连接...");
    client.close();
    process.exit(0);
  });
}

main().catch(console.error);
