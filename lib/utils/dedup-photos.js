/**
 * Deduplicate AMPRE photo URLs that are the same image at different resolutions.
 * AMPRE returns each photo in ~5 variants (240, 960, 1920, 3840, default).
 * We keep only the best resolution per unique base image.
 */
export function deduplicatePhotos(urls) {
  if (!urls?.length) return [];

  const groups = {};

  for (const url of urls) {
    // Extract the base64-encoded image path (last segment before .jpg)
    // Pattern: https://trreb-image.ampre.ca/[hash]/[params]/[base64path].jpg
    const match = url.match(/\/([A-Za-z0-9+/_=-]+\.jpe?g)$/i);
    const key = match ? match[1] : url;

    if (!groups[key]) groups[key] = [];
    groups[key].push(url);
  }

  const result = [];
  for (const key of Object.keys(groups)) {
    const variants = groups[key];
    // Prefer largest non-3840 watermarked version (1920 > 960 > default > 240)
    // 3840 is unwatermarked original — use it only if no watermarked version exists
    const scored = variants.map((u) => {
      const sizeMatch = u.match(/rs:fit:(\d+)/);
      const size = sizeMatch ? parseInt(sizeMatch[1]) : 500;
      return { url: u, size };
    });
    // Sort by size descending, pick the best one (ideally 1920 or 960)
    scored.sort((a, b) => b.size - a.size);
    // Pick second-largest if largest is 3840 and alternatives exist
    const pick = scored.length > 1 && scored[0].size >= 3840 ? scored[1] : scored[0];
    result.push(pick.url);
  }

  return result;
}
