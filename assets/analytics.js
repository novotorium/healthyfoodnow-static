// Google Analytics 4, the only tracking on this site.
//
// The measurement id lives here and nowhere else, so there is exactly one line to change
// across the three pages that load this file: index.html, recipes.html and 404.html.
//
// The old property, UA-34580263-1, is NOT usable. Google shut Universal Analytics down in
// July 2023 and it collects nothing. This needs a GA4 property, whose id looks like
// G-XXXXXXXXXX rather than UA-XXXXXXXX-X.
// Stream "Healthy Food Now - GA4", stream id 5877846371.
const GA_ID = 'G-8R9C8MJHNV';

// Until a real id is filled in, do nothing at all rather than request a script that 404s and
// leave a broken tag on a farewell page. Deploying with the placeholder is harmless.
if (/^G-[A-Z0-9]{6,}$/.test(GA_ID) && GA_ID !== 'G-XXXXXXXXXX') {
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.append(tag);

  window.dataLayer = window.dataLayer || [];
  // gtag has to push `arguments` itself, so this cannot be a rest-parameter arrow.
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  gtag('js', new Date());
  gtag('config', GA_ID);

  // The 404 catches roughly 480 retired recipe and blog URLs. Recording which ones people
  // still arrive at is the most useful thing this site can learn, and a plain pageview does
  // not distinguish them from the farewell page, since 404.html renders the same content.
  if (document.body.dataset.page === '404') {
    gtag('event', 'retired_url', { page_path: location.pathname + location.search });
  }
} else {
  console.info('Analytics disabled: set GA_ID in assets/analytics.js to a GA4 measurement id.');
}
