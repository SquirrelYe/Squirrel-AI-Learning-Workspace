from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.document_loaders import UnstructuredPDFLoader

baseDir = "./files/"

# 加载文档后，您通常会想要对其进行转换以更好地适合您的应用程序。
# 最简单的例子是，您可能希望将长文档分割成更小的块，以适合模型的上下文窗口。
# LangChain 有许多内置的文档转换器，可以轻松地拆分、组合、过滤和以其他方式操作文档。

loader = UnstructuredPDFLoader(baseDir + "index.pdf")
pages = loader.load()
content = pages[0].page_content

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size = 100,
    chunk_overlap  = 20,
    length_function = len,
    add_start_index = True
)

texts = text_splitter.create_documents([content])
print(texts[0])
print(len(texts))
