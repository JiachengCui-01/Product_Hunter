"""
Material extraction from furniture listing text.

Furniture marketplaces do not expose a clean structured "material" field
on search results, but material is one of the most useful ways a product
manager wants to slice a category (it drives cost, perceived quality and
manufacturing route). So it is derived here from the listing title and
feature text by matching a curated vocabulary.

Output values are CANONICAL ENGLISH (e.g. "Faux Leather", not "faux
leather" / "pu leather" / "leatherette"), because they are used as filter
facet values in the API and as translation-map keys in the frontend -
both need a stable, deduplicated key set. Display translation is the
frontend's job.

Specificity matters: patterns are ordered so that a compound material is
matched and consumed before its more generic component, otherwise
"engineered wood" would also register as "Wood" and "faux leather" as
"Leather", producing contradictory tags on the same product.
"""

import re

# (canonical name, regex alternatives). Ordered most-specific-first - see
# module docstring. Word boundaries prevent "metal" matching "metallic
# paint" style noise and "iron" matching "environment".
_MATERIAL_PATTERNS: list[tuple[str, str]] = [
    ("Faux Leather", r"faux leather|pu leather|leatherette|vegan leather|synthetic leather|bonded leather"),
    ("Engineered Wood", r"engineered wood|particle ?board|mdf|chipboard|laminate"),
    ("Solid Wood", r"solid wood|solid (?:oak|pine|walnut|acacia|teak|birch|maple)|hardwood"),
    ("Bamboo", r"bamboo"),
    ("Rattan", r"rattan"),
    ("Wicker", r"wicker"),
    ("Velvet", r"velvet"),
    ("Chenille", r"chenille"),
    ("Corduroy", r"corduroy|cord fabric"),
    ("Boucle", r"boucle|bouclé"),
    ("Linen", r"\blinen\b"),
    ("Mesh", r"\bmesh\b"),
    ("Marble", r"marble"),
    ("Glass", r"\bglass\b|tempered glass"),
    ("Steel", r"\bsteel\b|stainless"),
    ("Aluminum", r"aluminum|aluminium"),
    ("Iron", r"\bwrought iron\b|\bcast iron\b"),
    ("Acrylic", r"acrylic"),
    ("Resin", r"\bresin\b|\bhdpe\b|polypropylene"),
    ("Concrete", r"concrete|cement"),
    ("Leather", r"\bleather\b"),
    ("Wood", r"\bwood(?:en)?\b|\boak\b|\bpine\b|\bwalnut\b|\bacacia\b|\bteak\b"),
    ("Metal", r"\bmetal\b"),
    ("Plastic", r"\bplastic\b"),
    ("Fabric", r"\bfabric\b|upholster|polyester|\bcotton\b|microfiber|\bsuede\b|\bcanvas\b|\bsherpa\b"),
]

_COMPILED = [(name, re.compile(pattern, re.IGNORECASE)) for name, pattern in _MATERIAL_PATTERNS]

# Compound materials whose match should suppress a more generic sibling,
# so a product is not tagged both "Faux Leather" and "Leather".
_SUPPRESSES: dict[str, tuple[str, ...]] = {
    "Faux Leather": ("Leather",),
    "Engineered Wood": ("Wood",),
    "Solid Wood": ("Wood",),
    "Steel": ("Metal",),
    "Aluminum": ("Metal",),
    "Iron": ("Metal",),
    "Velvet": ("Fabric",),
    "Chenille": ("Fabric",),
    "Boucle": ("Fabric",),
    "Linen": ("Fabric",),
    "Corduroy": ("Fabric",),
    "Bamboo": ("Wood",),
    "Rattan": ("Wicker",),
}


def extract_materials(*texts: str, max_materials: int = 3) -> list[str]:
    """
    Derive canonical material tags from any number of text fragments
    (typically a listing title plus its extracted feature phrases).

    Returns at most `max_materials` tags, ordered by the specificity
    ordering of _MATERIAL_PATTERNS, or an empty list when the text names
    no recognizable material - which is common and fine. An empty list is
    honest; guessing a default material would silently fabricate product
    attributes that a PM might act on.
    """
    blob = " ".join(t for t in texts if t)
    if not blob:
        return []

    found: list[str] = []
    for name, pattern in _COMPILED:
        if pattern.search(blob):
            found.append(name)

    # Drop generics that a more specific sibling already covers.
    suppressed: set[str] = set()
    for name in found:
        suppressed.update(_SUPPRESSES.get(name, ()))

    result = [name for name in found if name not in suppressed]
    return result[:max_materials]


def known_materials() -> list[str]:
    """All canonical material values this module can emit (for docs/tests)."""
    return [name for name, _ in _MATERIAL_PATTERNS]
