from langchain.prompts import StringPromptTemplate
from typing import Callable

import tool_retriever

# 设置基本模板
template = """Answer the following questions as best you can, but speaking as a pirate might speak. You have access to the following tools:
 
{tools}
 
Use the following format:
 
Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question
 
Begin! Remember to speak as a pirate when giving your final answer. Use lots of "Arg"s
 
Question: {input}
{agent_scratchpad}"""


# 设置提示模板
class CustomPromptTemplate(StringPromptTemplate):
    template: str  # 使用的模板
    tools_getter: Callable  # 可用工具列表

    def format(self, **kwargs) -> str:

        print("CustomPromptTemplate ->", kwargs)
        # {'input': '深圳今天的天气怎么样?', 'intermediate_steps': []}
        # {'input': '深圳今天的天气怎么样?', 'intermediate_steps': [
        #       (AgentAction(
        #               tool='Search',
        #               tool_input='Shenzhen weather',
        #               log='Thought: I need to find out what the weather is like in Shenzhen today.\nAction: Search\nAction Input: Shenzhen weather'
        #           ),
        #           'Shenzhen, Guangdong, China Weather Forecast, with current conditions, wind, air quality, and what to expect for the next 3 days.'
        #       )
        # ]}

        # 获取中间步骤（AgentAction，Observation元组）
        # 以特定方式格式化它们
        intermediate_steps = kwargs.pop("intermediate_steps")
        thoughts = ""
        for action, observation in intermediate_steps:
            thoughts += action.log
            thoughts += f"\nObservation: {observation}\nThought: "

        # 将agent_scratchpad变量设置为该值
        kwargs["agent_scratchpad"] = thoughts
        tools = self.tools_getter(kwargs["input"])

        # 从提供的工具列表创建一个工具变量
        kwargs["tools"] = "\n".join([f"{tool.name}: {tool.description}" for tool in tools])

        # 为提供的工具创建一个工具名称列表
        kwargs["tool_names"] = ", ".join([tool.name for tool in tools])

        template = self.template.format(**kwargs)

        return template


# 这省略了`agent_scratchpad`，`tools`和`tool_names`变量，因为这些变量是动态生成的
# 这包括`intermediate_steps`变量，因为这是必需的
CustomPromptInstance = CustomPromptTemplate(template=template, tools_getter=tool_retriever.get_tools, input_variables=["input", "intermediate_steps"])
