# 无论模型的架构如何，当您包含 10 多个检索到的文档时，性能都会大幅下降。
# 简而言之：当模型必须在长上下文中访问相关信息时，往往会忽略所提供的文档。
# 参见： https: //arxiv.org/abs/2307.03172


# 文档地址：https://python.langchain.com/docs/modules/data_connection/document_transformers/post_retrieval/long_context_reorder