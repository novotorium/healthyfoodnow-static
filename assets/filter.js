// Pure filtering logic, shared by the page and its unit tests.
export function filterRecipes(recipes, { query = '', category = '', difficulty = '' } = {}) {
  const needle = query.trim().toLowerCase();
  const wantCategory = category.trim();
  const wantDifficulty = difficulty.trim();

  return recipes.filter((recipe) => {
    if (wantCategory && recipe.category !== wantCategory) return false;
    if (wantDifficulty && recipe.difficulty !== wantDifficulty) return false;
    if (!needle) return true;

    const haystack = [
      recipe.name ?? '',
      recipe.description ?? '',
      ...(recipe.ingredients ?? []),
      ...(recipe.tags ?? []),
    ].join(' ').toLowerCase();

    return haystack.includes(needle);
  });
}

export function collectCategories(recipes) {
  return unique(recipes.map((r) => r.category));
}

export function collectDifficulties(recipes) {
  return unique(recipes.map((r) => r.difficulty));
}

function unique(values) {
  return [...new Set(values.filter(Boolean))].sort();
}

// Describes the active filters, so a printed subset says what it is rather than leaving a
// reader to guess why 12 of 203 recipes came out.
export function filterSummary({ query = '', category = '', difficulty = '' } = {}) {
  const parts = [];
  if (category.trim()) parts.push(category.trim());
  if (difficulty.trim()) parts.push(difficulty.trim());
  if (query.trim()) parts.push(`matching “${query.trim()}”`);
  return parts.join(' · ');
}
