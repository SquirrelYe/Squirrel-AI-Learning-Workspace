# 本教程介绍的新想法是使用检索来选择要用于回答代理查询的工具集。
#   当你有很多工具可供选择时，这非常有用。你不能在提示中放置所有工具的描述（由于上下文长度问题)，因此你动态选择你想要在运行时考虑使用的N个工具。
#   我们将创建一个有点伪需求的例子。
#   我们将有一个合适的工具（搜索），然后99个假工具，这只是废话。
#   然后，我们将在提示模板中添加一个步骤，该步骤接受用户输入并检索与查询相关的工具。

# 设置环境
from langchain import SerpAPIWrapper
from langchain.agents import Tool


def fake_func(inp: str) -> str:
    print("fake func", inp)
    return "foo"


# 设置工具
# 定义代理可以用来回答用户查询的工具
search = SerpAPIWrapper()
search_tool = [Tool(name="Search", func=search.run, description="useful for when you need to answer questions about current events")]
fake_tools = [Tool(name=f"foo-{i}", func=fake_func, description=f"a silly function that you can use to get more information about the number {i}") for i in range(99)]

ALL_TOOLS = search_tool + fake_tools
