import { Configuration, OpenAIApi } from 'openai';
import { OpenAIConfiguration } from '../configuration';

/**
 * @description OpenAI 实例化
 * @author willye
 * @time 2023.05.19 17:05:35
 */
const configuration = new Configuration({
  organization: OpenAIConfiguration.OPENAI_Organization_ID,
  apiKey: OpenAIConfiguration.OPENAI_API_KEY
});

const openaiInstance = new OpenAIApi(configuration);

export { openaiInstance };
