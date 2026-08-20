"""
MockDataProvider - a fully deterministic, offline MarketDataProvider
implementation used as the default DATA_PROVIDER ("mock").

No network calls are made. All data is procedurally generated from
hand-curated, category-specific vocabulary pools (keywords, product name
templates, feature pools, and review sentence banks) using a
per-category-seeded `random.Random` instance. Seeding on
`hash(category.name) % (2**32)` means the SAME category always produces
the SAME trend score / product list shape across repeated calls within
a process run, while still varying across the 7 different categories -
this is what "deterministic-per-category variety" means in practice and
is what makes the seed script's output reproducible enough to reason
about while still feeling like real, varied market data.

This module intentionally contains a large amount of hand-written
furniture-domain vocabulary (not lorem-ipsum placeholders) so that the
demo data, seeded reviews, and LLM analysis all "feel" like a real
furniture market intelligence product rather than a toy.
"""

import random

from app.services.market_data_provider import MarketDataProvider


# ---------------------------------------------------------------------------
# Category vocabulary pools
# ---------------------------------------------------------------------------
# Each of the 7 supported categories gets:
#   - TREND_KEYWORDS: candidate keywords for MarketTrend.keywords
#   - PRODUCT_NOUNS: distinctive product "types" used to build product names
#     (kept distinctive across categories so get_reviews() can reverse-infer
#     a category purely from a product name string - see _infer_category())
#   - FEATURES: candidate product features
#   - REVIEW_TEMPLATES: ~25 realistic review sentences mixing praise and
#     specific, concrete pain points

ADJECTIVES = [
    "Modern", "Scandinavian", "Rustic Oak", "Compact", "Luxury",
    "Minimalist", "Industrial", "Classic", "Convertible", "Velvet",
    "Farmhouse", "Mid-Century", "Space-Saving", "Premium", "Eco-Friendly",
    "Handcrafted", "Foldable", "Reversible", "Weathered", "Sleek",
]

