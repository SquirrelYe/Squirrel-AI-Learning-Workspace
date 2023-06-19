from langchain import PromptTemplate
from langchain.llms import OpenAI
from langchain.chains import LLMChain, SimpleSequentialChain
from langchain.agents import (create_csv_agent, load_tools, initialize_agent, AgentType)


# 使用 LLMChain 生成回复
def use_langchain_chain():
    template = "我的邻居姓{lastname}，他生了个儿子，给他儿子起个名字"
    prompt = PromptTemplate(
        input_variables=["lastname"],
        template=template,
    )
    llm = OpenAI(temperature=0.9)
    chain1 = LLMChain(llm=llm, prompt=prompt)

    # 创建第二条链
    second_prompt = PromptTemplate(
        input_variables=["child_name"],
        template="邻居的儿子名字叫{child_name}，给他起一个小名",
    )
    chain2 = LLMChain(llm=llm, prompt=second_prompt)

    # 链接两条链
    overall_chain = SimpleSequentialChain(chains=[chain1, chain2], verbose=True)

    # 执行链，只需要传入第一个参数
    catchphrase = overall_chain.run("王")
    print(catchphrase)


# 使用 Agent 生成回复
def use_langchain_agent():
    agent = create_csv_agent(OpenAI(temperature=0), './data.csv', verbose=True)
    agent.run("一共有多少行数据?")
    agent.run("打印一下第一行数据")


# 使用 Agent 获取天气
def use_langchain_agent_weather():
    llm = OpenAI(temperature=0)
    tools = load_tools(["serpapi"], llm=llm)
    agent = initialize_agent(tools, llm, agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION, verbose=True)
    agent.run("天津有什么好玩儿的地方?")


if __name__ == '__main__':
    # use_langchain_chain()
    # use_langchain_agent()
    use_langchain_agent_weather()
