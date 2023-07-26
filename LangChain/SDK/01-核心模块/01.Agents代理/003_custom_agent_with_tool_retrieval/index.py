# 【带工具检索的自定义代理】
#   本教程介绍的新想法是使用检索来选择要用于回答代理查询的工具集。
#   当你有很多工具可供选择时，这非常有用。你不能在提示中放置所有工具的描述（由于上下文长度问题)，因此你动态选择你想要在运行时考虑使用的N个工具。
#   我们将创建一个有点伪需求的例子。
#   我们将有一个合适的工具（搜索），然后99个假工具，这只是废话。
#   然后，我们将在提示模板中添加一个步骤，该步骤接受用户输入并检索与查询相关的工具。

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