import os
from pypdf import PdfReader

pdf_dir = "public"
files = [f for f in os.listdir(pdf_dir) if f.endswith(".pdf")]

for file in files:
    try:
        reader = PdfReader(os.path.join(pdf_dir, file))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        with open(file + ".txt", "w", encoding="utf-8") as f:
            f.write(text)
        print(f"Extracted {file}")
    except Exception as e:
        print(f"Error {file}: {e}")
