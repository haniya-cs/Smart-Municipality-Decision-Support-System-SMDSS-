/**
 * Map AI suggested_category text (from Gemini) to categories.category_id.
 * Matches DB category names, including bilingual rows like "Other (أخرى)".
 */

const normalize = (s) =>
  String(s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/** Fallback when DB names differ from the AI prompt wording */
const PROMPT_LABEL_TO_ID = {
  "roads & potholes": 1,
  "water issues": 2,
  "sewage & drainage": 3,
  "electricity problems": 4,
  "traffic problems": 5,
  "illegal construction": 6,
  other: 7
};

async function resolveCategoryIdFromAiLabel(queryAsync, aiLabel, fallbackCategoryId) {
  const label = (aiLabel || "").trim();
  if (!label) return fallbackCategoryId;

  const rows = await queryAsync("SELECT category_id, name FROM categories");
  const target = normalize(label);

  const byPrompt = PROMPT_LABEL_TO_ID[target];
  if (byPrompt !== undefined) {
    const exists = rows.some((r) => Number(r.category_id) === byPrompt);
    if (exists) return byPrompt;
  }

  for (const row of rows) {
    const base = normalize(String(row.name || "").split("(")[0].trim());
    if (base === target) return Number(row.category_id);
  }

  return fallbackCategoryId;
}

module.exports = { resolveCategoryIdFromAiLabel, normalize };
