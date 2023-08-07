from langchain.llms import OpenAI
from langchain.chat_models import ChatOpenAI

llm = OpenAI(model="text-davinci-003", temperature=0)
# llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)

# 单个输入
result1 = llm("Tell me a joke")
print(result1)

# 批量输入
result2 = llm.generate(["Tell me a joke", "Tell me a poem"])
len(result2.generations)
print(result2)

# generations=[
#       [Generation(text='\n\nQ: What did the fish say when it hit the wall?\nA: Dam!', generation_info={'finish_reason': 'stop', 'logprobs': None})], 
#       [Generation(text='\n\nRoses are red,\nViolets are blue,\nSugar is sweet,\nAnd so are you.', generation_info={'finish_reason': 'stop', 'logprobs': None})]] 
# llm_output={'token_usage': {'completion_tokens': 46, 'prompt_tokens': 8, 'total_tokens': 54}, 'model_name': 'text-davinci-003'} 
# run=[
#       RunInfo(run_id=UUID('cde8af33-5ddb-47f0-9bef-c6f38012b305')), 
#       RunInfo(run_id=UUID('586f3248-5016-42f3-996e-231f2f14d45d'))
# ]

print(result2.generations[0])
print(result2.llm_output)
# {'total_tokens': 51, 'completion_tokens': 43, 'prompt_tokens': 8}, 'model_name': 'text-davinci-003'}