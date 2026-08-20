/**
 * Static UI-chrome translation dictionaries.
 *
 * IMPORTANT: These dictionaries only ever hold strings that are authored by
 * this frontend (headings, labels, buttons, empty states, etc). Anything
 * rendered directly from a backend API response (category names/descriptions,
 * product names/features, review text, AI-generated report content, ...)
 * must NEVER be looked up here — render API data exactly as returned.
 *
 * Keys are namespaced by feature area, e.g. "dashboard.title". Every key that
 * exists in `en` must also exist in `zh` (enforced in dev via a console.warn
 * fallback in `useLanguage`'s `t()` helper — see LanguageContext.tsx).
 */

import { GrowthTrend } from "@/lib/types/trend";

export type Locale = "en" | "zh";

export const dictionaries: Record<Locale, Record<string, string>> = {
  en: {
    // ---- App shell / Sidebar ----
    "app.brand": "Furniture Insight AI",
    "app.footer": "Furniture Market Insight AI · MVP",

    // ---- Sidebar nav ----
    "nav.dashboard": "Dashboard",
    "nav.categories": "Categories",
    "nav.marketAnalysis": "Market Analysis",
    "nav.productRanking": "Product Ranking",
    "nav.reviewInsight": "Review Insight",
    "nav.aiRecommendation": "AI Recommendation",
    "nav.settings": "Settings",

    // ---- TopBar ----
    "topbar.home": "Home",
    "topbar.detail": "Detail",

    // ---- Dashboard page ----
    "dashboard.title": "Dashboard",
    "dashboard.description":
      "High-level snapshot of tracked furniture categories and generated reports.",
    "dashboard.errorTitle": "Couldn't load the dashboard",
    "dashboard.errorFallback": "Failed to load dashboard summary.",
    "dashboard.emptyTitle": "No dashboard data yet",
    "dashboard.emptyDescription":
      "Run the backend seed script to populate categories and reports.",
    "dashboard.statCategories": "Tracked Categories",
    "dashboard.statCategoriesHint": "Furniture segments monitored",
    "dashboard.statReports": "Opportunity Reports",
    "dashboard.statReportsHint": "AI-generated so far",
    "dashboard.statTopCategory": "Top Trending Category",
    "dashboard.scoreLabel": "Score",
    "dashboard.statTopCategoryHintNone": "No trend data yet",
    "dashboard.trendingCategoriesHeading": "Trending Categories",
    "dashboard.trendingEmptyTitle": "No trending categories yet",
    "dashboard.trendingEmptyDescription":
      "Trend data will appear here once the backend has computed category trend scores.",

    // ---- Categories (explorer) page ----
    "categories.title": "Categories",
    "categories.description":
      "Browse every furniture market segment tracked by the insight engine.",
    "categories.errorTitle": "Couldn't load categories",
    "categories.errorFallback": "Failed to load categories.",
    "categories.emptyTitle": "No categories yet",
    "categories.emptyDescription":
      "Run the backend seed script to populate furniture categories.",

    // ---- Category detail page ----
    "categoryDetail.heading": "Category",
    "categoryDetail.errorTitle": "Couldn't load this category",
    "categoryDetail.errorFallback": "Failed to load this category.",
    "categoryDetail.notFoundTitle": "Category not found",
    "categoryDetail.notFoundDescription":
      "This category may have been removed, or the backend has no matching record.",
    "categoryDetail.keywordsHeading": "Keywords",
    "categoryDetail.viewMarketAnalysis": "View Market Analysis",
    "categoryDetail.viewProductRanking": "View Product Ranking",

    // ---- Market Analysis page ----
    "marketAnalysis.title": "Market Analysis",
    "marketAnalysis.description":
      "Inspect trend score, growth direction, and top keywords for a category.",
    "marketAnalysis.categoryLabel": "Category",
    "marketAnalysis.categoriesErrorTitle": "Couldn't load categories",
    "marketAnalysis.categoriesErrorFallback": "Failed to load categories.",
    "marketAnalysis.noCategoriesTitle": "No categories yet",
    "marketAnalysis.noCategoriesDescription": "Run the backend seed script first.",
    "marketAnalysis.trendErrorTitle": "Couldn't load market trend",
    "marketAnalysis.trendErrorFallback": "Failed to load trend data.",
    "marketAnalysis.topKeywordsHeading": "Top Keywords",
    "marketAnalysis.selectCategoryTitle": "Select a category",
    "marketAnalysis.selectCategoryDescription":
      "Choose a category above to see its trend data.",

    // ---- Market widgets (GrowthBadge / TrendScoreGauge / KeywordCloud) ----
    "market.trendScoreLabel": "Trend Score",
    "market.keywordCloudEmpty": "No keywords available",

    // ---- Category widgets ----
    "categoryKeywordChips.none": "No keywords",

    // ---- Product Ranking page ----
    "products.title": "Product Ranking",
    "products.description":
      "Products ranked by whitespace opportunity score, with current demand for context.",
    "products.filterLabel": "Filter by category",
    "products.allCategories": "All categories",
    "products.categoriesErrorFallback": "Failed to load categories.",
    "products.errorTitle": "Couldn't load products",
    "products.errorFallback": "Failed to load products.",
    "products.columnProduct": "Product",
    "products.columnPrice": "Price",
    "products.columnRating": "Rating",
    "products.columnReviews": "Reviews",
    "products.columnDemand": "Demand",
    "products.columnOpportunity": "Opportunity",
    "products.emptyTitle": "No products found",
    "products.emptyDescription":
      "Try a different category filter, or make sure the backend has product data seeded.",
    "products.noMatchTitle": "No products match your filters",
    "products.noMatchDescription":
      "Try widening the price range, lowering the minimum rating, or clearing a material filter.",
    "products.clearFiltersButton": "Clear filters",
    "products.priceRangeLabel": "Price range",
    "products.priceMinPlaceholder": "Min",
    "products.priceMaxPlaceholder": "Max",
    "products.minRatingLabel": "Minimum rating",
    "products.minRatingAny": "Any",
    "products.materialLabel": "Material",
    "products.materialEmpty": "No material data available",
    "products.facetsErrorFallback": "Failed to load filter options.",
    "products.scoreExplainerTitle": "How these scores are calculated",
    "products.scoreExplainerDismiss": "Dismiss",
    "products.scoreExplainerRatingHeading": "Rating",
    "products.scoreExplainerRatingBody":
      "The product's real Amazon star rating (0-5), shown exactly as reported.",
    "products.scoreExplainerDemandHeading": "Demand score",
    "products.scoreExplainerDemandBody":
      "Derived from the real review count on a log scale: log10(review_count+1) / log10(5001) × 100, capped to 0-100. Review counts are extremely right-skewed — a handful of bestsellers have thousands of reviews while most products have very few — so a log scale keeps the score meaningful across that whole range instead of letting a few outliers dominate.",
    "products.scoreExplainerOpportunityHeading": "Opportunity score",
    "products.scoreExplainerOpportunityBody":
      "0.35 × (rating/5 × 100) + 0.40 × demand score + 0.25 × category trend score. Demand is weighted highest because raw demand is the strongest signal that a market gap is worth pursuing, with rating and trend acting as confirming signals.",
    "products.scoreBreakdownToggleLabel": "Show score calculation",
    "products.scoreBreakdownDemandHeading": "Demand calculation",
    "products.scoreBreakdownOpportunityHeading": "Opportunity calculation",

    // ---- Review Insight page ----
    "reviews.title": "Review Insight",
    "reviews.description":
      "Paste customer reviews to surface sentiment and specific product pain points.",
    "reviews.formLabel": "Paste customer reviews (one per line)",
    "reviews.placeholder":
      "The chair is comfortable but the lumbar support wears out after 6 months.\nGreat assembly instructions, arrived quickly.\nToo expensive for the material quality.",
    "reviews.detectedSingular": "review detected",
    "reviews.detectedPlural": "reviews detected",
    "reviews.analyzeButton": "Analyze Reviews",
    "reviews.analysisFailedTitle": "Analysis failed",
    "reviews.analysisFailedFallback": "Failed to analyze reviews.",
    "reviews.noAnalysisTitle": "No analysis yet",
    "reviews.noAnalysisDescription":
      "Paste one or more reviews above and click Analyze Reviews to get started.",
    "reviews.usersLoveHeading": "Users Love",
    "reviews.painPointsHeading": "Pain Points",
    "reviews.noPositives": "No standout positives detected.",
    "reviews.noNegatives": "No notable complaints detected.",
    "reviews.specificPainPointsHeading": "Specific Pain Points",
    "reviews.noPainPointsTitle": "No specific pain points identified",
    "reviews.noPainPointsDescription":
      "The analysis did not surface granular pain points from the submitted reviews.",

    // ---- AI Recommendation page ----
    "recommendations.title": "AI Recommendation",
    "recommendations.description":
      "Generate AI-backed product opportunity reports for a category and review past reports.",
    "recommendations.generateButton": "Generate Report",
    "recommendations.categoryLabel": "Category",
    "recommendations.noCategoriesOption": "No categories available",
    "recommendations.categoriesErrorFallback": "Failed to load categories.",
    "recommendations.generationFailedTitle": "Generation failed",
    "recommendations.generationFailedFallback":
      "Failed to generate a new opportunity report.",
    "recommendations.pastReportsHeading": "Past Reports",
    "recommendations.reportsErrorTitle": "Couldn't load reports",
    "recommendations.reportsErrorFallback": "Failed to load past reports.",
    "recommendations.noReportsTitle": "No reports yet",
    "recommendations.noReportsDescription":
      "Click Generate Report to create the first AI opportunity report for this category.",
    "recommendations.reportDetailHeading": "Report Detail",
    "recommendations.noReportSelectedTitle": "No report selected",
    "recommendations.noReportSelectedDescription":
      "Select or generate a report to view its detail.",
    "recommendations.targetLabel": "Target:",
    "recommendations.generatedPrefix": "Generated",
    "recommendations.targetCustomerLabel": "Target customer:",
    "recommendations.recommendedSolutionHeading": "Recommended Solution",
    "recommendations.painPointsAddressedHeading": "Pain Points Addressed",
    "recommendations.proposedFeaturesHeading": "Proposed Features",
    "recommendations.sellingPointsHeading": "Selling Points",
    "recommendations.noneRecorded": "None recorded.",
    "recommendations.sourceProductsHeading": "Source Products",
    "recommendations.externalLinkLabel": "Opens in a new tab",

    // ---- Settings page ----
    "settings.title": "Settings",
    "settings.description": "Manage your workspace preferences.",
    "settings.languageSectionDescription":
      "Choose the display language for the interface.",
    "settings.optionEnglish": "English",
    "settings.optionChinese": "中文",
    "settings.moreSettingsTitle": "More settings coming soon",
    "settings.moreSettingsDescription":
      "Additional configuration options will appear here in a future release.",
  },
  zh: {
    // ---- App shell / Sidebar ----
    "app.brand": "家具市场洞察 AI",
    "app.footer": "家具市场洞察 AI · MVP 版本",

    // ---- Sidebar nav ----
    "nav.dashboard": "仪表盘",
    "nav.categories": "品类浏览",
    "nav.marketAnalysis": "市场分析",
    "nav.productRanking": "产品排名",
    "nav.reviewInsight": "评论洞察",
    "nav.aiRecommendation": "AI 推荐",
    "nav.settings": "设置",

    // ---- TopBar ----
    "topbar.home": "首页",
    "topbar.detail": "详情",

    // ---- Dashboard page ----
    "dashboard.title": "仪表盘",
    "dashboard.description": "已跟踪家具品类与已生成报告的整体概览。",
    "dashboard.errorTitle": "仪表盘加载失败",
    "dashboard.errorFallback": "加载仪表盘摘要失败。",
    "dashboard.emptyTitle": "暂无仪表盘数据",
    "dashboard.emptyDescription": "请运行后端种子脚本以填充品类与报告数据。",
    "dashboard.statCategories": "已跟踪品类数",
    "dashboard.statCategoriesHint": "正在监测的家具细分市场",
    "dashboard.statReports": "机会报告数",
    "dashboard.statReportsHint": "AI 已生成的报告总数",
    "dashboard.statTopCategory": "热度最高品类",
    "dashboard.scoreLabel": "得分",
    "dashboard.statTopCategoryHintNone": "暂无趋势数据",
    "dashboard.trendingCategoriesHeading": "热门品类",
    "dashboard.trendingEmptyTitle": "暂无热门品类",
    "dashboard.trendingEmptyDescription":
      "后端完成品类趋势得分计算后,趋势数据将显示在此处。",

    // ---- Categories (explorer) page ----
    "categories.title": "品类浏览",
    "categories.description": "浏览洞察引擎跟踪的所有家具细分市场。",
    "categories.errorTitle": "品类加载失败",
    "categories.errorFallback": "加载品类失败。",
    "categories.emptyTitle": "暂无品类",
    "categories.emptyDescription": "请运行后端种子脚本以填充家具品类数据。",

    // ---- Category detail page ----
    "categoryDetail.heading": "品类",
    "categoryDetail.errorTitle": "该品类加载失败",
    "categoryDetail.errorFallback": "加载该品类失败。",
    "categoryDetail.notFoundTitle": "未找到该品类",
    "categoryDetail.notFoundDescription": "该品类可能已被移除,或后端没有匹配的记录。",
    "categoryDetail.keywordsHeading": "关键词",
    "categoryDetail.viewMarketAnalysis": "查看市场分析",
    "categoryDetail.viewProductRanking": "查看产品排名",

    // ---- Market Analysis page ----
    "marketAnalysis.title": "市场分析",
    "marketAnalysis.description": "查看某一品类的趋势得分、增长方向及热门关键词。",
    "marketAnalysis.categoryLabel": "品类",
    "marketAnalysis.categoriesErrorTitle": "品类加载失败",
    "marketAnalysis.categoriesErrorFallback": "加载品类失败。",
    "marketAnalysis.noCategoriesTitle": "暂无品类",
    "marketAnalysis.noCategoriesDescription": "请先运行后端种子脚本。",
    "marketAnalysis.trendErrorTitle": "市场趋势加载失败",
    "marketAnalysis.trendErrorFallback": "加载趋势数据失败。",
    "marketAnalysis.topKeywordsHeading": "热门关键词",
    "marketAnalysis.selectCategoryTitle": "请选择一个品类",
    "marketAnalysis.selectCategoryDescription": "在上方选择一个品类以查看其趋势数据。",

    // ---- Market widgets (GrowthBadge / TrendScoreGauge / KeywordCloud) ----
    "market.trendScoreLabel": "趋势得分",
    "market.keywordCloudEmpty": "暂无可用关键词",

    // ---- Category widgets ----
    "categoryKeywordChips.none": "暂无关键词",

    // ---- Product Ranking page ----
    "products.title": "产品排名",
    "products.description": "按空白机会得分对产品排序,并结合当前需求作为参考。",
    "products.filterLabel": "按品类筛选",
    "products.allCategories": "所有品类",
    "products.categoriesErrorFallback": "加载品类失败。",
    "products.errorTitle": "产品加载失败",
    "products.errorFallback": "加载产品失败。",
    "products.columnProduct": "产品",
    "products.columnPrice": "价格",
    "products.columnRating": "评分",
    "products.columnReviews": "评论数",
    "products.columnDemand": "需求度",
    "products.columnOpportunity": "机会得分",
    "products.emptyTitle": "未找到产品",
    "products.emptyDescription": "请尝试更换品类筛选条件,或确认后端已导入产品数据。",
    "products.noMatchTitle": "没有符合筛选条件的产品",
    "products.noMatchDescription": "请尝试放宽价格区间、降低最低评分要求,或取消部分材质筛选。",
    "products.clearFiltersButton": "清除筛选",
    "products.priceRangeLabel": "价格区间",
    "products.priceMinPlaceholder": "最低",
    "products.priceMaxPlaceholder": "最高",
    "products.minRatingLabel": "最低评分",
    "products.minRatingAny": "不限",
    "products.materialLabel": "材质",
    "products.materialEmpty": "暂无材质数据",
    "products.facetsErrorFallback": "加载筛选选项失败。",
    "products.scoreExplainerTitle": "这些得分是如何计算的",
    "products.scoreExplainerDismiss": "关闭",
    "products.scoreExplainerRatingHeading": "评分",
    "products.scoreExplainerRatingBody": "产品在亚马逊上的真实星级评分(0-5 分),按原始数据展示。",
    "products.scoreExplainerDemandHeading": "需求度",
    "products.scoreExplainerDemandBody":
      "根据真实评论数量按对数尺度计算得出:log10(评论数+1) / log10(5001) × 100,并截断在 0-100 之间。评论数量分布极不均衡——少数爆款商品有数千条评论,而大多数商品评论很少——因此采用对数尺度可以让得分在整个区间内都保持有意义,避免个别极端值主导结果。",
    "products.scoreExplainerOpportunityHeading": "机会得分",
    "products.scoreExplainerOpportunityBody":
      "0.35 × (评分/5 × 100) + 0.40 × 需求度 + 0.25 × 品类趋势得分。需求度权重最高,因为原始需求是判断某个市场空白是否值得进入的最强信号,评分与趋势则作为辅助确认信号。",
    "products.scoreBreakdownToggleLabel": "查看计算过程",
    "products.scoreBreakdownDemandHeading": "需求度计算方式",
    "products.scoreBreakdownOpportunityHeading": "机会得分计算方式",

    // ---- Review Insight page ----
    "reviews.title": "评论洞察",
    "reviews.description": "粘贴客户评论以提取情感倾向与具体产品痛点。",
    "reviews.formLabel": "粘贴客户评论(每行一条)",
    "reviews.placeholder":
      "这款椅子很舒适,但腰部支撑用了 6 个月后就变松了。\n组装说明很清晰,到货也很快。\n价格偏高,和用料品质不太匹配。",
    "reviews.detectedSingular": "条评论",
    "reviews.detectedPlural": "条评论",
    "reviews.analyzeButton": "分析评论",
    "reviews.analysisFailedTitle": "分析失败",
    "reviews.analysisFailedFallback": "分析评论失败。",
    "reviews.noAnalysisTitle": "暂无分析结果",
    "reviews.noAnalysisDescription": "在上方粘贴一条或多条评论,然后点击“分析评论”开始。",
    "reviews.usersLoveHeading": "用户喜爱点",
    "reviews.painPointsHeading": "用户痛点",
    "reviews.noPositives": "未检测到突出的正面评价。",
    "reviews.noNegatives": "未检测到明显的负面评价。",
    "reviews.specificPainPointsHeading": "具体痛点",
    "reviews.noPainPointsTitle": "未识别出具体痛点",
    "reviews.noPainPointsDescription": "本次分析未从提交的评论中提取出细粒度的痛点。",

    // ---- AI Recommendation page ----
    "recommendations.title": "AI 推荐",
    "recommendations.description":
      "为某一品类生成 AI 驱动的产品机会报告,并查看历史报告。",
    "recommendations.generateButton": "生成报告",
    "recommendations.categoryLabel": "品类",
    "recommendations.noCategoriesOption": "暂无可用品类",
    "recommendations.categoriesErrorFallback": "加载品类失败。",
    "recommendations.generationFailedTitle": "生成失败",
    "recommendations.generationFailedFallback": "生成新的机会报告失败。",
    "recommendations.pastReportsHeading": "历史报告",
    "recommendations.reportsErrorTitle": "报告加载失败",
    "recommendations.reportsErrorFallback": "加载历史报告失败。",
    "recommendations.noReportsTitle": "暂无报告",
    "recommendations.noReportsDescription":
      "点击“生成报告”以创建该品类的首个 AI 机会报告。",
    "recommendations.reportDetailHeading": "报告详情",
    "recommendations.noReportSelectedTitle": "尚未选择报告",
    "recommendations.noReportSelectedDescription": "选择或生成一份报告以查看其详情。",
    "recommendations.targetLabel": "目标客户:",
    "recommendations.generatedPrefix": "生成于",
    "recommendations.targetCustomerLabel": "目标客户:",
    "recommendations.recommendedSolutionHeading": "推荐方案",
    "recommendations.painPointsAddressedHeading": "解决的痛点",
    "recommendations.proposedFeaturesHeading": "建议功能",
    "recommendations.sellingPointsHeading": "卖点",
    "recommendations.noneRecorded": "暂无记录。",
    "recommendations.sourceProductsHeading": "参考商品",
    "recommendations.externalLinkLabel": "在新标签页打开",

    // ---- Settings page ----
    "settings.title": "设置",
    "settings.description": "管理您的工作区偏好设置。",
    "settings.languageSectionDescription": "选择界面的显示语言。",
    "settings.optionEnglish": "English",
    "settings.optionChinese": "中文",
    "settings.moreSettingsTitle": "更多设置即将上线",
    "settings.moreSettingsDescription": "后续版本将在此处提供更多配置选项。",
  },
};

