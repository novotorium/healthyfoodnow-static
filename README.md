# healthyfoodnow.com

Static archive of Healthy Food Now, which said goodbye in 2026.

- `index.html` — the farewell page, also served as `404.html` for every retired URL
- `recipes.html` — the recipe archive: 203 recipes, client-side search, prints as a cookbook
- `data/recipes.json` — exported from the production database and site before shutdown
- `images/recipes/` — 194 recipe photographs

No build step, no dependencies, no JavaScript beyond two small ES modules. Edit the files,
commit, push; GitHub Pages serves the repository root.

Tests: `node --test assets/`

## Where the data came from

`recipes.json` holds the 203 recipes that were public (`status = 0`), merged from two
sources: the production database for the text fields, and the rendered pages for ingredient
quantities and nutrition labels, which the application computed at request time and never
stored. The export tooling that produced it lives in the archived application repository
under `tools/export/`.

Nine recipes have no photograph of their own and show a generic one. One recipe,
`orange-crush-smoothie`, has no directions, which is how it was published.
