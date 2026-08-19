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
