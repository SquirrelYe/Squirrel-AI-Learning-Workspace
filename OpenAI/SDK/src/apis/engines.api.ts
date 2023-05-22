import { OpenAIApi } from 'openai';

/**
 * @description OpenAI Engine API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 * @deprecated OpenAI Engine API 模型接口，当前接口已废弃，切换为 Model API 模型接口
 */
export class OpenAIEngineAPI {
  constructor(private openaiInstance: OpenAIApi) {}

  // OpenAI List engines 列出所有引擎
  public listEngines = async () => {
    const result = await this.openaiInstance.listEngines();
    return result;
  };

  // OpenAI Retrieve engine 获取引擎
  public retrieveEngine = async () => {
    const engineId = 'engine-xxx';
    const result = await this.openaiInstance.retrieveEngine(engineId);
    return result;
  };
}
