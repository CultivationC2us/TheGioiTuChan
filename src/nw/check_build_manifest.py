#!/usr/bin/env python3
"""Static contract check for the game's token-based HTML bundler.

This intentionally does not build or modify game files. It checks that template
placeholders and build.py replacement keys remain in sync and that explicit
source files referenced by the builder exist.
"""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[2]
NW = ROOT / "src" / "nw"
BUILDER = NW / "build.py"
TEMPLATE = NW / "game_tpl.html"

def fail(message):
    print("FAIL " + message)
    return 1

def main():
    builder = BUILDER.read_text(encoding="utf-8")
    template = TEMPLATE.read_text(encoding="utf-8")

    # Only match replacement dictionary keys, not the separate BUILD timestamp.
    keys = re.findall(r"""['"]({{[A-Z0-9_]+}})['"]\s*:""", builder)
    if not keys:
        return fail("no template replacement keys found in build.py")
    if len(keys) != len(set(keys)):
        return fail("duplicate replacement key in build.py")

    template_tokens = set(re.findall(r"{{[A-Z0-9_]+}}", template))
    replacement_tokens = set(keys)
    special_tokens = {"{{BUILD}}"}
    missing_replacements = sorted(template_tokens - replacement_tokens - special_tokens)
    unused_replacements = sorted(replacement_tokens - template_tokens)
    if missing_replacements:
        return fail("template tokens without replacement: " + ", ".join(missing_replacements))
    if unused_replacements:
        return fail("replacement keys absent from template: " + ", ".join(unused_replacements))
    if template.count("{{BUILD}}") != 1:
        return fail("expected exactly one {{BUILD}} timestamp token")

    # These are direct, explicit source references used by build.py. Paths are
    # relative to src/, because build.py changes its working directory to src/.
    refs = set(re.findall(r"""(?:open|b64)\(\s*['"]nw/([^'"]+)['"]""", builder))
    missing_files = sorted(p for p in refs if not (ROOT / "src" / "nw" / p).is_file())
    if missing_files:
        return fail("builder references missing source files: " + ", ".join(missing_files))

    print(f"PASS {len(template_tokens)} template tokens accounted for")
    print(f"PASS {len(refs)} explicit builder source paths exist")
    print("PASS build/template token contract is consistent")
    return 0

if __name__ == "__main__":
    sys.exit(main())
