import { OpenAIApi } from 'openai';

/**
 * @description OpenAI Competions API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAICompetionAPI {
  constructor(private openaiInstance: OpenAIApi) {}

  // OpenAI createCompletion 创建文本补全
  public createCompletion = async () => {
    const result = await this.openaiInstance.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Say this is a test',
      max_tokens: 7,
      temperature: 0,
      top_p: 1,
      n: 1,
      stream: false,
      logprobs: null,
      stop: '\n'
    });
    return result;
  };
}
