import { OpenAI } from 'openai';

/**
 * @description OpenAI FineTune API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIFineTuneAPI {
  constructor(private openaiInstance: OpenAI) {}

  // // OpenAI Create FineTune 创建微调
  // public createFineTune = async () => {
  //   const result = await this.openaiInstance.createFineTune({
  //     training_file: 'file-xxx'
  //   });
  //   return result;
  // };

  // // OpenAI List FineTunes 列出所有微调
  // public listFineTunes = async () => {
  //   const result = await this.openaiInstance.listFineTunes();
  //   return result;
  // };

  // // OpenAI Retrieve FineTune 获取微调
  // public retrieveFineTune = async () => {
  //   const fineTuneId = 'fine-tune-xxx';
  //   const result = await this.openaiInstance.retrieveFineTune(fineTuneId);
  //   return result;
  // };

  // // OpenAI Cancel FineTune 取消微调
  // public cancelFineTune = async () => {
  //   const fineTuneId = 'fine-tune-xxx';
  //   const result = await this.openaiInstance.cancelFineTune(fineTuneId);
  //   return result;
  // };

  // // OpenAI List FineTunes Events 列出微调事件
  // public listFineTuneEvents = async () => {
  //   const fineTuneId = 'fine-tune-xxx';
  //   const result = await this.openaiInstance.listFineTuneEvents(fineTuneId);
  //   return result;
  // };

  // // OpenAI Delete FineTune Model 删除微调模型
  // public deleteFineTuneModel = async () => {
  //   const fineTuneId = 'fine-tune-xxx';
  //   const result = await this.openaiInstance.deleteModel(fineTuneId);
  //   return result;
  // };
}
