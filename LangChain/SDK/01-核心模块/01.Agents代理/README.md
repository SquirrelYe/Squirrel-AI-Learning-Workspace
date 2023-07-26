# Langchain Agents 代理

## Agent Types 代理类型

1. ZERO_SHOT_REACT_DESCRIPTION
    - 名称：zero-shot-react-description
    - 描述：此代理使用ReAct框架，仅基于工具的描述来确定要使用的工具。
    - 限制：可以提供任意数量的工具。
    - 其他：此代理需要为每个工具提供描述。

2. REACT_DOCSTORE
    - 名称：react-docstore
    - 描述：这个代理使用ReAct框架与文档存储进行交互。
    - 限制：必须提供两个工具：一个Search工具和一个Lookup工具（它们必须被命名为这样）。
    - 其他：Search工具应该搜索文档，而Lookup工具应该查找最近找到的文档中的一个术语。这个代理相当于最初的ReAct论文(opens in a new tab)，特别是维基百科的例子。

3. SELF_ASK_WITH_SEARCH
    - 名称：self-ask-with-search
    - 描述：这个代理使用一个被命名为Intermediate Answer的工具。
    - 限制：这个工具应该能够查找问题的事实性答案。
    - 其他：这个代理相当于最初的self ask with search paper(opens in a new tab)，其中提供了Google搜索API作为工具。

4. CONVERSATIONAL_REACT_DESCRIPTION
    - 名称：conversational-react-description
    - 描述：这个代理程序旨在用于对话环境中。
    - 限制：提示设计旨在使代理程序有助于对话。
    - 其他：它使用ReAct框架来决定使用哪个工具，并使用内存来记忆先前的对话交互。