/**
 * Growth-trend enum values ("Increasing" | "Stable" | "Decreasing") are
 * *data* returned by the backend, not UI chrome — but they are surfaced as a
 * translated badge label. Keeping this mapping separate from `dictionaries`
 * makes clear it's a display-only translation of a fixed enum, not a
 * translation of arbitrary user/API text.
 */
const GROWTH_LABELS: Record<Locale, Record<GrowthTrend, string>> = {
  en: {
    Increasing: "Increasing",
    Stable: "Stable",
    Decreasing: "Decreasing",
  },
  zh: {
    Increasing: "增长中",
    Stable: "平稳",
    Decreasing: "下降中",
  },
};

/** Translates a backend growth-trend enum value into a display label. */
export function translateGrowth(growth: GrowthTrend, locale: Locale): string {
  return GROWTH_LABELS[locale][growth] ?? growth;
}

/**
 * The 7 furniture category names are a fixed, app-authored enum coming from
 * the backend (seeded fixtures) — not arbitrary API text — so they get a
 * display-only translation here, the same way GROWTH_LABELS handles the
 * growth-trend enum above. Unknown/future category names fall back to the
 * raw English name rather than crashing.
 */
const CATEGORY_NAME_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    "Living Room": "Living Room",
    Bedroom: "Bedroom",
    Kitchen: "Kitchen",
    "Home Office": "Home Office",
    "Laundry Room": "Laundry Room",
    Entryway: "Entryway",
    Outdoor: "Outdoor",
  },
  zh: {
    "Living Room": "客厅",
    Bedroom: "卧室",
    Kitchen: "厨房",
    "Home Office": "家庭办公室",
    "Laundry Room": "洗衣房",
    Entryway: "玄关",
    Outdoor: "户外",
  },
};

