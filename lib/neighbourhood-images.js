// Real neighbourhood photos, when available. Drop a file at
// /public/images/neighbourhoods/<slug>.jpg and add its slug below — the card
// automatically swaps the illustrated scene for the photo. Until then the card
// renders the original NeighbourhoodScene artwork (photo-ready by design).
//
// slug = name.toLowerCase().replace(/\s+/g, '-')  (e.g. "Port Credit" -> "port-credit")
// Only list slugs whose image file actually exists, or the card will 404.

export const NEIGHBOURHOOD_PHOTOS = {
  // 'port-credit': '/images/neighbourhoods/port-credit.jpg',
  // 'city-centre': '/images/neighbourhoods/city-centre.jpg',
};

export function neighbourhoodPhoto(name) {
  const slug = (name || '').toLowerCase().replace(/\s+/g, '-');
  return NEIGHBOURHOOD_PHOTOS[slug] || null;
}
