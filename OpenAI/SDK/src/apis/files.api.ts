import { OpenAI } from 'openai';

/**
 * @description OpenAI File API 模型接口
 * @author willye
 * @time 2023.05.21 19:03:42
 */
export class OpenAIFileAPI {
  constructor(private openaiInstance: OpenAI) {}

  // OpenAI List Files 列出所有文件
  public listFiles = async () => {
    const result = await this.openaiInstance.files.list();
    return result;
  };

  // OpenAI Create File 创建文件
  public createFile = async () => {
    const file = new File(['file.txt'], 'file.txt', { type: 'text/plain' });
    const purpose = 'fine-tune';
    const result = await this.openaiInstance.files.create({
      file: file,
      purpose
    });
    return result;
  };

  // OpenAI Delete File 删除文件
  public deleteFile = async () => {
    const fileId = 'file-1';
    const result = await this.openaiInstance.files.delete(fileId);
    return result;
  };

  // OpenAI Retrieve File 获取文件
  public retrieveFile = async () => {
    const fileId = 'file-1';
    const result = await this.openaiInstance.files.retrieve(fileId);
    return result;
  };

  // OpenAI Retrieve file content 获取文件内容
  public downloadFile = async () => {
    const fileId = 'file-1';
    const result = await this.openaiInstance.files.content(fileId);
    return result;
  };
}