/** Translates a backend category name (one of the 7 seeded segments) for display. */
export function translateCategory(name: string, locale: Locale): string {
  return CATEGORY_NAME_LABELS[locale][name] ?? name;
}

/**
 * Full category descriptions, keyed by the stable category NAME (not by
 * matching the long English description text). The `en` copies mirror the
 * backend's seeded fixture text exactly; `zh` copies are natural,
 * professionally-written translations. Unknown category names fall back to
 * whatever raw description string the API actually returned, so a future
 * backend-added category still renders something reasonable.
 */
const CATEGORY_DESCRIPTION_LABELS: Record<Locale, Record<string, string>> = {
  en: {
    "Living Room":
      "Furniture for shared social and relaxation spaces, including seating, storage, and media furniture such as sofas, sectionals, coffee tables, and TV consoles.",
    Bedroom:
      "Furniture for sleep and personal storage, including bed frames, dressers, nightstands, wardrobes, and vanities.",
    Kitchen:
      "Furniture for dining, food prep, and kitchen storage, including dining tables, kitchen islands, bar stools, and buffet cabinets.",
    "Home Office":
      "Furniture for remote and hybrid work setups, including desks, ergonomic office chairs, bookcases, and filing cabinets.",
    "Laundry Room":
      "Furniture and organizational systems for washing, drying, and folding laundry, including hampers, utility carts, drying racks, and folding stations.",
    Entryway:
      "Furniture for entry and mudroom spaces, including benches, shoe racks, coat racks, and console tables that manage the daily flow in and out of the home.",
    Outdoor:
      "Weather-resistant furniture for patios, decks, and gardens, including outdoor sofas, dining sets, fire pit tables, and lounge seating.",
  },
  zh: {
    "Living Room":
      "为共享社交与休闲空间打造的家具,涵盖沙发、组合沙发、茶几及电视柜等座椅、收纳与影音家具。",
    Bedroom: "为睡眠与个人收纳打造的家具,涵盖床架、梳妆台、床头柜、衣柜及化妆台。",
    Kitchen: "为用餐、备餐与厨房收纳打造的家具,涵盖餐桌、厨房岛台、吧台凳及餐具柜。",
    "Home Office": "为远程与混合办公场景打造的家具,涵盖办公桌、人体工学办公椅、书柜及文件柜。",
    "Laundry Room":
      "用于洗衣、烘干与叠衣的家具与收纳系统,涵盖洗衣篮、多功能推车、晾衣架及叠衣台。",
    Entryway:
      "为入户与玄关空间打造的家具,涵盖玄关凳、鞋架、衣帽架及玄关柜,方便管理日常进出动线。",
    Outdoor: "适用于露台、庭院与花园的耐候家具,涵盖户外沙发、餐桌套装、火坑桌及休闲座椅。",
  },
};

