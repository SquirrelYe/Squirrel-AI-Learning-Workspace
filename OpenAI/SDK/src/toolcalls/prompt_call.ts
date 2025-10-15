import { OpenAI } from 'openai';
import { XMLParser } from 'fast-xml-parser';
import { logger } from '../util/logger';
import { Tools } from '../tools/tool';

const xmlParser = new XMLParser();
const sysPrompt = `
你可以调用如下工具：
<get_weather>
  <location>城市名称，如北京、上海</location>
  <unit>温度单位，celsius或fahrenheit</unit>
</get_weather>
<get_datetime>
  <format>日期时间格式，如yyyy-MM-dd HH:mm:ss，可选</format>
</get_datetime>
请根据用户问题，判断是否需要工具调用，并以如下 XML 格式回复：
如果需要工具调用，回复：
<tool_group>
  <tool_call>
    <tool_name>工具名</tool_name>
    <parameters>参数内容</parameters>
  </tool_call>
  ...可有多个tool_call...
</tool_group>
<tool_result>
  <result>工具返回结果</result>
</tool_result>
如果不需要工具，直接用中文回复内容。
如果你判断全部的tool的结果都已经存在了，则直接返回用户需要的结果。
`;

/**
 * @description 通过 prompt 方式实现工具调用（非 function call）
 * @author 风继续吹<will>
 * @time 2025.09.09
 */
export class OpenAIPromptToolCall {
  constructor(private openaiInstance: OpenAI) {}

  public model = 'deepseek/deepseek-chat-v3-0324'; // 'deepseek/deepseek-chat-v3-0324' | 'anthropic/claude-sonnet-4'
  public messages: Array<any> = [{ role: 'system', content: sysPrompt }];

  // 核心执行逻辑
  public promptToolCall = async () => {
    logger.info(`[QuestionStart] -> ${JSON.stringify(this.messages)}`);

    // 构建输入列表
    const response = await this.openaiInstance.chat.completions.create({
      model: this.model,
      messages: this.messages
      // tools: this.tools,
      // tool_choice: 'auto'
    });

    const choice = response.choices[0];
    const finish_reason = choice['finish_reason'];
    const usage = response.usage;
    const reply = choice?.message?.content || '';

    logger.info('[Usage] ->', usage, finish_reason);

    // #####################################################################################
    // ############################### 处理XML，调用对应的Tools ###############################
    // #####################################################################################
    if (reply.includes('<tool_group>')) {
      let parsed: any;
      try {
        parsed = xmlParser.parse(reply);
      } catch (e) {
        logger.error('XML解析失败', e);
        return reply;
      }
      logger.info(`[ToolParsed] -> ${JSON.stringify(parsed)}`);

      let toolCalls = [];
      if (parsed.tool_group) {
        if (Array.isArray(parsed.tool_group.tool_call)) {
          toolCalls = parsed.tool_group.tool_call;
        } else if (parsed.tool_group.tool_call) {
          toolCalls = [parsed.tool_group.tool_call];
        }
      }
      logger.info(`[ToolCall] -> ${JSON.stringify(toolCalls)}`);

      const results: any[] = [];
      for (const call of toolCalls) {
        const name = call.tool_name;
        const params = call.parameters;
        let paramObj: any = {};
        if (typeof params === 'string') {
          try {
            paramObj = xmlParser.parse(params);
          } catch {
            paramObj = params;
          }
        } else {
          paramObj = params;
        }

        switch (name) {
          case 'get_weather': {
            const location = paramObj.location || '';
            const unit = paramObj.unit || 'celsius';
            results.push({ tool_name: name, result: Tools.getWeather(location, unit) });
            break;
          }
          case 'get_datetime': {
            const format = paramObj.format;
            results.push({ tool_name: name, result: Tools.getDatetime(format) });
            break;
          }
          default: {
            results.push({ tool_name: name, result: '未知工具' });
            break;
          }
        }
      }

      const toolResultMessage = {
        role: 'assistant',
        content: `<tool_result><result>${JSON.stringify(results)}</result></tool_result>`
      };
      this.messages.push(toolResultMessage);

      // 再次调用模型，获取最终回复
      this.promptToolCall();
    }

    // #######################################################################
    // ############################### 输出结果 ###############################
    // #######################################################################
    else {
      logger.info(`[QuestionEnd] -> ${JSON.stringify(response)}`);
    }
  };

  // OpenAI createCompletion 创建文本补全
  public createPromptToolCompletion = async (question: string) => {
    logger.warn('############################################################');
    const message = { role: 'user', content: question };
    this.messages.push(message);
    await this.promptToolCall();
  };
}
