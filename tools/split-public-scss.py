#!/usr/bin/env python3
"""Split public-blocks.scss into partials and drop unused legacy selectors."""
from __future__ import annotations

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "frontend/src/app/cms/blocks/public-blocks.scss"
OUT = ROOT / "frontend/src/app/cms/blocks/styles"

DEAD_CLASSES = {
    "rack-hero",
    "rack-hero-copy",
    "rack-hero-photo",
    "editorial-hero",
    "editorial-hero-grid",
    "editorial-hero-copy",
    "editorial-hero-photo",
    "split-block",
    "home-band",
    "home-band--paper",
    "home-band--mist",
    "home-heading",
    "home-chip",
    "home-chip--on-dark",
    "home-chip--photo",
    "navy-split",
    "mini-card",
    "info-bay",
}


def class_names(selector: str) -> set[str]:
    return set(re.findall(r"\.([A-Za-z][\w-]*)", selector))


def is_dead_selector(selector: str) -> bool:
    names = class_names(selector)
    if not names:
        return False
    if names & DEAD_CLASSES and not (names - DEAD_CLASSES):
        return True
    # Drop mixed lists that only exist to share style with dead heroes.
    if names <= DEAD_CLASSES:
        return True
    return False


def strip_dead_parts(selector: str) -> str | None:
    parts = [p.strip() for p in selector.split(",")]
    kept = []
    for part in parts:
        names = class_names(part)
        if names & DEAD_CLASSES and not (names - DEAD_CLASSES - {"home-wrapper", "container", "lead"}):
            continue
        if is_dead_selector(part):
            continue
        if any(name in DEAD_CLASSES for name in names):
            continue
        kept.append(part)
    if not kept:
        return None
    return ",\n".join(kept)


def split_top_level(text: str) -> list[str]:
    chunks: list[str] = []
    buf: list[str] = []
    depth = 0
    i = 0
    n = len(text)
    while i < n:
        ch = text[i]
        if text.startswith("/*", i):
            end = text.find("*/", i + 2)
            end = n if end < 0 else end + 2
            piece = text[i:end]
            if depth == 0 and buf and "".join(buf).strip():
                chunks.append("".join(buf))
                buf = []
            if depth == 0:
                chunks.append(piece)
            else:
                buf.append(piece)
            i = end
            continue
        buf.append(ch)
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth = max(0, depth - 1)
            if depth == 0:
                chunks.append("".join(buf))
                buf = []
        i += 1
    if buf and "".join(buf).strip():
        chunks.append("".join(buf))
    return chunks


def bucket_for(chunk: str) -> str | None:
    stripped = chunk.strip()
    if not stripped or stripped.startswith("/*"):
        return None
    head = stripped.split("{", 1)[0]
    if is_dead_selector(head) or strip_dead_parts(head) is None:
        return None
    s = head
    if "premium-" in s or ".p-card" in s or ".p-btn" in s or ".p-icon" in s or ".p-link" in s or ".trust-item" in s or ".visual-frame" in s or ".glass-" in s or ".t-card" in s or ".t-cta" in s or ".check-" in s:
        return "premium"
    if ".client-" in s or ".extra-" in s or ".accordion" in s or ".subcategory" in s:
        return "extra"
    if ".form-shell" in s or ".form-row" in s:
        return "contact"
    if ".listing-" in s or ".service-" in s or ".reason-" in s:
        return "listing"
    if ".about-" in s or ".team-" in s or ".stat-" in s:
        return "about"
    return "shared"


def rewrite_chunk(chunk: str) -> str | None:
    stripped = chunk.strip()
    if stripped.startswith("/*"):
        return None
    if "{" not in chunk:
        return chunk.strip()
    selector, rest = chunk.split("{", 1)
    new_sel = strip_dead_parts(selector)
    if not new_sel:
        return None
    return f"{new_sel} {{{rest}".strip()


def main() -> None:
    raw = SRC.read_text(encoding="utf-8")
    # Drop the old editorial home block (between leftover editorial rules and premium redesign).
    raw = re.sub(
        r"\n\.editorial-hero \{.*?(?=\n/\* =+\n   Public home — Linear)",
        "\n",
        raw,
        count=1,
        flags=re.S,
    )
    chunks = split_top_level(raw)
    buckets = {k: [] for k in ("shared", "premium", "about", "listing", "extra", "contact")}
    pending_comment = ""
    for chunk in chunks:
        text = chunk.strip("\n")
        if text.strip().startswith("/*"):
            pending_comment = text.strip()
            continue
        rewritten = rewrite_chunk(chunk)
        if not rewritten:
            pending_comment = ""
            continue
        bucket = bucket_for(rewritten) or "shared"
        if pending_comment:
            buckets[bucket].append(pending_comment)
            pending_comment = ""
        buckets[bucket].append(rewritten)

    OUT.mkdir(parents=True, exist_ok=True)
    headers = {
        "shared": "// Layout compartido: heroes, grids, legal, 404.",
        "premium": "// Portada premium (inicio).",
        "about": "// Acerca de: stats, team, about visual.",
        "listing": "// Listados de servicios y reasons.",
        "extra": "// Clientes, FAQ, galería, mapa.",
        "contact": "// Formulario de contacto.",
    }
    for name, lines in buckets.items():
        body = "\n\n".join(lines).strip() + "\n"
        (OUT / f"_{name}.scss").write_text(headers[name] + "\n\n" + body, encoding="utf-8")

    index = """@use 'styles/shared';
@use 'styles/about';
@use 'styles/listing';
@use 'styles/extra';
@use 'styles/contact';
@use 'styles/premium';
"""
    SRC.write_text(index, encoding="utf-8")
    print("Wrote", OUT, "and", SRC)


if __name__ == "__main__":
    main()
