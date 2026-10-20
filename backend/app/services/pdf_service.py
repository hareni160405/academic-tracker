import os
from typing import Optional
from pypdf import PdfReader

class PDFService:
    @staticmethod
    def extract_text_from_file(file_path: str, file_type: str = "PDF") -> str:
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")
        
        file_ext = file_type.upper()
        if "TXT" in file_ext:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read().strip()
        
        # PDF parsing
        try:
            reader = PdfReader(file_path)
            extracted_pages = []
            for i, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    extracted_pages.append(text.strip())
            
            full_text = "\n\n".join(extracted_pages).strip()
            if not full_text:
                return "The uploaded PDF appears to contain scanned images or non-selectable text. Please paste the topic text directly or upload a text-readable document."
            return full_text
        except Exception as e:
            return f"Error reading PDF content: {str(e)}"
