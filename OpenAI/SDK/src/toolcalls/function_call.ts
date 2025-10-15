import { OpenAI } from 'openai';
import { logger } from '../util/logger';
import { Tools } from '../tools/tool';

/**
 * @description OpenAI Function Call 案例
 * @author 风继续吹<will>
 * @time 2025.09.15:28:20
 */
export class OpenAIFunctionCall {
  constructor(private openaiInstance: OpenAI) {}

  public model = 'deepseek/deepseek-chat-v3-0324'; // 'deepseek/deepseek-chat-v3-0324' | 'anthropic/claude-sonnet-4'
  public messages: Array<any> = [];
  public tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
      type: 'function',
      function: {
        name: 'get_weather',
        description: "Get today's weather for a city.",
        parameters: {
          type: 'object',
          properties: {
            location: {
              type: 'string',
              description: '城市名称，例如 北京、上海'
            },
            unit: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: '温度单位'
            }
          },
          required: ['location'],
          additionalProperties: false
        }
      }
    },
    {
      type: 'function',
      function: {
        name: 'get_datetime',
        description: '获取当前日期和时间信息',
        parameters: {
          type: 'object',
          properties: {
            format: {
              type: 'string',
              description: '日期时间格式，例如 yyyy-MM-dd HH:mm:ss，可选'
            }
          },
          required: [],
          additionalProperties: false
        }
      }
    }
  ];

  // 核心执行逻辑
  public functionCallCompletion = async () => {
    logger.info(`[QuestionStart] -> ${JSON.stringify(this.messages)}`);

    // 构建输入列表
    const response = await this.openaiInstance.chat.completions.create({
      model: this.model,
      messages: this.messages,
      tools: this.tools,
      tool_choice: 'auto'
    });

    // "stop"	- 模型遇到 自然停止符（stop sequence）或生成完成	模型生成到结尾，或遇到你设置的 stop 参数
    // "length"	- 达到 最大 token 限制（max_tokens）而被截断	生成内容过长被截断
    // "content_filter"	- 生成内容被 内容过滤器 截断	模型生成了可能违反安全策略的内容
    // "function_call"	- 模型决定调用一个函数（Function Calling 模式）	返回 function_call 字段，等待你执行函数
    // "tool_calls"	- 模型决定调用一个或多个工具（Tool Calling 模式）	类似 function_call，但支持多工具调用（新版本）
    // null	- 生成尚未完成（流式输出时可能出现）	streaming 模式中，中途的增量消息

    const choice = response.choices[0];
    const usage = response.usage;
    const finish_reason = choice['finish_reason'];

    logger.info('[Usage] ->', usage, finish_reason);

    // ##############################################################################################
    // ############################### 处理 function_call | tool_calls ###############################
    // ##############################################################################################
    if (finish_reason === 'tool_calls' || finish_reason === 'function_call') {
      // 将调用放到消息上下文
      this.messages.push(response.choices[0]['message']);

      // 执行tools
      const toolCalls: Array<any> = response.choices[0]?.message?.tool_calls;
      logger.info(`[ToolCall] -> ${JSON.stringify(toolCalls)}`);

      if (toolCalls && toolCalls.length > 0) {
        for (const call of toolCalls) {
          const name = call.function.name;
          const args = call.function.arguments ? JSON.parse(call.function.arguments) : '';
          logger.info(`[ToolCallStart] -> ${name}, ${JSON.stringify(args)}`);

          let result: any = null;

          switch (name) {
            case 'get_weather': {
              const weather = Tools.getWeather(args.location, args.unit);
              result = { weather };
              break;
            }
            case 'get_datetime': {
              const datetime = Tools.getDatetime(args.format);
              result = { datetime };
              break;
            }
            default:
              break;
          }

          this.messages.push({
            role: 'tool',
            tool_call_id: call.id,
            content: JSON.stringify(result)
          });

          logger.info(`[ToolCallEnd] -> ${name}, ${JSON.stringify(result)}`);
        }
      }

      // 再次调用模型，获取最终回复
      this.functionCallCompletion();
    }

    // #######################################################################
    // ############################### 输出结果 ###############################
    // #######################################################################
    else {
      logger.info(`[QuestionEnd] -> ${JSON.stringify(response)}`);
    }
  };

  // OpenAI createCompletion 创建文本补全
  public createFunctionCallCompletion = async (question: string) => {
    logger.warn('############################################################');
    const message = { role: 'user', content: question };
    this.messages.push(message);
    await this.functionCallCompletion();
  };
}
