export const NEEDS_CATEGORIES = [
    "housing",
    "rent",
    "mortgage",
    "utilities",
    "electricity",
    "water",
    "gas",
    "internet",
    "phone",
    "groceries",
    "food", // generic food often ends up here, but dining out is want. optimizing for "Groceries" usually.
    "transport",
    "transportation",
    "fuel",
    "public transport",
    "health",
    "medical",
    "healthcare",
    "insurance",
    "education",
    "tuition",
    "bills",
    "emi",
    "loan",
];

export const isNeed = (categoryName: string, parentCategoryName?: string): boolean => {
    const normCat = categoryName?.toLowerCase() || "";
    const normParent = parentCategoryName?.toLowerCase() || "";

    // Check explicit "Dining" or "Entertainment" to exclude from needs even if they match fuzzy terms
    if (
        normCat.includes("dining") ||
        normCat.includes("restaurant") ||
        normCat.includes("entertainment") ||
        normCat.includes("shopping") ||
        normCat.includes("vacation") ||
        normCat.includes("trip") ||
        normParent.includes("entertainment") ||
        normParent.includes("shopping")
    ) {
        return false;
    }

    return (
        NEEDS_CATEGORIES.some((c) => normCat.includes(c)) ||
        NEEDS_CATEGORIES.some((c) => normParent.includes(c))
    );
};