CATEGORY_DATA = {
    "Living Room": {
        "trend_keywords": [
            "sectional sofas", "mid-century modern", "modular seating",
            "accent chairs", "media consoles", "small-space furniture",
            "boucle upholstery", "convertible sofa beds",
        ],
        "product_nouns": [
            "Sectional Sofa", "Loveseat", "Accent Chair", "Coffee Table",
            "TV Console", "Recliner", "Ottoman", "Bookshelf",
        ],
        "features": [
            "removable washable covers", "built-in USB charging ports",
            "reversible chaise", "solid hardwood frame", "stain-resistant fabric",
            "tool-free assembly", "modular reconfigurable sections", "memory foam cushions",
        ],
        "reviews": [
            "The sectional looks stunning in our living room and the fabric feels premium.",
            "Assembly instructions were confusing and took us almost three hours.",
            "Cushions started sagging noticeably after only two months of normal use.",
            "Great value for the price, sturdier than I expected for this budget.",
            "Arrived with a visible scratch on one arm, had to request a replacement part.",
            "The reversible chaise is genuinely useful for our oddly shaped room.",
            "Color is slightly more gray than the beige shown in photos.",
            "Delivery was fast and the two-person carry team was professional.",
            "Fabric pills after a few weeks even with light use, disappointing durability.",
            "Perfect size for a small apartment, doesn't overwhelm the space.",
            "The USB charging ports stopped working within the first month.",
            "Extremely comfortable, we fell asleep on it the first night testing it out.",
            "Wobbles slightly on hardwood floors, had to add furniture pads ourselves.",
            "Customer service was responsive when a bolt was missing from the box.",
            "The coffee table's finish scuffs very easily, already has marks.",
            "Solid frame, feels like it will last for years, no creaking at all.",
            "Instructions reference parts by numbers that don't match the bag labels.",
            "Love how the ottoman doubles as extra seating for guests.",
            "The recliner mechanism jams if you don't push the lever exactly right.",
            "Great value bundle, saved money buying the sofa and console together.",
            "Smells strongly of chemicals out of the box, took days to air out.",
            "The bookshelf shelves are not adjustable, which limits how we can use it.",
            "Exactly as pictured and arrived a day early, very pleased overall.",
            "The armrests are a bit too firm and get uncomfortable after long movie nights.",
            "Packaging was excessive but did protect the corners well during shipping.",
        ],
    },
    "Bedroom": {
        "trend_keywords": [
            "platform beds", "storage headboards", "nightstands with charging",
            "velvet upholstered frames", "space-saving dressers", "adjustable bed bases",
        ],
        "product_nouns": [
            "Bed Frame", "Nightstand", "Dresser", "Wardrobe",
            "Vanity", "Bunk Bed", "Bedroom Bench", "Chest of Drawers",
        ],
        "features": [
            "under-bed storage drawers", "built-in LED reading lights", "soft-close drawer slides",
            "adjustable shelf height", "anti-tip wall anchor kit", "hidden cable management",
            "upholstered headboard", "cedar-lined drawers",
        ],
        "reviews": [
            "The storage drawers under the bed frame are a lifesaver for our small bedroom.",
            "Assembly instructions were confusing, especially attaching the headboard.",
            "Drawers are too shallow for folded towels and bulky sweaters.",
            "Beautifully finished, looks much more expensive than the price we paid.",
            "One drawer slide arrived bent and drags every time we open it.",
            "The soft-close feature on the dresser drawers is a wonderful little detail.",
            "Headboard fabric attracts dust and is hard to clean.",
            "Sturdy enough that our kids can climb the bunk bed ladder safely.",
            "Nightstand wobbles because one leg is slightly shorter than the others.",
            "The cedar lining smells amazing and really does seem to keep moths away.",
            "Packaging was damaged and the wardrobe door had a small dent on arrival.",
            "Exactly the mid-century look we wanted, fits our decor perfectly.",
            "Bed frame slats cracked within the first month under normal use.",
            "Great value, comparable quality to brands twice the price.",
            "The vanity mirror arrived without mounting hardware included.",
            "Very easy two-person assembly, took under an hour total.",
            "Drawer runners squeak loudly no matter how much we adjust them.",
            "The LED reading lights built into the headboard are surprisingly bright and useful.",
            "Chest of drawers has a chemical odor that has lingered for weeks.",
            "Perfect size for our guest room, doesn't feel bulky at all.",
            "Anti-tip hardware was missing from the box, had to buy our own.",
            "The finish scratches if you so much as brush a fingernail against it.",
            "Roomy wardrobe, fits both our seasonal clothes with space to spare.",
            "Customer support quickly sent a replacement panel free of charge.",
            "Looks great but arrived with a scratch across the top surface.",
        ],
    },
    "Kitchen": {
        "trend_keywords": [
            "kitchen islands", "counter-height dining", "extendable tables",
            "bar stools with backs", "farmhouse dining sets", "compact breakfast nooks",
        ],
        "product_nouns": [
            "Dining Table", "Kitchen Island", "Bar Stool", "Kitchen Cart",
            "Buffet Cabinet", "Pantry Shelf", "Dining Chair", "Kitchen Cabinet",
        ],
        "features": [
            "extendable leaf mechanism", "built-in wine rack", "locking caster wheels",
            "butcher block top", "stain-resistant laminate", "adjustable shelving",
            "spice rack drawer inserts", "solid beech legs",
        ],
        "reviews": [
            "The extendable leaf makes hosting family dinners so much easier.",
            "Assembly instructions were confusing about which screws go where.",
            "Butcher block top scratches easily even with light cutting on a board.",
            "Sturdy and stylish, gets compliments every time we have guests over.",
            "One of the caster wheels locked up and won't roll smoothly anymore.",
            "Great value for a solid wood table at this price point.",
            "Arrived with a chip in the tabletop corner, requested a partial refund.",
            "The wine rack storage is a nice touch we didn't expect to use so much.",
            "Bar stools are a bit low for our counter height, wish we'd measured first.",
            "Very easy to wipe down, laminate holds up well against spills.",
            "Kitchen island wobbles slightly, we had to shim one leg.",
            "Chairs are more comfortable than expected for the price.",
            "Pantry shelf brackets weren't pre-drilled correctly and needed adjusting.",
            "Looks exactly like the photos, beautiful farmhouse style.",
            "The finish began peeling near the sink area after a few months.",
            "Delivery team was courteous and assembled it right in our kitchen.",
            "Drawer in the buffet cabinet sticks and needs a firm tug to open.",
            "Perfect size for our breakfast nook, doesn't crowd the room.",
            "Missing hardware bag delayed our assembly by a full day.",
            "Solid beech legs feel like they'll hold up for a decade.",
            "The spice rack insert is too shallow for taller bottles.",
            "Excellent packaging, nothing was damaged despite a long shipping distance.",
            "Table surface stains if a wet glass sits too long without a coaster.",
            "Assembly took two people about ninety minutes, more than we expected.",
            "Kitchen cart's locking wheels give us confidence it won't roll away.",
        ],
    },
    "Home Office": {
        "trend_keywords": [
            "standing desks", "ergonomic office chairs", "cable management",
            "compact home offices", "monitor arms", "acoustic privacy panels",
        ],
        "product_nouns": [
            "Office Desk", "Office Chair", "Bookcase", "Filing Cabinet",
            "Monitor Stand", "Desk Organizer", "Standing Desk", "Office Credenza",
        ],
        "features": [
            "electric height adjustment", "built-in cable management tray", "lumbar support",
            "locking file drawers", "adjustable monitor arm", "anti-fatigue design",
            "grommet cord holes", "memory height presets",
        ],
        "reviews": [
            "The electric height adjustment is smooth and whisper quiet during calls.",
            "Assembly instructions were confusing about the motor wiring step.",
            "Lumbar support is too aggressive and hurts after a few hours of use.",
            "Sturdy desk, doesn't wobble even at the highest standing setting.",
            "One of the height memory presets stopped saving after two weeks.",
            "Great value, comparable to desks costing twice as much.",
            "Arrived with a scratch on the desktop surface near the edge.",
            "Cable management tray keeps our cords completely out of sight now.",
            "Chair's armrests are not adjustable enough for our taller team members.",
            "Very easy assembly, took about forty-five minutes solo.",
            "The filing cabinet lock mechanism jammed on the first try.",
            "Comfortable for long workdays, noticeably reduced our back pain.",
            "Bookcase shelves sag slightly when loaded with heavy textbooks.",
            "Looks professional on video calls, exactly the aesthetic we wanted.",
            "The desk motor makes a grinding noise when reaching full height.",
            "Delivery was on time and boxes were well protected.",
            "Casters on the office chair mark up hardwood floors.",
            "Monitor stand is sturdy enough for two large displays without tipping.",
            "Missing an Allen wrench in the hardware kit, had to use our own.",
            "Standing desk surface is spacious enough for dual monitors and a laptop.",
            "The credenza's soft-close doors are a nice premium touch.",
            "Assembly video didn't match the actual parts included in our box.",
            "Chair mesh back is breathable, great for long hot afternoons.",
            "Desk organizer trays are shallower than shown in the listing photos.",
            "Overall excellent purchase, our home office finally feels put together.",
        ],
    },
    "Laundry Room": {
        "trend_keywords": [
            "stackable laundry storage", "space-saving drying racks", "utility carts",
            "laundry sorting systems", "compact folding stations", "over-machine shelving",
        ],
        "product_nouns": [
            "Laundry Hamper", "Utility Cart", "Drying Rack", "Laundry Cabinet",
            "Ironing Station", "Sorting Bin", "Laundry Shelf", "Folding Table",
        ],
        "features": [
            "collapsible frame", "rolling locking casters", "multi-compartment sorting",
            "wall-mounted folding brackets", "moisture-resistant liner", "adjustable drying arms",
            "over-the-machine shelving", "built-in ironing board",
        ],
        "reviews": [
            "The multi-compartment sorting bins have made laundry day so much faster.",
            "Assembly instructions were confusing about which panel attaches first.",
            "Drawers are too shallow for towels, we can barely fit two at a time.",
            "Great value, sturdier than similar carts we've owned before.",
            "One of the caster wheels squeaks loudly when rolling on tile.",
            "Folds flat for storage exactly as advertised, very convenient.",
            "Arrived with a small dent in the frame but still functions fine.",
            "The drying rack arms aren't sturdy enough for heavier wet items like jeans.",
            "Moisture-resistant liner has held up well even with damp towels.",
            "Very easy to assemble, no tools required at all.",
            "The over-machine shelf brackets weren't level out of the box.",
            "Perfect size to fit our narrow laundry closet without crowding it.",
            "Ironing station's board surface is a bit too small for larger shirts.",
            "Excellent packaging, nothing was damaged during shipping.",
            "The rolling cart tips slightly when the top bin is fully loaded.",
            "Love how compact it folds down when we need extra floor space.",
            "Missing a mounting screw, had to make a trip to the hardware store.",
            "Sorting bins are labeled clearly which makes delegating chores easier.",
            "Cabinet doors don't quite align and leave a small gap.",
            "Sturdy enough to hold our detergent jugs without sagging shelves.",
            "The frame feels flimsy compared to what the photos suggested.",
            "Great for small spaces, exactly what our apartment laundry nook needed.",
            "Locking casters give us confidence it won't roll away when loaded.",
            "Fabric liner started fraying at the seams after a month of use.",
            "Overall solid purchase, has genuinely simplified our laundry routine.",
        ],
    },
    "Entryway": {
        "trend_keywords": [
            "mudroom lockers", "entryway benches with storage", "shoe cubbies",
            "wall-mounted coat racks", "console tables with drawers", "boot trays",
        ],
        "product_nouns": [
            "Entryway Bench", "Shoe Rack", "Coat Rack", "Console Table",
            "Umbrella Stand", "Mudroom Locker", "Wall Mirror", "Hall Tree",
        ],
        "features": [
            "built-in shoe cubbies", "flip-down storage seat", "wall-anchor safety strap",
            "hidden cubby storage", "double coat hook rows", "water-resistant tray base",
            "adjustable shelf dividers", "soft-close bench lid",
        ],
        "reviews": [
            "The flip-down bench seat is perfect for putting on shoes each morning.",
            "Assembly instructions were confusing about the hook spacing layout.",
            "Shoe cubbies are too shallow for boots, they stick out awkwardly.",
            "Great value, looks much sturdier than we expected for the price.",
            "One of the coat hooks came loose within the first week.",
            "The wall-anchor strap gives us peace of mind with kids climbing on it.",
            "Arrived with a scratch on the top surface near the corner.",
            "Fits perfectly in our narrow entryway without blocking the door.",
            "Bench lid doesn't stay open on its own, keeps slamming shut.",
            "Very easy assembly, done in under thirty minutes.",
            "The mirror arrived with a small crack in the packaging corner.",
            "Console table drawers stick a little in humid weather.",
            "Love how much shoe storage this gives us compared to our old rack.",
            "Excellent packaging, nothing was damaged during a long shipping route.",
            "Umbrella stand tips over easily when it's not weighted down.",
            "Looks exactly like the listing photos, beautiful farmhouse finish.",
            "Missing two of the mounting screws, had to source our own.",
            "The double coat hook rows fit our whole family's jackets easily.",
            "Storage cubby dividers aren't adjustable, limiting how we organize it.",
            "Sturdy enough for daily use, no wobbling even with kids sitting on it.",
            "The finish scuffs if wet boots are set down without a tray.",
            "Perfect size for our small entryway, doesn't overwhelm the space.",
            "Delivery was fast and arrived two days ahead of schedule.",
            "Hall tree's mirror hardware wasn't included, had to buy separately.",
            "Overall a great addition, our entryway finally feels organized.",
        ],
    },
    "Outdoor": {
        "trend_keywords": [
            "modular patio sofas", "weather-resistant wicker", "fire pit tables",
            "outdoor sectionals", "UV-resistant cushions", "foldable patio furniture",
        ],
        "product_nouns": [
            "Patio Sofa", "Outdoor Dining Set", "Adirondack Chair", "Patio Umbrella",
            "Outdoor Bench", "Hammock", "Fire Pit Table", "Garden Stool",
        ],
        "features": [
            "UV-resistant cushion fabric", "rust-resistant aluminum frame", "weatherproof wicker weave",
            "tilt-and-crank umbrella", "quick-dry foam cushions", "stackable design",
            "propane fire pit insert", "foldable storage frame",
        ],
        "reviews": [
            "The UV-resistant cushions have held their color even after a full summer outside.",
            "Assembly instructions were confusing about which bolts secure the armrests.",
            "Cushions soak up rainwater and take over a day to dry out.",
            "Great value, feels much sturdier than similar sets we've seen in stores.",
            "One of the aluminum legs already shows surface rust after two months.",
            "The tilt-and-crank umbrella mechanism works smoothly and blocks sun well.",
            "Arrived with a tear in the wicker weave near the base.",
            "Perfect size for our patio, doesn't overcrowd the space.",
            "Fire pit table's propane insert was missing a connector hose.",
            "Very easy assembly, we had the whole set up in under an hour.",
            "Cushion covers unzip easily for washing, a really nice detail.",
            "The hammock stand wobbles on uneven ground without extra stakes.",
            "Excellent packaging, everything arrived without a scratch despite heavy boxes.",
            "Wicker weave started fraying at the edges after a few weeks of sun.",
            "Stackable chairs make winter storage so much easier for us.",
            "The frame feels flimsy compared to what the photos suggested.",
            "Looks exactly like the listing, beautiful addition to our backyard.",
            "Umbrella pole is a bit too thin for its base, wobbles in light wind.",
            "Foam cushions dry quickly after rain, exactly as advertised.",
            "Missing an Allen wrench in the hardware kit for assembly.",
            "Garden stool is sturdy enough for adults to sit on comfortably.",
            "The fire pit table gets noticeably hot around the rim, needs a warning label.",
            "Delivery was on time and the crates protected everything well.",
            "Rust-resistant frame claim seems accurate, no spots after a rainy season.",
            "Overall a fantastic purchase, we use the patio set almost every evening now.",
        ],
    },
}

