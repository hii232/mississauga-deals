'use client';

import { useState, useEffect } from 'react';
import { useAdmin } from '../layout';
import ReactMarkdown from 'react-markdown';

const CATEGORIES = ['Neighbourhood Guide', 'Strategy', 'Guide', 'Market Analysis', 'Platform', 'Beginner Guide', 'General'];

function generateSlug(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function AdminBlogPage() {
  const { adminKey } = useAdmin();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState({ total: 0, published: 0, drafts: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'editor'
  const [editingPost, setEditingPost] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    title: '', slug: '', excerpt: '', content: '', category: 'General', cover_image_url: '', published: false,
  });

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, cover_image_url: data.url }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function fetchPosts() {
    try {
      const res = await fetch('/api/admin/blog', { headers: { 'x-admin-key': adminKey } });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch posts:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (adminKey) fetchPosts(); }, [adminKey]);

  function openEditor(post = null) {
    if (post) {
      setEditingPost(post);
      setForm({
        title: post.title, slug: post.slug, excerpt: post.excerpt || '', content: post.content || '',
        category: post.category || 'General', cover_image_url: post.cover_image_url || '', published: post.published,
      });
    } else {
      setEditingPost(null);
      setForm({ title: '', slug: '', excerpt: '', content: '', category: 'General', cover_image_url: '', published: false });
    }
    setPreviewMode(false);
    setView('editor');
  }

  async function handleSave(publish = null) {
    setSaving(true);
    try {
      const payload = { ...form };
      if (publish !== null) payload.published = publish;
      if (!payload.slug) payload.slug = generateSlug(payload.title);

      const url = editingPost ? `/api/admin/blog?id=${editingPost.id}` : '/api/admin/blog';
      const method = editingPost ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setView('list');
        fetchPosts();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to save');
      }
    } catch (e) {
      alert('Failed to save: ' + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(post) {
    try {
      const res = await fetch(`/api/admin/blog?id=${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ published: !post.published }),
      });
      if (res.ok) fetchPosts();
    } catch (e) {
      console.error(e);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/blog?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchPosts();
      }
    } catch (e) {
      console.error(e);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  // ── Editor View ──────────────────────────────────────
  if (view === 'editor') {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">{editingPost ? 'Edit Post' : 'New Post'}</h1>
          <button onClick={() => setView('list')} className="text-sm text-white/40 hover:text-white">
            Cancel
          </button>
        </div>

        <div className="bg-[#141B2D] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={e => {
                const title = e.target.value;
                setForm(f => ({
                  ...f,
                  title,
                  slug: editingPost ? f.slug : generateSlug(title),
                }));
              }}
              placeholder="Your blog post title"
              className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50"
            />
          </div>

          {/* Slug + Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Slug</label>
              <input
                type="text"
                value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                placeholder="url-friendly-slug"
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Cover Image */}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Cover Image (optional)</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.cover_image_url}
                onChange={e => setForm(f => ({ ...f, cover_image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="flex-1 bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50"
              />
              <label className={`px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploading ? 'bg-white/5 text-white/30' : 'bg-accent/20 text-accent hover:bg-accent/30'}`}>
                {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            {form.cover_image_url && (
              <div className="mt-2 relative inline-block">
                <img src={form.cover_image_url} alt="Cover preview" className="rounded-lg max-h-32 object-cover" />
                <button
                  type="button"
                  onClick={() => setForm(f => ({ ...f, cover_image_url: '' }))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500"
                >×</button>
              </div>
            )}
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))}
              placeholder="Brief summary shown on the blog listing page"
              rows={2}
              className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 resize-none"
            />
          </div>

          {/* Content — Write/Preview tabs */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-white/40">Content (Markdown)</label>
              <div className="flex gap-1">
                <button
                  onClick={() => setPreviewMode(false)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${!previewMode ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Write
                </button>
                <button
                  onClick={() => setPreviewMode(true)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${previewMode ? 'bg-accent text-white' : 'text-white/40 hover:text-white'}`}
                >
                  Preview
                </button>
              </div>
            </div>

            {previewMode ? (
              <div className="bg-white rounded-xl px-6 py-4 min-h-[300px] prose-sm">
                <ReactMarkdown
                  components={{
                    h1: ({children}) => <h1 className="text-2xl font-bold text-gray-900 mb-4 mt-6">{children}</h1>,
                    h2: ({children}) => <h2 className="text-xl font-bold text-gray-900 mb-3 mt-5">{children}</h2>,
                    h3: ({children}) => <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">{children}</h3>,
                    p: ({children}) => <p className="text-gray-600 leading-relaxed mb-4">{children}</p>,
                    a: ({href, children}) => <a href={href} className="text-blue-600 hover:underline">{children}</a>,
                    ul: ({children}) => <ul className="list-disc pl-6 mb-4 text-gray-600 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-6 mb-4 text-gray-600 space-y-1">{children}</ol>,
                    li: ({children}) => <li className="leading-relaxed">{children}</li>,
                    blockquote: ({children}) => <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-500 my-4">{children}</blockquote>,
                    img: ({src, alt}) => <img src={src} alt={alt} className="rounded-xl my-4 max-w-full" />,
                    code: ({children}) => <code className="bg-gray-100 rounded px-1.5 py-0.5 text-sm font-mono">{children}</code>,
                    strong: ({children}) => <strong className="font-bold text-gray-900">{children}</strong>,
                  }}
                >
                  {form.content || '*Start writing to see preview...*'}
                </ReactMarkdown>
              </div>
            ) : (
              <>
                <textarea
                  value={form.content}
                  onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                  placeholder="Write your blog post in Markdown..."
                  rows={20}
                  className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50 resize-y font-mono leading-relaxed"
                />
                <p className="text-[10px] text-white/20 mt-1">
                  **bold** &nbsp; *italic* &nbsp; ## Heading &nbsp; [link](url) &nbsp; ![image](url) &nbsp; - list &nbsp; &gt; quote
                </p>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <button
              onClick={() => handleSave(false)}
              disabled={saving || !form.title}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-white/5 text-white/70 hover:bg-white/10 border border-white/10 disabled:opacity-30 transition-colors"
            >
              {saving ? 'Saving...' : 'Save Draft'}
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saving || !form.title}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white disabled:opacity-30 transition-colors"
            >
              {saving ? 'Publishing...' : editingPost?.published ? 'Update' : 'Publish'}
            </button>
            <div className="flex-1" />
            <button onClick={() => setView('list')} className="text-sm text-white/30 hover:text-white">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Blog Posts</h1>
        <button
          onClick={() => openEditor()}
          className="bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors"
        >
          + New Post
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Published', value: stats.published, color: 'text-green-400' },
          { label: 'Drafts', value: stats.drafts, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Posts List */}
      {posts.length === 0 ? (
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-2xl p-12 text-center">
          <p className="text-white/30 text-sm mb-4">No blog posts yet</p>
          <button onClick={() => openEditor()} className="bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl">
            Write Your First Post
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      post.published
                        ? 'bg-green-400/10 text-green-400 border-green-400/20'
                        : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    }`}>
                      {post.published ? 'Published' : 'Draft'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/20">
                      {post.category}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-white truncate">{post.title}</h3>
                  {post.excerpt && (
                    <p className="text-xs text-white/30 mt-0.5 line-clamp-1">{post.excerpt}</p>
                  )}
                  <p className="text-[10px] text-white/20 mt-1">
                    {new Date(post.created_at).toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {post.slug && <span className="ml-2 font-mono">/blog/{post.slug}</span>}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditor(post)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 border border-white/[0.06]"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleTogglePublish(post)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      post.published
                        ? 'text-amber-400/70 hover:text-amber-400 border-amber-400/20 hover:bg-amber-400/5'
                        : 'text-green-400/70 hover:text-green-400 border-green-400/20 hover:bg-green-400/5'
                    }`}
                  >
                    {post.published ? 'Unpublish' : 'Publish'}
                  </button>
                  {deleteConfirm === post.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium text-white/30"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(post.id)}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-red-400/50 hover:text-red-400 hover:bg-red-400/5 border border-white/[0.06]"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
