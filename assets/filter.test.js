import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterRecipes, collectCategories, collectDifficulties, filterSummary,
} from './filter.js';

const RECIPES = [
  {
    slug: 'dip', name: 'Nutty Almond Dip', category: 'Dips', difficulty: 'beginner',
    ingredients: ['1 cup soy milk', '1/2 cup raw almonds'], tags: ['raw'],
  },
  {
    slug: 'soup', name: 'Kale Soup', category: 'Soups', difficulty: 'intermediate',
    ingredients: ['2 cups kale', '1 onion'], tags: ['greens'],
  },
  {
    slug: 'crunch', name: 'Wild Apple Crunch', category: 'Desserts', difficulty: 'beginner',
    ingredients: ['3 apples', '1/4 cup almonds'], tags: [],
  },
];

test('filterRecipes with no criteria returns everything', () => {
  assert.equal(filterRecipes(RECIPES, {}).length, 3);
});

test('filterRecipes matches the recipe name case-insensitively', () => {
  const found = filterRecipes(RECIPES, { query: 'kale' });
  assert.deepEqual(found.map((r) => r.slug), ['soup']);
});

test('filterRecipes matches ingredient text', () => {
  const found = filterRecipes(RECIPES, { query: 'almonds' });
  assert.deepEqual(found.map((r) => r.slug).sort(), ['crunch', 'dip']);
});

test('filterRecipes matches tags', () => {
  assert.deepEqual(filterRecipes(RECIPES, { query: 'greens' }).map((r) => r.slug), ['soup']);
});

test('filterRecipes filters by category and difficulty', () => {
  assert.deepEqual(filterRecipes(RECIPES, { category: 'Dips' }).map((r) => r.slug), ['dip']);
  assert.deepEqual(
    filterRecipes(RECIPES, { difficulty: 'beginner' }).map((r) => r.slug).sort(),
    ['crunch', 'dip'],
  );
});

test('filterRecipes combines criteria as AND', () => {
  const found = filterRecipes(RECIPES, { query: 'almonds', difficulty: 'beginner', category: 'Dips' });
  assert.deepEqual(found.map((r) => r.slug), ['dip']);
});

test('filterRecipes ignores surrounding whitespace and empty strings', () => {
  assert.equal(filterRecipes(RECIPES, { query: '   ' }).length, 3);
  assert.equal(filterRecipes(RECIPES, { category: '' }).length, 3);
});

test('filterRecipes returns an empty array when nothing matches', () => {
  assert.deepEqual(filterRecipes(RECIPES, { query: 'zzzz' }), []);
});

test('filterRecipes tolerates records with missing fields', () => {
  const sparse = [{ slug: 'x', name: 'X' }];
  assert.equal(filterRecipes(sparse, { query: 'x' }).length, 1);
  assert.equal(filterRecipes(sparse, { query: 'nope' }).length, 0);
});

test('collectCategories and collectDifficulties return sorted unique values', () => {
  assert.deepEqual(collectCategories(RECIPES), ['Desserts', 'Dips', 'Soups']);
  assert.deepEqual(collectDifficulties(RECIPES), ['beginner', 'intermediate']);
});

test('filterSummary describes the active filters for print', () => {
  assert.equal(filterSummary({ category: 'Soups' }), 'Soups');
  assert.equal(filterSummary({ difficulty: 'beginner' }), 'beginner');
  assert.equal(filterSummary({ query: 'kale' }), 'matching “kale”');
  assert.equal(
    filterSummary({ category: 'Soups', difficulty: 'beginner', query: ' kale ' }),
    'Soups · beginner · matching “kale”',
  );
});

test('filterSummary is empty when nothing is filtered', () => {
  assert.equal(filterSummary({}), '');
  assert.equal(filterSummary({ query: '   ', category: '', difficulty: '' }), '');
  assert.equal(filterSummary(), '');
});
