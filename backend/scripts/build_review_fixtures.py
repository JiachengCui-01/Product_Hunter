"""
Build real-review fixtures from the free Amazon Reviews'23 dataset.

WHY THIS EXISTS
---------------
The app's core AI feature is Aspect-Based Sentiment Analysis over customer
reviews. Getting real review text from a paid marketplace API is both
expensive (Rainforest bills ~1 credit per product) and, at time of writing,
impossible - Rainforest's `type=reviews` endpoint has been returning 503
"temporarily unavailable" for an extended period.

Review text, unlike price/rank data, does not need to be fresh: a 2023
complaint that a laundry cart's drawers are too shallow is exactly as
useful a product-development insight today. That makes a static academic
dataset a strictly better source here - free, unlimited, and real.

Source: Amazon Reviews'23 (McAuley Lab, UCSD). https://amazon-reviews-2023.github.io/

Each source category file is tens of GB, so this script uses an HTTP Range
request to read only the first N megabytes (JSONL = one complete record
per line, so a prefix is directly parseable). Downloaded prefixes are
cached under scripts/.cache/ so re-tuning the filters does not re-download.

Three source departments are sampled rather than one, because the app's
categories do not all live under the same Amazon department: patio
furniture is in Patio_Lawn_and_Garden and desks/office chairs are in
Office_Products, so sampling only Home_and_Kitchen starves those two
(observed: Outdoor yielded 22 reviews vs 80 for the rest).

MATCHING PRECISION
------------------
Naive "furniture noun appears anywhere in the review" matching produced
bad false positives in testing - reviews of sofa *covers* and *organizers*
(matched on "sofa"), and even printer ink cartridges from Office_Products.
Those are reviews about accessories *for* furniture, not about furniture,
so their pain points are useless for furniture product development. The
fix is an unconditional accessory/consumable blocklist applied before any
category matching, plus title-over-body priority when deciding which
category a genuine furniture review belongs to.

LICENSE NOTE: this is an academic research dataset with no explicit
license stated on its Hugging Face card. Fine for development and
evaluation; confirm terms independently before any commercial use.

Usage (from backend/, venv active):
    python scripts/build_review_fixtures.py [--mb 60] [--per-category 80]
    python scripts/build_review_fixtures.py --no-cache   # force re-download

Output: backend/app/seed/fixtures/reviews/<category-slug>.json
This is a BUILD-TIME script - the app never calls it at runtime, it only
reads the committed fixtures it produces.
"""

import argparse
import html
import json
import re
import urllib.request
from collections import defaultdict
from pathlib import Path

BASE_URL = (
    "https://huggingface.co/datasets/McAuley-Lab/Amazon-Reviews-2023/"
    "resolve/main/raw/review_categories/{source}.jsonl"
)

SCRIPT_DIR = Path(__file__).resolve().parent
CACHE_DIR = SCRIPT_DIR / ".cache"
FIXTURES_DIR = SCRIPT_DIR.parent / "app" / "seed" / "fixtures" / "reviews"

# Furniture nouns per app category. Deliberately specific ("bar stool", not
# "stool") to avoid pulling in unrelated items - the source departments are
# mostly cookware/decor/garden tools/office supplies.
CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "Living Room": [
        "sofa", "couch", "sectional", "loveseat", "recliner", "coffee table",
        "tv stand", "media console", "accent chair", "side table",
        "end table", "console table", "futon", "ottoman",
    ],
    "Bedroom": [
        "dresser", "nightstand", "night stand", "bed frame", "headboard",
        "wardrobe", "chest of drawers", "armoire", "vanity table",
        "bed slats", "bunk bed",
    ],
    "Kitchen": [
        "kitchen island", "bar stool", "counter stool", "dining table",
        "dining chair", "buffet cabinet", "sideboard", "pantry cabinet",
        "microwave stand", "bakers rack", "kitchen cart", "kitchen shelf",
        "spice rack", "kitchen table",
    ],
    "Home Office": [
        "office desk", "standing desk", "computer desk", "writing desk",
        "office chair", "desk chair", "bookshelf", "bookcase",
        "filing cabinet", "file cabinet", "monitor stand", "desk lamp",
        "study desk", "gaming chair", "task chair",
    ],
    "Laundry Room": [
        "laundry hamper", "laundry basket", "laundry sorter", "laundry cart",
        "laundry room", "drying rack", "ironing board", "utility cart",
        "clothes hamper",
    ],
    "Entryway": [
        "entryway", "shoe rack", "shoe cabinet", "shoe bench", "coat rack",
        "hall tree", "mudroom", "entry table", "coat hooks",
    ],
    "Outdoor": [
        "patio furniture", "patio chair", "patio table", "patio set",
        "outdoor furniture", "outdoor chair", "outdoor table", "adirondack",
        "fire pit table", "garden bench", "porch swing", "deck box",
        "patio umbrella", "bistro set", "outdoor sofa",
        "hammock", "outdoor bench",
    ],
}

