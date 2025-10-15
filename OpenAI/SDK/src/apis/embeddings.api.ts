import { OpenAI } from 'openai';

/**
 * @description OpenAI Embedding API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIEmbeddingAPI {
  constructor(private openaiInstance: OpenAI) {}

  // OpenAI Create Embedding
  public createEmbedding = async () => {
    const result = await this.openaiInstance.embeddings.create({
      model: 'text-embedding-ada-002',
      input: 'The food was delicious and the waiter...'
    });
    return result;
  };
}
