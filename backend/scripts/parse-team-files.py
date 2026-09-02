"""
Manifest the real files sitting in `data/<email>/`.

    python scripts/parse-team-files.py

Writes `scripts/team_files.json`, which `seed-team-companies.ts` reads.

Why a manifest rather than a mock. Three of the team companies have actual
document packs on disk that were never ingested — two PDFs and two spreadsheets
for Crop Saver and WaterManager, one PDF for EnviroPlus. A real file with a real
SHA-256 is better evidence than any placeholder, so those are registered as
themselves: real path, real hash, real size.

Text is extracted only where it can be. `.xlsx` is OOXML, so it opens with
`zipfile` and yields its shared strings. PDFs need a parser this environment does
not have, so they are manifested with `extractedText: null` — which is the honest
state, and which the interface can show as "filed, not yet ingested" rather than
pretending the contents are known.

Nothing here invents anything. If a file is not on disk it does not appear.
"""
import hashlib
import io
import json
import os
import re
import sys
import xml.etree.ElementTree as ET
import zipfile

sys.stdout.reconfigure(encoding="utf-8")

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.abspath(os.path.join(HERE, "..", "..", "data"))
OUT = os.path.join(HERE, "team_files.json")

# Packs already ingested by demo.ts via extracted_docs.json. Re-manifesting them
# would attach a second copy of the same document to CIVORA and HIX.
ALREADY_INGESTED = {"pathaniqra303@gmail.com"}

XL_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"


def sha256(path):
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for block in iter(lambda: fh.read(1 << 16), b""):
            h.update(block)
    return h.hexdigest()


def xlsx_text(path, limit=20000):
    """Shared strings plus inline text, in sheet order. Good enough to quote."""
    try:
        with zipfile.ZipFile(path) as z:
            shared = []
            if "xl/sharedStrings.xml" in z.namelist():
                tree = ET.fromstring(z.read("xl/sharedStrings.xml"))
                for si in tree:
                    parts = [t.text for t in si.iter(f"{XL_NS}t") if t.text]
                    shared.append("".join(parts))

            lines = []
            sheets = sorted(n for n in z.namelist() if re.match(r"xl/worksheets/sheet\d+\.xml$", n))
            for name in sheets:
                tree = ET.fromstring(z.read(name))
                for row in tree.iter(f"{XL_NS}row"):
                    cells = []
                    for c in row.iter(f"{XL_NS}c"):
                        v = c.find(f"{XL_NS}v")
                        is_el = c.find(f"{XL_NS}is")
                        if c.get("t") == "s" and v is not None and v.text is not None:
                            idx = int(v.text)
                            cells.append(shared[idx] if 0 <= idx < len(shared) else "")
                        elif is_el is not None:
                            cells.append("".join(t.text or "" for t in is_el.iter(f"{XL_NS}t")))
                        elif v is not None and v.text is not None:
                            cells.append(v.text)
                    cells = [c for c in cells if c.strip()]
                    if cells:
                        lines.append(" | ".join(cells))
            text = "\n".join(lines).strip()
            return text[:limit] or None
    except Exception as exc:  # a corrupt or password-protected workbook is not fatal
        print(f"    ! could not read {os.path.basename(path)}: {exc}")
        return None


def main():
    if not os.path.isdir(DATA):
        print(f"No data directory at {DATA}")
        return 1

    manifest = []
    for owner in sorted(os.listdir(DATA)):
        folder = os.path.join(DATA, owner)
        if not os.path.isdir(folder):
            continue
        if owner in ALREADY_INGESTED:
            print(f"{owner}: skipped, already ingested by demo.ts")
            continue

        files = sorted(f for f in os.listdir(folder) if os.path.isfile(os.path.join(folder, f)))
        if not files:
            print(f"{owner}: empty")
            continue

        print(f"{owner}:")
        for filename in files:
            path = os.path.join(folder, filename)
            ext = os.path.splitext(filename)[1].lower()
            text = xlsx_text(path) if ext == ".xlsx" else None
            manifest.append({
                "ownerEmail": owner,
                "filename": filename,
                # Recorded relative to the repository root so the manifest stays
                # valid on another machine.
                "path": os.path.relpath(path, os.path.abspath(os.path.join(HERE, "..", ".."))).replace("\\", "/"),
                "sha256": sha256(path),
                "sizeBytes": os.path.getsize(path),
                "extension": ext,
                "extractedText": text,
            })
            print(f"    {filename}  {os.path.getsize(path):>9,} B  text={'yes' if text else 'no'}")

    with open(OUT, "w", encoding="utf-8") as fh:
        json.dump(manifest, fh, indent=1, ensure_ascii=False)
    print(f"\n{len(manifest)} files manifested -> {os.path.relpath(OUT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
