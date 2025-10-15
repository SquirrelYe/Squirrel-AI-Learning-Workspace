import { OpenAI } from 'openai';

/**
 * @description OpenAI Audio API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIAudioAPI {
  constructor(private openaiInstance: OpenAI) {}

  // // OpenAI Create transcription 创建音频转录
  // public createTranscription = async () => {
  //   const audio = new File(['audio.mp3'], 'audio.mp3', { type: 'audio/mp3' });
  //   const prompt = 'whisper-1';
  //   const result = await this.openaiInstance.createTranscription(audio, prompt);
  //   return result;
  // };

  // // OpenAI Create translation 创建音频翻译
  // public createTranslation = async () => {
  //   const audio = new File(['audio.mp3'], 'audio.mp3', { type: 'audio/mp3' });
  //   const targetLanguage = 'zh';
  //   const result = await this.openaiInstance.createTranslation(audio, targetLanguage);
  //   return result;
  // };
}
