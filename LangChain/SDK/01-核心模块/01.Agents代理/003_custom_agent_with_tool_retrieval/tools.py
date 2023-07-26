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
