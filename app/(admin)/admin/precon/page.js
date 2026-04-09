'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../layout';

const CITIES = [
  'Mississauga', 'Toronto', 'Brampton', 'Vaughan', 'Oakville',
  'Markham', 'Richmond Hill', 'Hamilton', 'Burlington', 'Milton', 'Halton Hills',
];

const TYPES = ['Condo', 'Townhome', 'Mixed'];
const STATUSES = ['Selling', 'Coming Soon'];

function formatPrice(p) {
  if (!p) return '—';
  if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
  return `$${Math.round(p / 1000)}K`;
}

export default function AdminPreconPage() {
  const { adminKey } = useAdmin();
  const [projects, setProjects] = useState([]);
  const [stats, setStats] = useState({ total: 0, selling: 0, comingSoon: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState('list');
  const [editingProject, setEditingProject] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filterCity, setFilterCity] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [seeding, setSeeding] = useState(false);

  const [form, setForm] = useState({
    name: '', developer: '', city: 'Mississauga', area: '', type: 'Condo',
    storeys: '', units: '', price_from: '', status: 'Selling', completion: '',
    image_url: '', featured: false,
  });

  async function fetchProjects() {
    try {
      const res = await fetch('/api/admin/precon', { headers: { 'x-admin-key': adminKey } });
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects);
        setStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { if (adminKey) fetchProjects(); }, [adminKey]);

  // Filtered list
  const filtered = useMemo(() => {
    return projects.filter(p => {
      if (filterCity !== 'All' && p.city !== filterCity) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return p.name.toLowerCase().includes(q) || p.developer.toLowerCase().includes(q) || p.area.toLowerCase().includes(q);
      }
      return true;
    });
  }, [projects, filterCity, searchQuery]);

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/admin/upload?bucket=precon-images', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      setForm(f => ({ ...f, image_url: data.url }));
    } catch (err) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  function openEditor(project = null) {
    if (project) {
      setEditingProject(project);
      setForm({
        name: project.name,
        developer: project.developer || '',
        city: project.city,
        area: project.area || '',
        type: project.type || 'Condo',
        storeys: project.storeys || '',
        units: project.units || '',
        price_from: project.price_from || '',
        status: project.status || 'Selling',
        completion: project.completion || '',
        image_url: project.image_url || '',
        featured: project.featured || false,
      });
    } else {
      setEditingProject(null);
      setForm({
        name: '', developer: '', city: 'Mississauga', area: '', type: 'Condo',
        storeys: '', units: '', price_from: '', status: 'Selling', completion: '',
        image_url: '', featured: false,
      });
    }
    setView('editor');
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...form,
        storeys: form.storeys ? parseInt(form.storeys) : null,
        units: form.units ? parseInt(form.units) : null,
        price_from: form.price_from ? parseInt(form.price_from) : null,
      };

      const url = editingProject ? `/api/admin/precon?id=${editingProject.id}` : '/api/admin/precon';
      const method = editingProject ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setView('list');
        fetchProjects();
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

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/admin/precon?id=${id}`, {
        method: 'DELETE',
        headers: { 'x-admin-key': adminKey },
      });
      if (res.ok) {
        setDeleteConfirm(null);
        fetchProjects();
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function handleToggleStatus(project) {
    try {
      const newStatus = project.status === 'Selling' ? 'Coming Soon' : 'Selling';
      const res = await fetch(`/api/admin/precon?id=${project.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchProjects();
    } catch (e) {
      console.error(e);
    }
  }

  // Seed existing hardcoded projects into Supabase
  async function seedProjects() {
    if (!confirm('This will import all hardcoded projects into the database. Continue?')) return;
    setSeeding(true);
    try {
      const res = await fetch('/api/admin/precon/seed', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Seeded ${data.count} projects successfully!`);
        fetchProjects();
      } else {
        alert(data.error || 'Seed failed');
      }
    } catch (e) {
      alert('Seed failed: ' + e.message);
    } finally {
      setSeeding(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
        </div>
        {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  // ── Editor View ──────────────────────────────────────
  if (view === 'editor') {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-white">{editingProject ? 'Edit Project' : 'New Project'}</h1>
          <button onClick={() => setView('list')} className="text-sm text-white/40 hover:text-white">Cancel</button>
        </div>

        <div className="bg-[#141B2D] border border-white/[0.06] rounded-2xl p-6 space-y-5">
          {/* Name & Developer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Project Name *</label>
              <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. M6 Condos" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Developer</label>
              <input type="text" value={form.developer} onChange={e => setForm(f => ({ ...f, developer: e.target.value }))}
                placeholder="e.g. Rogers Real Estate" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* City & Area */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">City *</label>
              <select value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50">
                {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Area / Neighbourhood</label>
              <input type="text" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))}
                placeholder="e.g. City Centre" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Type, Status, Completion */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}
                className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-accent/50">
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Completion</label>
              <input type="text" value={form.completion} onChange={e => setForm(f => ({ ...f, completion: e.target.value }))}
                placeholder="2027 or TBD" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Storeys, Units, Price From */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Storeys</label>
              <input type="number" value={form.storeys} onChange={e => setForm(f => ({ ...f, storeys: e.target.value }))}
                placeholder="e.g. 40" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Total Units</label>
              <input type="number" value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))}
                placeholder="e.g. 600" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
            <div>
              <label className="block text-xs font-medium text-white/40 mb-1.5">Starting Price ($)</label>
              <input type="number" value={form.price_from} onChange={e => setForm(f => ({ ...f, price_from: e.target.value }))}
                placeholder="e.g. 499900" className="w-full bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
            </div>
          </div>

          {/* Project Image */}
          <div>
            <label className="block text-xs font-medium text-white/40 mb-1.5">Project Image</label>
            <div className="flex gap-2">
              <input type="text" value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                placeholder="https://... or upload" className="flex-1 bg-[#0B1120] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
              <label className={`px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors ${uploading ? 'bg-white/5 text-white/30' : 'bg-accent/20 text-accent hover:bg-accent/30'}`}>
                {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="hidden" />
              </label>
            </div>
            {form.image_url && (
              <div className="mt-2 relative inline-block">
                <img src={form.image_url} alt="Project preview" className="rounded-lg max-h-40 object-cover" />
                <button type="button" onClick={() => setForm(f => ({ ...f, image_url: '' }))}
                  className="absolute top-1 right-1 w-6 h-6 bg-black/70 rounded-full text-white text-xs flex items-center justify-center hover:bg-red-500">
                  x
                </button>
              </div>
            )}
          </div>

          {/* Featured checkbox */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.featured} onChange={e => setForm(f => ({ ...f, featured: e.target.checked }))}
              className="rounded border-white/20 bg-[#0B1120] text-accent focus:ring-accent/50" />
            <span className="text-sm text-white/60">Featured project (show at top)</span>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/[0.06]">
            <button onClick={handleSave} disabled={saving || !form.name || !form.city}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-accent hover:bg-accent-dark text-white disabled:opacity-30 transition-colors">
              {saving ? 'Saving...' : editingProject ? 'Update Project' : 'Add Project'}
            </button>
            <button onClick={() => setView('list')} className="text-sm text-white/30 hover:text-white">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // ── List View ────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-white">Pre-Construction Projects</h1>
        <div className="flex gap-2">
          {projects.length === 0 && (
            <button onClick={seedProjects} disabled={seeding}
              className="bg-amber-500/20 text-amber-400 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors hover:bg-amber-500/30 disabled:opacity-50">
              {seeding ? 'Seeding...' : 'Import Existing Data'}
            </button>
          )}
          <button onClick={() => openEditor()}
            className="bg-accent hover:bg-accent-dark text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors">
            + New Project
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, color: 'text-white' },
          { label: 'Selling', value: stats.selling, color: 'text-green-400' },
          { label: 'Coming Soon', value: stats.comingSoon, color: 'text-amber-400' },
        ].map(s => (
          <div key={s.label} className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/30 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <input type="text" placeholder="Search projects..." value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#141B2D] border border-white/[0.06] rounded-xl px-4 py-2.5 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-accent/50" />
        </div>
        <select value={filterCity} onChange={e => setFilterCity(e.target.value)}
          className="bg-[#141B2D] border border-white/[0.06] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-accent/50">
          <option value="All">All Cities</option>
          {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <p className="text-xs text-white/20 mb-3">{filtered.length} project{filtered.length !== 1 ? 's' : ''}</p>

      {/* Projects List */}
      {filtered.length === 0 ? (
        <div className="bg-[#141B2D] border border-white/[0.06] rounded-2xl p-12 text-center">
          <p className="text-white/30 text-sm mb-4">{projects.length === 0 ? 'No projects yet — import existing data or add your first project' : 'No projects match your filters'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => (
            <div key={project.id} className="bg-[#141B2D] border border-white/[0.06] rounded-xl p-4 hover:border-white/10 transition-colors">
              <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-16 h-16 rounded-lg bg-[#0B1120] flex-shrink-0 overflow-hidden">
                  {project.image_url ? (
                    <img src={project.image_url} alt={project.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 text-2xl">🏗️</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      project.status === 'Selling'
                        ? 'bg-green-400/10 text-green-400 border-green-400/20'
                        : 'bg-amber-400/10 text-amber-400 border-amber-400/20'
                    }`}>
                      {project.status}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-accent/10 text-accent border-accent/20">
                      {project.type}
                    </span>
                    {project.featured && (
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border bg-gold/10 text-gold border-gold/20">
                        Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-white truncate">{project.name}</h3>
                  <p className="text-xs text-white/30 truncate">
                    {project.developer} · {project.city} — {project.area}
                    {project.price_from ? ` · From ${formatPrice(project.price_from)}` : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => openEditor(project)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white hover:bg-white/5 border border-white/[0.06]">
                    Edit
                  </button>
                  <button onClick={() => handleToggleStatus(project)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                      project.status === 'Selling'
                        ? 'text-amber-400/70 hover:text-amber-400 border-amber-400/20 hover:bg-amber-400/5'
                        : 'text-green-400/70 hover:text-green-400 border-green-400/20 hover:bg-green-400/5'
                    }`}>
                    {project.status === 'Selling' ? 'Pause' : 'Activate'}
                  </button>
                  {deleteConfirm === project.id ? (
                    <div className="flex items-center gap-1">
                      <button onClick={() => handleDelete(project.id)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20">
                        Confirm
                      </button>
                      <button onClick={() => setDeleteConfirm(null)}
                        className="px-2 py-1.5 rounded-lg text-xs font-medium text-white/30">
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setDeleteConfirm(project.id)}
                      className="px-2 py-1.5 rounded-lg text-xs font-medium text-red-400/50 hover:text-red-400 hover:bg-red-400/5 border border-white/[0.06]">
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