/** Translates a category's description text, keyed by the category's stable name. */
export function translateCategoryDescription(
  name: string,
  locale: Locale,
  fallback?: string
): string {
  return CATEGORY_DESCRIPTION_LABELS[locale][name] ?? fallback ?? CATEGORY_DESCRIPTION_LABELS.en[name] ?? name;
}

/**
 * The ~35 category keyword phrases are app-authored fixture data (5-6 per
 * category, e.g. "bed frames", "coffee tables") — not arbitrary API text —
 * so each fixed phrase gets a full translation here. Lookup is
 * case-insensitive; an unrecognized phrase falls back to the raw English text.
 */
const CATEGORY_KEYWORD_LABELS: Record<string, string> = {
  sofas: "沙发",
  sectionals: "组合沙发",
  "coffee tables": "茶几",
  "media consoles": "电视柜",
  "accent chairs": "单人休闲椅",
  "bed frames": "床架",
  dressers: "梳妆台",
  nightstands: "床头柜",
  wardrobes: "衣柜",
  "mattress storage": "床垫收纳",
  "dining tables": "餐桌",
  "kitchen islands": "厨房岛台",
  "bar stools": "吧台凳",
  "buffet cabinets": "餐具柜",
  "dining chairs": "餐椅",
  "standing desks": "站立办公桌",
  "office chairs": "办公椅",
  bookcases: "书柜",
  "filing cabinets": "文件柜",
  "monitor stands": "显示器支架",
  "laundry hampers": "洗衣篮",
  "utility carts": "多功能推车",
  "drying racks": "晾衣架",
  "sorting bins": "分类收纳箱",
  "folding tables": "叠衣台",
  "entryway benches": "玄关凳",
  "shoe racks": "鞋架",
  "coat racks": "衣帽架",
  "console tables": "玄关桌",
  "mudroom lockers": "玄关储物柜",
  "patio sofas": "露台沙发",
  "outdoor dining sets": "户外餐桌套装",
  "fire pit tables": "火坑桌",
  "adirondack chairs": "阿迪朗达克椅",
  "outdoor cushions": "户外坐垫",
};