# All 7 supported categories, in a stable order.
SUPPORTED_CATEGORIES = list(CATEGORY_DATA.keys())

# Weighted growth choices: mildly biased toward "Increasing" to reflect a
# generally growing home-furnishing market, but still varied.
_GROWTH_CHOICES = ["Increasing", "Stable", "Decreasing"]
_GROWTH_WEIGHTS = [0.5, 0.35, 0.15]


def _infer_category_name(product_name: str) -> str | None:
    """
    Best-effort reverse lookup: given a product name previously generated
    by get_products() (e.g. "Modern Sectional Sofa"), figure out which
    category it belongs to by matching against each category's distinct
    product-noun vocabulary. Returns None if no match is found.

    This exists because MarketDataProvider.get_reviews() only receives a
    product_name (not a category), per the abstract interface - product
    nouns are deliberately kept distinct across categories so this
    inference is reliable in practice.
    """
    for category_name, data in CATEGORY_DATA.items():
        for noun in data["product_nouns"]:
            if noun.lower() in product_name.lower():
                return category_name
    return None


# Canonical material values (a subset of material_extraction.known_materials())
# sampled for synthetic products, so the material facet filter has something
# to filter on when running fully offline.
_MOCK_MATERIALS = [
    "Solid Wood", "Engineered Wood", "Metal", "Steel", "Fabric", "Velvet",
    "Faux Leather", "Leather", "Glass", "Rattan", "Plastic", "Marble",
]


