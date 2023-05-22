import { OpenAIApi } from 'openai';

/**
 * @description OpenAI Embedding API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIEmbeddingAPI {
  constructor(private openaiInstance: OpenAIApi) {}

  // OpenAI Create Embedding
  public createEmbedding = async () => {
    const result = await this.openaiInstance.createEmbedding({
      model: 'text-embedding-ada-002',
      input: 'The food was delicious and the waiter...'
    });
    return result;
  };
}
