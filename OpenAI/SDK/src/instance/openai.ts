import { OpenAI } from 'openai';
import { OpenAIConfiguration } from '../configuration';

/**
 * @description OpenAI 实例化
 * @author willye
 * @time 2023.05.19 17:05:35
 */
const openaiInstance = new OpenAI({
  organization: OpenAIConfiguration.OPENAI_Organization_ID,
  apiKey: OpenAIConfiguration.OPENAI_API_KEY,
  baseURL: OpenAIConfiguration.OPENAI_BASE_URL
});

export { openaiInstance };
