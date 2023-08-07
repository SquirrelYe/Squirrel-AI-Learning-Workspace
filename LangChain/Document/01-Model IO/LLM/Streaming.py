from langchain.llms import OpenAI
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.callbacks import get_openai_callback

# 使用此方法也获取不到token_usage
# with get_openai_callback() as cb:
#     llm = OpenAI(streaming=True, callbacks=[StreamingStdOutCallbackHandler()], temperature=0)
#     resp = llm("Write me a song about sparkling water.")
#     print(cb)


llm = OpenAI(streaming=True, callbacks=[StreamingStdOutCallbackHandler()], temperature=0)
# resp = llm("Write me a song about sparkling water.")

# LLMResult如果使用的话我们仍然可以访问到最后generate。但是，token_usage目前不支持流式传输。
result = llm.generate(["Write me a song about sparkling water."])
print(result.llm_output) # 此处输出的内容为：{'token_usage': {}, 'model_name': 'text-davinci-003'}，因为token_usage目前不支持流式传输。