import { openaiInstance } from './instance/openai';

import { OpenAIModelAPI } from './apis/models.api';
import { OpenAICompetionAPI } from './apis/completions.api';
import { OpenAIChatAPI } from './apis/chat.api';
import { OpenAIImageAPI } from './apis/images.api';
import { OpenAIEmbeddingAPI } from './apis/embeddings.api';
import { OpenAIAudioAPI } from './apis/audio.api';
import { OpenAIFileAPI } from './apis/files.api';
import { OpenAIFineTuneAPI } from './apis/finetunes.api';
import { OpenAIModerationAPI } from './apis/moderations.api';

import { OpenAIFunctionCall } from './toolcalls/function_call';
import { OpenAIPromptToolCall } from './toolcalls/prompt_call';

const openAIModelAPI = new OpenAIModelAPI(openaiInstance);
const openAICompetionAPI = new OpenAICompetionAPI(openaiInstance);
const openAIChatAPI = new OpenAIChatAPI(openaiInstance);
const openAIImageAPI = new OpenAIImageAPI(openaiInstance);
const openAIEmbeddingAPI = new OpenAIEmbeddingAPI(openaiInstance);
const openAIAudioAPI = new OpenAIAudioAPI(openaiInstance);
const openAIFileAPI = new OpenAIFileAPI(openaiInstance);
const openAIFineTuneAPI = new OpenAIFineTuneAPI(openaiInstance);
const openAIModerationAPI = new OpenAIModerationAPI(openaiInstance);

const openAIOpenAIFunctionCall = new OpenAIFunctionCall(openaiInstance);
const openAIPromptToolCall = new OpenAIPromptToolCall(openaiInstance);

/**
 * @description OpenAI Main 入口文件
 * @author willye
 * @time 2023.05.19 17:14:02
 */
const main = async () => {
  // const listModels = await openAIModelAPI.listModels();
  // console.log(listModels.data.map(item => item.id));
  // const retrieveModel = await openAIModelAPI.retrieveModel('gpt-3.5-turbo-0301');
  // console.log(retrieveModel);

  // const createCompletion = await openAICompetionAPI.createCompletion();
  // console.log(JSON.stringify(createCompletion, null, 4));

  // const createChatCompletion = await openAIChatAPI.createChatCompletion();
  // console.log(JSON.stringify(createChatCompletion.data, null, 4));

  // const createEdit = await openAIEditAPI.createEdit();
  // console.log(JSON.stringify(createEdit.data, null, 4));

  // const createImage = await openAIImageAPI.createImage();
  // console.log(JSON.stringify(createImage.data, null, 4));
  // const createImageEdit = await openAIImageAPI.createImageEdit();
  // console.log(JSON.stringify(createImageEdit.data, null, 4));
  // const createImageVariation = await openAIImageAPI.createImageVariation();
  // console.log(JSON.stringify(createImageVariation.data, null, 4));

  // const createEmbedding = await openAIEmbeddingAPI.createEmbedding();
  // console.log(JSON.stringify(createEmbedding.data, null, 4));

  // const createTranscription = await openAIAudioAPI.createTranscription();
  // console.log(JSON.stringify(createTranscription.data, null, 4));
  // const createTranslation = await openAIAudioAPI.createTranslation();
  // console.log(JSON.stringify(createTranslation.data, null, 4));

  // const listFiles = await openAIFileAPI.listFiles();
  // console.log(JSON.stringify(listFiles.data, null, 4));
  // const createFile = await openAIFileAPI.createFile();
  // console.log(JSON.stringify(createFile.data, null, 4));
  // const retrieveFile = await openAIFileAPI.retrieveFile();
  // console.log(JSON.stringify(retrieveFile.data, null, 4));
  // const deleteFile = await openAIFileAPI.deleteFile();
  // console.log(JSON.stringify(deleteFile.data, null, 4));
  // const downloadFile = await openAIFileAPI.downloadFile();
  // console.log(JSON.stringify(downloadFile.data, null, 4));

  // const createFineTune = await openAIFineTuneAPI.createFineTune();
  // console.log(JSON.stringify(createFineTune.data, null, 4));
  // const listFineTunes = await openAIFineTuneAPI.listFineTunes();
  // console.log(JSON.stringify(listFineTunes.data, null, 4));
  // const retrieveFineTune = await openAIFineTuneAPI.retrieveFineTune();
  // console.log(JSON.stringify(retrieveFineTune.data, null, 4));
  // const cancelFineTune = await openAIFineTuneAPI.cancelFineTune();
  // console.log(JSON.stringify(cancelFineTune.data, null, 4));
  // const listFineTuneEvents = await openAIFineTuneAPI.listFineTuneEvents();
  // console.log(JSON.stringify(listFineTuneEvents.data, null, 4));
  // const deleteFineTuneModel = await openAIFineTuneAPI.deleteFineTuneModel();
  // console.log(JSON.stringify(deleteFineTuneModel.data, null, 4));

  // const createModeration = await openAIModerationAPI.createModeration();
  // console.log(JSON.stringify(createModeration.data, null, 4));

  // const listEngines = await openAIEngineAPI.listEngines();
  // console.log(JSON.stringify(listEngines.data, null, 4));
  // const retrieveEngine = await openAIEngineAPI.retrieveEngine();
  // console.log(JSON.stringify(retrieveEngine.data, null, 4));

  // await openAIOpenAIFunctionCall.createFunctionCallCompletion('介绍一下你自己，获取一下今天的日期和时间，并给我北京今天的天气，使用华氏度给我。');
  await openAIPromptToolCall.createPromptToolCompletion('介绍一下你自己，获取一下今天的日期和时间，并给我北京今天的天气，使用华氏度给我。');
};

main();