/** Translates one of the fixed category-keyword phrases (case-insensitive lookup). */
export function translateCategoryKeyword(keyword: string, locale: Locale): string {
  if (locale === "en") return keyword;
  return CATEGORY_KEYWORD_LABELS[keyword.trim().toLowerCase()] ?? keyword;
}

/**
 * Canonical material values returned by the backend (`Product.material[]`).
 * These are a bounded, backend-defined vocabulary, so each gets a fixed
 * translation. Unknown values fall back to the raw English value.
 */
const MATERIAL_LABELS: Record<string, string> = {
  wood: "木质",
  metal: "金属",
  fabric: "布艺",
  leather: "皮革",
  rattan: "藤条",
  wicker: "藤编",
  glass: "玻璃",
  plastic: "塑料",
  marble: "大理石",
  velvet: "绒面",
  chenille: "雪尼尔",
  bamboo: "竹制",
  steel: "钢材",
  upholstered: "软包",
  "engineered wood": "复合木",
  "faux leather": "仿皮",
  mesh: "网布",
  acrylic: "亚克力",
  rubber: "橡胶",
  concrete: "混凝土",
  // The remaining canonical values emitted by the backend's
  // material_extraction.known_materials(). Keep this map in sync with that
  // list - anything missing here renders as raw English in Chinese mode
  // (observed with Corduroy / Aluminum / Linen / Solid Wood before these
  // were added).
  "solid wood": "实木",
  corduroy: "灯芯绒",
  boucle: "羊羔绒",
  linen: "亚麻",
  aluminum: "铝合金",
  iron: "铁艺",
  resin: "树脂",
};

