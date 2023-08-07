from typing import Any, List, Mapping, Optional

from langchain.callbacks.manager import CallbackManagerForLLMRun
from langchain.llms.base import LLM

# 定制LLM只需要实现一件必需的事情：
#   一种_call接受字符串、一些可选停用词并返回字符串的方法，它可以实现第二个可选的东西：
#   _identifying_params用于帮助打印此类的属性。应该返回一本字典。让我们实现一个非常简单的自定义 LLM，它只返回输入的前 N ​​个字符。

class CustomLLM(LLM):
    n: int

    @property
    def _llm_type(self) -> str:
        return "custom"

    def _call(
        self,
        prompt: str,
        stop: Optional[List[str]] = None,
        run_manager: Optional[CallbackManagerForLLMRun] = None,
    ) -> str:
        if stop is not None:
            raise ValueError("Custom LLM does not support stop tokens")
        return prompt[: self.n]

    @property
    def _identifying_params(self) -> Mapping[str, Any]:
        """Get the identifying parameters."""
        return {"n": self.n}


# 现在，我们可以像这样使用它：
llm = CustomLLM(n=10)
print(llm("This is a foobar thing"))
# print(llm("This is a foobar thing", stop=["\n"]))
print(llm)