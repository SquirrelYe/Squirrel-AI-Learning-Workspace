from langchain.agents import AgentOutputParser
from langchain.schema import AgentAction, AgentFinish

from typing import Union
import re


# 自定义输出解析器
class CustomOutputParser(AgentOutputParser):

    def parse(self, llm_output: str) -> Union[AgentAction, AgentFinish]:

        # 检查代理是否应该完成
        if "Final Answer:" in llm_output:
            return AgentFinish(
                # 返回值通常是一个带有单个`output`键的字典
                # 目前不建议尝试其他任何内容 :)
                return_values={"output": llm_output.split("Final Answer:")[-1].strip()},
                log=llm_output,
            )

        # 解析出动作和动作输入
        regex = r"Action\s*\d*\s*:(.*?)\nAction\s*\d*\s*Input\s*\d*\s*:[\s]*(.*)"
        match = re.search(regex, llm_output, re.DOTALL)
        if not match:
            raise ValueError(f"Could not parse LLM output: `{llm_output}`")

        action = match.group(1).strip()
        action_input = match.group(2)

        print("CustomOutputParser ->", action, action_input, llm_output)
        # CustomOutputParser -> Search Shenzhen weather Thought: I need to find out the current weather in Shenzhen

        # 返回动作和动作输入
        return AgentAction(tool=action, tool_input=action_input.strip(" ").strip('"'), log=llm_output)


CustomOutputParserInstance = CustomOutputParser()