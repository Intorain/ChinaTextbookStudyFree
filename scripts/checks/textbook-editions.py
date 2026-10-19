import json
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "quiz"))
from editions import load_edition
from subjects import CHINESE

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    (root / "book.pdf").write_bytes(b"%PDF-1.7\n")
    manifest = root / "edition.json"
    data = dict(id="revised-2022", subject="chinese", school_system="6-3",
                label="Revised", source="official local download", pdf_dir=".", textbooks=["book.pdf"])
    def load():
        manifest.write_text(json.dumps(data), encoding="utf-8")
        return load_edition(manifest, "chinese", CHINESE)
    result = load()
    assert result["edition"]["id"] == "revised-2022"
    assert "edition" not in CHINESE
    data["school_system"] = "5-4"
    assert load()["edition"]["school_system"] == "5-4"
    for field, invalid in [("id", "../escape"), ("subject", "math"),
                           ("textbooks", ["../book.pdf"]), ("textbooks", ["missing.pdf"]),
                           ("school_system", "unknown")]:
        old = data[field]
        data[field] = invalid
        try:
            load()
        except ValueError:
            pass
        else:
            raise AssertionError(field)
        data[field] = old
print("PASS: edition isolation, school systems, local sources and invalid manifests")
