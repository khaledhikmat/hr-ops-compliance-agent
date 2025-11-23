import PyPDF2
from docx import Document as DocxDocument

def parse_pdf(file_path: str) -> str:
    """Extract text from PDF file"""
    text = ""
    with open(file_path, 'rb') as file:
        pdf_reader = PyPDF2.PdfReader(file)
        for page in pdf_reader.pages:
            text += page.extract_text()
    return text

def parse_docx(file_path: str) -> str:
    """Extract text from Word document"""
    doc = DocxDocument(file_path)
    text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
    return text

def parse_text(file_path: str) -> str:
    """Read plain text file"""
    with open(file_path, 'r', encoding='utf-8') as file:
        return file.read()

def parse_document(file_path: str, file_type: str) -> str:
    """Parse document based on file type"""
    file_type = file_type.lower()

    if 'pdf' in file_type:
        return parse_pdf(file_path)
    elif 'word' in file_type or 'docx' in file_type or 'doc' in file_type:
        return parse_docx(file_path)
    elif 'text' in file_type or 'txt' in file_type or 'plain' in file_type:
        return parse_text(file_path)
    else:
        raise ValueError(f"Unsupported file type: {file_type}")