/** Translates a canonical material value (case-insensitive lookup); falls back to the raw value. */
export function translateMaterial(value: string, locale: Locale): string {
  if (locale === "en") return value;
  return MATERIAL_LABELS[value.trim().toLowerCase()] ?? value;
}

/**
 * Market-trend keywords are mined from real Amazon product titles, so they
 * are a bounded-but-open-ended English furniture vocabulary rather than a
 * fixed enum. Per product decision, `zh` locale renders "中文 (English)" —
 * Chinese for readability, English preserved because it's the actual
 * searchable marketplace term. A word missing from this map still renders
 * (English alone) rather than an empty string.
 */
const KEYWORD_VOCABULARY: Record<string, string> = {
  room: "房间",
  living: "客厅",
  sofa: "沙发",
  couch: "沙发",
  sectional: "组合沙发",
  loveseat: "双人沙发",
  chair: "椅子",
  armchair: "扶手椅",
  recliner: "躺椅",
  ottoman: "脚凳",
  bench: "长凳",
  stool: "凳子",
  barstool: "吧台凳",
  storage: "收纳",
  dresser: "梳妆台",
  drawers: "抽屉",
  drawer: "抽屉",
  fabric: "布艺",
  cabinet: "柜子",
  kitchen: "厨房",
  pantry: "食品柜",
  coffee: "咖啡桌",
  desk: "书桌",
  file: "文件",
  office: "办公室",
  home: "家居",
  hamper: "洗衣篮",
  laundry: "洗衣",
  white: "白色",
  black: "黑色",
  gray: "灰色",
  grey: "灰色",
  brown: "棕色",
  beige: "米色",
  shoe: "鞋",
  entryway: "玄关",
  table: "桌子",
  rack: "架子",
  patio: "露台",
  outdoor: "户外",
  furniture: "家具",
  conversation: "交谈式",
  wicker: "藤编",
  bedroom: "卧室",
  mattress: "床垫",
  headboard: "床头板",
  frame: "床架",
  nightstand: "床头柜",
  wardrobe: "衣柜",
  vanity: "化妆台",
  bookcase: "书柜",
  bookshelf: "书架",
  shelf: "搁架",
  shelving: "置物架",
  mirror: "镜子",
  bed: "床",
  chest: "箱柜",
  trunk: "储物箱",
  filing: "文件柜",
  console: "玄关桌",
  media: "影音",
  tv: "电视",
  entertainment: "娱乐",
  end: "边桌",
  side: "边桌",
  accent: "装饰",
  basket: "篮子",
  cart: "推车",
  bin: "收纳箱",
  dining: "餐饮",
  counter: "台面",
  island: "岛台",
  stand: "支架",
  cushion: "坐垫",
  cushions: "坐垫",
  pillow: "枕头",
  leather: "皮革",
  wood: "木质",
  wooden: "木制",
  metal: "金属",
  steel: "钢材",
  glass: "玻璃",
  rattan: "藤条",
  bamboo: "竹制",
  velvet: "绒面",
  upholstered: "软包",
  modern: "现代",
  rustic: "复古",
  farmhouse: "乡村风",
  adjustable: "可调节",
  folding: "折叠",
  stackable: "可叠放",
  portable: "便携",
  set: "套装",
  sets: "套装",
  decor: "装饰",
  coat: "外套",
  hook: "挂钩",
  umbrella: "遮阳伞",
  fire: "火",
  pit: "火坑",
  adirondack: "阿迪朗达克",
  sling: "吊带",
  chaise: "躺椅",
  mudroom: "玄关储物间",
  sorting: "分类",
};

/**
 * Translates a single market-trend keyword. `en` locale returns the word
 * unchanged; `zh` locale renders "中文 (English)" when the word is in the
 * furniture vocabulary map, otherwise falls back to the English word alone
 * (never an empty string).
 */
export function translateKeyword(word: string, locale: Locale): string {
  if (locale === "en") return word;
  const zh = KEYWORD_VOCABULARY[word.trim().toLowerCase()];
  return zh ? `${zh} (${word})` : word;
}
