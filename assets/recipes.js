import {
  filterRecipes, collectCategories, collectDifficulties, filterSummary,
} from './filter.js';

const els = {
  count: document.getElementById('count'),
  filters: document.getElementById('filters'),
  q: document.getElementById('q'),
  category: document.getElementById('category'),
  difficulty: document.getElementById('difficulty'),
  expandAll: document.getElementById('expand-all'),
  print: document.getElementById('print'),
  status: document.getElementById('status'),
  grid: document.getElementById('grid'),
};

let all = [];

function escape(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function option(value, label) {
  const el = document.createElement('option');
  el.value = value;
  el.textContent = label;
  return el;
}

function meta(recipe) {
  const bits = [];
  if (recipe.category) bits.push(recipe.category);
  if (recipe.serves) bits.push(`serves ${recipe.serves}`);
  if (recipe.prepTime) bits.push(`${recipe.prepTime} min prep`);
  if (recipe.cookTime) bits.push(`${recipe.cookTime} min cook`);
  if (recipe.difficulty) bits.push(recipe.difficulty);
  return bits.join(' · ');
}

function paragraphs(value) {
  return String(value ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<p>${escape(line)}</p>`)
    .join('');
}

function nutritionTable(nutrition) {
  if (!nutrition) return '';
  const rows = (nutrition.rows ?? [])
    .map((r) => `<tr${r.sub ? ' class="is-sub"' : ''}><th>${escape(r.label)}</th>`
      + `<td>${escape(r.amount)}</td><td>${escape(r.dv ?? '')}</td></tr>`)
    .join('');
  const perServing = nutrition.servingsPerRecipe
    ? `, about ${nutrition.servingsPerRecipe} servings per recipe`
    : '';
  const calories = nutrition.calories == null ? '' : `<p class="calories">
      <strong>${nutrition.calories}</strong> calories per serving${
    nutrition.caloriesFromFat == null ? '' : `, ${nutrition.caloriesFromFat} from fat`
  }${perServing}</p>`;
  return `<div class="nutrition"><h4>Nutrition Facts</h4>${calories}
    <table><tbody>${rows}</tbody></table></div>`;
}

// Nine recipes have no photo of their own. The site itself reused this one as a generic,
// so it stands in rather than an empty tile. Presentation only: recipes.json still records
// image: null, which is the truth about what was archived.
const PLACEHOLDER = 'assets/placeholder.jpg';
const PLACEHOLDER_THUMB = 'images/thumbs/_placeholder.jpg';

function card(recipe) {
  // Two tiers. The card shows an 84px slot, so it gets a 192px thumbnail: full-size files
  // averaged 80 KB for that slot, and 15.2 MB across the archive. The full image lives in
  // the collapsed body, where lazy loading leaves it unfetched until the card opens, and
  // print uses it at 2.5in where a thumbnail would be visibly soft.
  //
  // Generic stand-ins carry no alt text: they do not depict the dish.
  const thumbSrc = recipe.thumb ?? (recipe.image ?? PLACEHOLDER_THUMB);
  const isGeneric = !recipe.image;
  const thumb = `<img class="photo${isGeneric ? ' photo--generic' : ''}"
         src="${escape(thumbSrc)}" alt="${isGeneric ? '' : escape(recipe.name)}"
         width="192" height="192" loading="lazy" decoding="async" fetchpriority="low">`;
  const fullSrc = recipe.image ?? PLACEHOLDER;
  const full = `<img class="photo-full${isGeneric ? ' photo--generic' : ''}"
         src="${escape(fullSrc)}" alt="" width="460" height="460" loading="lazy">`;

  const extras = [
    recipe.notes ? `<h4>Notes</h4>${paragraphs(recipe.notes)}` : '',
    recipe.prepInstructions ? `<h4>Preparation</h4>${paragraphs(recipe.prepInstructions)}` : '',
    recipe.storageInstructions ? `<h4>Storage</h4>${paragraphs(recipe.storageInstructions)}` : '',
  ].join('');

  const directions = (recipe.instructions ?? []).length
    ? `<h4>Directions</h4><ol>${recipe.instructions.map((s) => `<li>${escape(s)}</li>`).join('')}</ol>`
    : '';

  const article = document.createElement('article');
  article.className = 'recipe';
  article.id = `r-${recipe.slug}`;
  article.innerHTML = `
    <button class="recipe__toggle" type="button" aria-expanded="false">
      ${thumb}
      <span class="recipe__heading">
        <span class="recipe__name">${escape(recipe.name)}</span>
        <span class="recipe__meta">${escape(meta(recipe))}</span>
      </span>
    </button>
    <div class="recipe__body" hidden>
      ${full}
      ${recipe.description ? `<p class="recipe__desc">${escape(recipe.description)}</p>` : ''}
      <div class="recipe__cols">
        <div>
          <h4>Ingredients</h4>
          <ul>${(recipe.ingredients ?? []).map((i) => `<li>${escape(i)}</li>`).join('')}</ul>
        </div>
        <div>
          ${directions}
          ${extras}
        </div>
      </div>
      ${nutritionTable(recipe.nutrition)}
    </div>`;

  const toggle = article.querySelector('.recipe__toggle');
  const body = article.querySelector('.recipe__body');
  toggle.addEventListener('click', () => {
    setOpen(article, body.hidden);
    syncExpandAll();
  });

  return article;
}

function setOpen(article, open) {
  article.querySelector('.recipe__body').hidden = !open;
  article.querySelector('.recipe__toggle').setAttribute('aria-expanded', String(open));
  article.classList.toggle('is-open', open);
}

function cards() {
  return [...els.grid.querySelectorAll('.recipe')];
}

function setAll(open) {
  for (const article of cards()) setOpen(article, open);
}

// One button for both directions, labelled by what it will do next.
function syncExpandAll() {
  const anyClosed = cards().some((a) => a.querySelector('.recipe__body').hidden);
  els.expandAll.textContent = anyClosed ? 'Expand all' : 'Collapse all';
}

// Resolves once every image has loaded, or on timeout: a slow connection should delay the
// print dialog, not withhold it.
function waitForImages(images, timeoutMs) {
  const pending = [...images].filter((img) => !img.complete);
  if (pending.length === 0) return Promise.resolve();
  return Promise.race([
    Promise.all(pending.map((img) => new Promise((resolve) => {
      img.loading = 'eager';
      img.addEventListener('load', resolve, { once: true });
      img.addEventListener('error', resolve, { once: true });
    }))),
    new Promise((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

function render() {
  const criteria = {
    query: els.q.value,
    category: els.category.value,
    difficulty: els.difficulty.value,
  };
  const found = filterRecipes(all, criteria);

  els.grid.replaceChildren(...found.map(card));

  // The heading count is the one that prints, so it has to describe what is on the page.
  const summary = filterSummary(criteria);
  if (found.length === all.length) {
    els.count.textContent = `${all.length} recipes`;
  } else {
    els.count.textContent = `${found.length} of ${all.length} recipes`
      + (summary ? ` · ${summary}` : '');
  }

  els.status.textContent = found.length ? '' : 'No recipes match those filters.';

  // New cards render collapsed, so the button label has to follow.
  syncExpandAll();
}

async function start() {
  try {
    const response = await fetch('data/recipes.json');
    if (!response.ok) throw new Error(`recipes.json responded ${response.status}`);
    const archive = await response.json();
    all = archive.recipes ?? [];

    for (const value of collectCategories(all)) els.category.append(option(value, value));
    for (const value of collectDifficulties(all)) els.difficulty.append(option(value, value));
    els.filters.hidden = false;

    els.q.addEventListener('input', render);
    els.category.addEventListener('change', render);
    els.difficulty.addEventListener('change', render);
    els.expandAll.addEventListener('click', () => {
      const anyClosed = cards().some((a) => a.querySelector('.recipe__body').hidden);
      setAll(anyClosed);
      syncExpandAll();
    });
    // Prints whatever the filters currently show, every card opened. The full-size images
    // are lazy and only start loading once a body is revealed, so printing has to wait for
    // them or the sheets come out with blank frames.
    els.print.addEventListener('click', async () => {
      setAll(true);
      syncExpandAll();
      els.print.disabled = true;
      const label = els.print.textContent;
      els.print.textContent = 'Preparing…';
      try {
        await waitForImages(els.grid.querySelectorAll('.photo-full'), 15000);
      } finally {
        els.print.disabled = false;
        els.print.textContent = label;
      }
      window.print();
    });

    // Also covers Ctrl+P and the browser menu: printing must capture every recipe, not
    // only the ones a reader happened to open.
    window.addEventListener('beforeprint', () => {
      setAll(true);
      syncExpandAll();
    });

    render();
  } catch (error) {
    els.count.textContent = 'The recipe archive could not be loaded.';
    els.status.innerHTML =
      'Something went wrong loading the recipes. Please try again later, or write to '
      + '<a href="mailto:info@healthyfoodnow.com">info@healthyfoodnow.com</a>.';
    console.error(error);
  }
}

start();
