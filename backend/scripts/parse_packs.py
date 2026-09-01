import sys
import zipfile
import xml.etree.ElementTree as ET
import json
import hashlib
import os
import io

sys.stdout.reconfigure(encoding='utf-8')

def parse_docx_bytes(data):
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as doc_z:
            if 'word/document.xml' not in doc_z.namelist():
                return ""
            xml_content = doc_z.read('word/document.xml')
            tree = ET.fromstring(xml_content)
            texts = []
            for elem in tree.iter():
                if elem.tag.endswith('t') and elem.text:
                    texts.append(elem.text)
            return ' '.join(texts)
    except Exception as e:
        return f"[Text extraction note: {e}]"

def parse_pptx_bytes(data):
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as ppt_z:
            texts = []
            for name in ppt_z.namelist():
                if name.startswith('ppt/slides/slide') and name.endswith('.xml'):
                    xml_content = ppt_z.read(name)
                    tree = ET.fromstring(xml_content)
                    slide_texts = []
                    for elem in tree.iter():
                        if elem.tag.endswith('t') and elem.text:
                            slide_texts.append(elem.text)
                    if slide_texts:
                        texts.append(f"[Slide] {' '.join(slide_texts)}")
            return '\n\n'.join(texts)
    except Exception as e:
        return f"[PPTX extraction note: {e}]"

def parse_xlsx_bytes(data):
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as xls_z:
            texts = []
            if 'xl/sharedStrings.xml' in xls_z.namelist():
                xml_content = xls_z.read('xl/sharedStrings.xml')
                tree = ET.fromstring(xml_content)
                for elem in tree.iter():
                    if elem.tag.endswith('t') and elem.text:
                        texts.append(elem.text)
            return ' | '.join(texts)
    except Exception as e:
        return f"[XLSX extraction note: {e}]"

def categorize_file(filename, text_content):
    fn_upper = filename.upper()
    txt_upper = text_content.upper()

    if 'INCORPORATION' in fn_upper or 'MOA' in fn_upper or 'AOA' in fn_upper or 'BOARD_RESOLUTION' in fn_upper or 'SHAREHOLDER' in fn_upper or 'EMPLOYMENT' in fn_upper or 'NDA' in fn_upper or 'REGISTERED_OFFICE' in fn_upper:
        return 'CORPORATE_LEGAL'
    if 'DPIIT' in fn_upper or 'MAHARASHTRA_STARTUP' in fn_upper or 'FUNDING_APPLICATION' in fn_upper or 'PARTNERSHIP_PROPOSAL' in fn_upper or 'UTILIZATION' in fn_upper or 'DPR' in fn_upper or 'PITCH_DECK' in fn_upper or 'ELIGIBILITY' in fn_upper or 'DUPLICATE_FUNDING' in fn_upper:
        return 'GOVERNMENT_FUNDING'
    if 'PNL' in fn_upper or 'BALANCE_SHEET' in fn_upper or 'CASH_FLOW' in fn_upper or 'CAP_TABLE' in fn_upper or 'CONFIRMATION' in fn_upper or 'FINANCIAL' in fn_upper:
        return 'FINANCIAL'
    if 'CYBERSECURITY' in fn_upper or 'DATA_PROTECTION' in fn_upper or 'REGULATORY_MATRIX' in fn_upper:
        return 'COMPLIANCE'
    if 'KYC' in fn_upper or 'AML' in fn_upper:
        return 'KYC'
    if 'IP_OWNERSHIP' in fn_upper:
        return 'OWNERSHIP'
    if 'PRODUCT_SPECIFICATION' in fn_upper or 'TECHNICAL_ARCHITECTURE' in fn_upper:
        return 'TECHNOLOGY'
    if 'PILOT_PLAN' in fn_upper:
        return 'PILOT'
    if 'AI_MODEL_GOVERNANCE' in fn_upper:
        return 'AI_GOVERNANCE'
    if 'CHECKLIST' in fn_upper:
        return 'CHECKLIST'
    
    return 'OTHER'

def main():
    zips = [
        ('CIVORA', 'data/CIVORA_Fictional_Government_Funding_Pack.zip'),
        ('HIX', 'data/HIX_Fictional_Legal_Document_Pack.zip'),
        ('HIX', 'data/HIX_Government_Funding_Package.zip')
    ]

    documents = []
    seen_hashes = set()

    for company, zrel in zips:
        zpath = os.path.abspath(zrel)
        if not os.path.exists(zpath):
            continue
        with zipfile.ZipFile(zpath, 'r') as z:
            for name in z.namelist():
                if name.endswith('/') or 'README' in name:
                    continue
                data = z.read(name)
                file_hash = hashlib.sha256(data).hexdigest()

                # Deduplication check per company
                dedup_key = f"{company}:{file_hash}"
                if dedup_key in seen_hashes:
                    continue
                seen_hashes.add(dedup_key)

                ext = os.path.splitext(name)[1].lower()
                extracted_text = ""
                if ext == '.docx':
                    extracted_text = parse_docx_bytes(data)
                elif ext == '.pptx':
                    extracted_text = parse_pptx_bytes(data)
                elif ext == '.xlsx':
                    extracted_text = parse_xlsx_bytes(data)

                category = categorize_file(name, extracted_text)

                title = os.path.basename(name).replace('_', ' ')
                title = os.path.splitext(title)[0]

                documents.append({
                    'company': company,
                    'zipFile': os.path.basename(zrel),
                    'originalFilename': name,
                    'fileHash': file_hash,
                    'extension': ext,
                    'sizeBytes': len(data),
                    'category': category,
                    'title': title,
                    'extractedText': extracted_text[:10000]
                })

    out_path = os.path.abspath('backend/scripts/extracted_docs.json')
    with open(out_path, 'w', encoding='utf-8') as out_f:
        json.dump(documents, out_f, indent=2, ensure_ascii=False)

    print(f"Successfully extracted {len(documents)} unique documents to {out_path}")

if __name__ == '__main__':
    main()
