# 设置环境
from langchain import OpenAI, LLMChain
from langchain.agents import AgentExecutor, LLMSingleActionAgent
from langchain.callbacks import (get_openai_callback)

# 导入自定义模块
import tool_retriever
import prompt_template
import output_parser

llmInstance = OpenAI(temperature=0, verbose=True)
customPromptInstance = prompt_template.CustomPromptInstance
customOutputParserInstance = output_parser.CustomOutputParserInstance
customTools = tool_retriever.get_tools("whats the weather?")

# LLM链由LLM和prompt组成
llmChainInstance = LLMChain(llm=llmInstance, prompt=customPromptInstance)

# 获取工具
toolNames = [tool.name for tool in customTools]
print(customTools, toolNames)

# tools -> [
#     Tool(name='Search', description='useful for when you need to answer questions about current events', args_schema=None, return_direct=False, verbose=False, callbacks=None, callback_manager=None, func=<bound method SerpAPIWrapper.run of SerpAPIWrapper(search_engine=<class 'serpapi.google_search.GoogleSearch'>, params={'engine': 'google', 'google_domain': 'google.com', 'gl': 'us', 'hl': 'en'}, serpapi_api_key='xxxx', aiosession=None)>, coroutine=None),
#     Tool(name='foo-95', description='a silly function that you can use to get more information about the number 95', args_schema=None, return_direct=False, verbose=False, callbacks=None, callback_manager=None, func=<function fake_func at 0x126c142c0>, coroutine=None),
#     Tool(name='foo-12', description='a silly function that you can use to get more information about the number 12', args_schema=None, return_direct=False, verbose=False, callbacks=None, callback_manager=None, func=<function fake_func at 0x126c142c0>, coroutine=None),
#     Tool(name='foo-15', description='a silly function that you can use to get more information about the number 15', args_schema=None, return_direct=False, verbose=False, callbacks=None, callback_manager=None, func=<function fake_func at 0x126c142c0>, coroutine=None)
# ]
# tool names -> ['Search', 'foo-95', 'foo-12', 'foo-85']

# 生成代理
agent = LLMSingleActionAgent(llm_chain=llmChainInstance, output_parser=customOutputParserInstance, stop=["\nObservation:"], allowed_tools=toolNames)

# 执行代理
with get_openai_callback() as cb:
    agent_executor = AgentExecutor.from_agent_and_tools(agent=agent, tools=customTools, verbose=True)
    agent_executor.run("深圳今天的天气怎么样?")
    print(cb)