from langchain.document_loaders import TextLoader, UnstructuredPDFLoader
from langchain.embeddings.openai import OpenAIEmbeddings
from langchain.text_splitter import CharacterTextSplitter
from langchain.vectorstores import Chroma

baseDir = "./files/"

# 加载PDF文档
loader = UnstructuredPDFLoader(baseDir + "index.pdf")
content = loader.load()

# 将文档分割成块
text_splitter = CharacterTextSplitter(chunk_size=300, chunk_overlap=0)
documents = text_splitter.split_documents(content)
db = Chroma.from_documents(documents, OpenAIEmbeddings())

query = "What is LLMSingleActionAgent?"

# 执行相似性搜索
# docs = db.similarity_search(query)
# print(docs[0].page_content)

# 还可以搜索与给定嵌入向量类似的文档，使用 similarity_search_by_vector 该向量接受嵌入向量作为参数而不是字符串。
embedding_vector = OpenAIEmbeddings().embed_query(query)
docs = db.similarity_search_by_vector(embedding_vector)
print(docs[0].page_content)