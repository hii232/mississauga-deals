// Every blog post gets a cover: the stored photo when one exists, otherwise a
// branded generated cover from /api/blog-cover. Use for cards, heroes, and OG.
export function blogCoverUrl(post, absolute = false) {
  if (post?.cover_image_url) return post.cover_image_url;
  const base = absolute ? 'https://www.mississaugainvestor.ca' : '';
  const params = new URLSearchParams();
  params.set('title', post?.title || 'Mississauga Real Estate');
  if (post?.category) params.set('category', post.category);
  return `${base}/api/blog-cover?${params.toString()}`;
}