class MockDataProvider(MarketDataProvider):
    """
    Deterministic, offline MarketDataProvider used when
    settings.DATA_PROVIDER == "mock" (the default).

    No network access; all data is procedurally generated from the
    CATEGORY_DATA vocabulary pools above.
    """

    def get_trend(self, category) -> dict:
        """Generate a deterministic-per-category trend snapshot."""
        rng = random.Random(hash(category.name) % (2**32))
        data = CATEGORY_DATA.get(category.name, next(iter(CATEGORY_DATA.values())))

        trend_score = round(rng.uniform(30, 95), 1)
        growth = rng.choices(_GROWTH_CHOICES, weights=_GROWTH_WEIGHTS, k=1)[0]
        keyword_pool = data["trend_keywords"]
        keywords = rng.sample(keyword_pool, k=min(5, len(keyword_pool)))

        return {"trend_score": trend_score, "growth": growth, "keywords": keywords}

    def get_products(self, category, limit: int = 10) -> list[dict]:
        """Generate `limit` deterministic-per-category mock products."""
        rng = random.Random(hash(category.name) % (2**32))
        data = CATEGORY_DATA.get(category.name, next(iter(CATEGORY_DATA.values())))
        nouns = data["product_nouns"]
        feature_pool = data["features"]

        products = []
        for i in range(limit):
            noun = nouns[i % len(nouns)]
            adjective = rng.choice(ADJECTIVES)
            name = f"{adjective} {noun}"
            price = round(rng.uniform(59.0, 1299.0), 2)
            rating = round(rng.uniform(3.2, 4.9), 1)
            review_count = rng.randint(8, 620)
            features = rng.sample(feature_pool, k=min(4, len(feature_pool)))
            demand_score = round(rng.uniform(20.0, 100.0), 1)
            products.append(
                {
                    "name": name,
                    "price": price,
                    "rating": rating,
                    "review_count": review_count,
                    "features": features,
                    # Sampled from the canonical vocabulary so the material
                    # facet filter is exercisable in offline/mock mode too.
                    "material": rng.sample(_MOCK_MATERIALS, k=rng.randint(1, 2)),
                    # No ASIN/URL: these products do not exist. Emitting a
                    # fabricated Amazon link would render as a real,
                    # clickable, broken link in the UI - absent is honest.
                    "asin": None,
                    "url": None,
                    "demand_score": demand_score,
                }
            )
        return products

    def get_reviews(self, product_name: str, limit: int = 15) -> list[str]:
        """
        Generate deterministic-per-product-name mock reviews, drawn from
        the review bank of the category inferred from the product name
        (falling back to a random category's bank if inference fails).
        """
        rng = random.Random(hash(product_name) % (2**32))
        category_name = _infer_category_name(product_name)
        if category_name is None:
            category_name = rng.choice(SUPPORTED_CATEGORIES)

        pool = CATEGORY_DATA[category_name]["reviews"]
        if limit <= len(pool):
            return rng.sample(pool, k=limit)
        # If more reviews are requested than templates exist, sample with
        # replacement (shuffled) to still return `limit` items.
        return [rng.choice(pool) for _ in range(limit)]