# Terms that indicate the review is about an accessory/consumable rather
# than the furniture itself. See MATCHING PRECISION in the module docstring.
ACCESSORY_TERMS = [
    # Soft goods / coverings
    "cover", "slipcover", "protector", "throw pillow", "pillow case",
    "blanket", "mat", "rug", "tablecloth", "table cloth", "runner",
    "seat cushion", "chair pad", "cushion",
    # Storage add-ons that sit on/in furniture rather than being furniture
    "organizer", "caddy", "holder", "folder", "insert", "bin liner",
    "hanging", "sleeve", "pouch", "basket liner",
    # Consumables / office supplies
    "cartridge", "ink", "toner", "paper", "stapler", "pen", "label",
    # Desk peripherals
    "mousepad", "mouse pad", "wrist rest", "keyboard tray",
    # Hardware / maintenance / misc
    "coaster", "felt pad", "furniture pad", "sticker", "decal", "paint",
    "polish", "cleaner", "wipes", "screws", "bolts", "anti-tip",
    "cable clip", "cord", "lamp shade", "light bulb", "batteries",
    # Garden/outdoor non-furniture that shares vocabulary
    "bee", "trap", "bird", "planter", "hose", "sprinkler", "seed",
]

# Quality gates: a review has to actually say something about the product
# for aspect-based sentiment analysis to have anything to extract.
MIN_LEN = 70
MAX_LEN = 600

# Target rating mix per category. Low-star reviews are where the
# product-development signal lives (concrete complaints -> pain points),
# so they get an equal share rather than their much rarer natural
# frequency, while keeping enough positives for the "what users love" side.
RATING_QUOTA = {1: 0.20, 2: 0.20, 3: 0.20, 4: 0.20, 5: 0.20}

# Reviews that are mostly boilerplate/noise rather than product feedback.
_NOISE = re.compile(
    r"(five stars|four stars|three stars|two stars|one star|as described|"
    r"as advertised)\.?$",
    re.IGNORECASE,
)

SOURCES: dict[str, list[str]] = {
    "Home_and_Kitchen": ["Living Room", "Bedroom", "Kitchen", "Laundry Room", "Entryway"],
    "Office_Products": ["Home Office"],
    "Patio_Lawn_and_Garden": ["Outdoor"],
}


def fetch_prefix(source: str, megabytes: int, use_cache: bool = True) -> list[dict]:
    """
    Range-download the first N MB of one department file and parse records.
    Cached on disk so filter tuning does not re-download hundreds of MB.
    """
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    cache_file = CACHE_DIR / f"{source}_{megabytes}mb.jsonl"

    if use_cache and cache_file.exists():
        raw_text = cache_file.read_text(encoding="utf-8", errors="ignore")
        print(f"  using cached {source} ({cache_file.stat().st_size / 1024 / 1024:.1f} MB)")
    else:
        url = BASE_URL.format(source=source)
        req = urllib.request.Request(url, headers={"Range": f"bytes=0-{megabytes * 1024 * 1024}"})
        print(f"  downloading first {megabytes} MB of {source}...")
        with urllib.request.urlopen(req, timeout=300) as resp:
            raw_text = resp.read().decode("utf-8", errors="ignore")
        cache_file.write_text(raw_text, encoding="utf-8")

    records = []
    # Drop the last line: a byte-range cut almost certainly truncates it.
    for line in raw_text.splitlines()[:-1]:
        try:
            records.append(json.loads(line))
        except json.JSONDecodeError:
            continue
    print(f"    parsed {len(records):,} reviews")
    return records


def clean_text(value: str) -> str:
    """Unescape HTML entities and collapse whitespace/line breaks."""
    text = html.unescape(value or "")
    return re.sub(r"\s+", " ", text).strip()


