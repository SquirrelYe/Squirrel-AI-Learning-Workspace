import { OpenAIApi } from 'openai';

/**
 * @description OpenAI Chat API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIChatAPI {
  constructor(private openaiInstance: OpenAIApi) {}

  // OpenAI createChatCompletion 创建聊天补全
  public createChatCompletion = async () => {
    const result = await this.openaiInstance.createChatCompletion({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello!' }]
    });
    return result;
  };
}
