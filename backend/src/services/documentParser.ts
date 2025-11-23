import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';

export async function parsePDF(filePath: string): Promise<string> {
  const dataBuffer = await fs.readFile(filePath);
  const data = await pdf(dataBuffer);
  return data.text;
}

export async function parseWord(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function parseDocument(filePath: string, fileType: string): Promise<string> {
  const extension = fileType.toLowerCase();

  if (extension === 'pdf' || extension === 'application/pdf') {
    return parsePDF(filePath);
  } else if (
    extension === 'docx' ||
    extension === 'doc' ||
    extension === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ) {
    return parseWord(filePath);
  } else if (extension === 'txt' || extension === 'text/plain') {
    return fs.readFile(filePath, 'utf-8');
  }

  throw new Error(`Unsupported file type: ${fileType}`);
}