def classify(title: str, text: str, candidates: list[str]) -> str | None:
    """
    Return which of `candidates` this review is about, or None.

    A keyword in the title is a strong signal and accepted outright. A
    body-only keyword is accepted only when no accessory term is present,
    which is what filters out reviews of sofa covers, chair pads, printer
    cartridges and similar non-furniture items.
    """
    title_l, text_l = title.lower(), text.lower()

    # The accessory blocklist is unconditional. An earlier version treated a
    # title keyword hit as a strong-enough signal to skip this check, which
    # let through reviews titled e.g. "sofa organizer" and "lounge chair
    # cover" - the accessory word is exactly what disqualifies them, whether
    # it sits in the title or the body.
    if any(term in title_l or term in text_l for term in ACCESSORY_TERMS):
        return None

    # Title hits still take priority over body hits when deciding *which*
    # category a genuine furniture review belongs to.
    for category in candidates:
        if any(kw in title_l for kw in CATEGORY_KEYWORDS[category]):
            return category
    for category in candidates:
        if any(kw in text_l for kw in CATEGORY_KEYWORDS[category]):
            return category
    return None


def is_quality(text: str) -> bool:
    """Keep only reviews with enough substance for aspect extraction."""
    if not (MIN_LEN <= len(text) <= MAX_LEN):
        return False
    if _NOISE.search(text):
        return False
    if len(text.split()) < 12:
        return False
    return True


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--mb", type=int, default=60, help="MB to sample per source department")
    parser.add_argument("--per-category", type=int, default=80, help="reviews per category")
    parser.add_argument("--no-cache", action="store_true", help="force re-download")
    args = parser.parse_args()

    # buckets[app_category][rating] -> list of cleaned review dicts
    buckets: dict[str, dict[int, list[dict]]] = defaultdict(lambda: defaultdict(list))
    rejected_accessory = 0

    for source, candidates in SOURCES.items():
        print(f"\nSource: {source} -> {', '.join(candidates)}")
        for r in fetch_prefix(source, args.mb, use_cache=not args.no_cache):
            text = clean_text(r.get("text") or "")
            title = clean_text(r.get("title") or "")
            if not is_quality(text):
                continue
            category = classify(title, text, candidates)
            if category is None:
                rejected_accessory += 1
                continue
            rating = int(r.get("rating") or 0)
            if rating in RATING_QUOTA:
                buckets[category][rating].append(
                    {
                        "review": text,
                        "rating": r.get("rating"),
                        "title": title,
                        "verified_purchase": r.get("verified_purchase"),
                        "helpful_vote": r.get("helpful_vote", 0),
                        "asin": r.get("asin"),
                    }
                )

    FIXTURES_DIR.mkdir(parents=True, exist_ok=True)
    print(f"\nWriting fixtures to {FIXTURES_DIR}\n")

    summary = {}
    for category in CATEGORY_KEYWORDS:
        by_rating = buckets.get(category, {})
        selected: list[dict] = []

        for rating, share in RATING_QUOTA.items():
            want = max(1, int(args.per_category * share))
            selected.extend(by_rating.get(rating, [])[:want])

        if len(selected) < args.per_category:
            already = {id(r) for r in selected}
            leftovers = [r for rs in by_rating.values() for r in rs if id(r) not in already]
            selected.extend(leftovers[: args.per_category - len(selected)])

        selected = selected[: args.per_category]
        out = FIXTURES_DIR / f"{slugify(category)}.json"
        out.write_text(json.dumps(selected, indent=2, ensure_ascii=False), encoding="utf-8")

        dist = {rt: sum(1 for p in selected if p["rating"] == rt) for rt in sorted(RATING_QUOTA)}
        negatives = dist[1] + dist[2] + dist[3]
        summary[category] = len(selected)
        print(f"  {category:14s} {len(selected):4d} reviews  mix {dist}  (<=3 star: {negatives})")

    total = sum(summary.values())
    print(f"\nTotal: {total} real reviews across {len(summary)} categories.")
    print(f"Rejected as accessory/off-topic: {rejected_accessory:,}")
    short = [c for c, n in summary.items() if n < args.per_category]
    if short:
        print(f"Short of target: {', '.join(short)} - re-run with a larger --mb.")


if __name__ == "__main__":
    main()
