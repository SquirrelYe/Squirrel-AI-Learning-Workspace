import { OpenAI } from 'openai';

/**
 * @description OpenAI Image API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIImageAPI {
  constructor(private openaiInstance: OpenAI) {}

  // // OpenAI Create Image 生成图片
  // public createImage = async () => {
  //   const result = await this.openaiInstance.createImage({
  //     prompt: 'A cute baby sea otter',
  //     n: 2,
  //     size: '256x256',
  //     response_format: 'b64_json'
  //   });
  //   return result;
  // };

  // // OpenAI Create image edit 生成图片编辑
  // public createImageEdit = async () => {
  //   const image = new File(['logo.png'], 'logo.png', { type: 'image/png' });
  //   const prompt = 'A cute cat with a fish';
  //   const result = await this.openaiInstance.createImageEdit(image, prompt);
  //   return result;
  // };

  // // OpenAI Create image variation 生成图片变体
  // public createImageVariation = async () => {
  //   const image = new File(['logo.png'], 'logo.png', { type: 'image/png' });
  //   const result = await this.openaiInstance.createImageVariation(image);
  //   return result;
  // };
}
