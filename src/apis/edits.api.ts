import { OpenAIApi } from 'openai';

/**
 * @description OpenAI Edit API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIEditAPI {
  constructor(private openaiInstance: OpenAIApi) {}

  // OpenAI createEdit 创建编辑
  public createEdit = async () => {
    const result = await this.openaiInstance.createEdit({
      model: 'text-davinci-edit-001',
      input: 'What day of the wek is it?',
      instruction: 'Fix the spelling mistakes'
    });
    return result;
  };
}
