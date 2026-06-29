import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCMS } from '../../context/CMSContext';
import {
  Plus, FileText, Eye, EyeOff, Edit3, Trash2, Globe,
  Search, Filter, Clock, CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react';

export default function CMSManager() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);
  const navigate = useNavigate();
  const { refreshPages } = useCMS();

  const fetchPages = async () => {
    try {
      const res = await axios.get('/api/cms');
      setPages(res.data.pages || []);
    } catch (err) {
      toast.error('Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPages(); }, []);

  const togglePublish = async (page) => {
    try {
      await axios.patch(`/api/cms/${page._id}/publish`, { isPublished: !page.isPublished });
      toast.success(page.isPublished ? 'Page unpublished' : 'Page published');
      setPages(prev => prev.map(p => p._id === page._id ? { ...p, isPublished: !p.isPublished } : p));
      refreshPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update page');
    }
  };

  const deletePage = async (id) => {
    if (!window.confirm('Delete this page permanently?')) return;
    setDeleting(id);
    try {
      await axios.delete(`/api/cms/${id}`);
      toast.success('Page deleted');
      setPages(prev => prev.filter(p => p._id !== id));
      refreshPages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete page');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = pages.filter(p => {
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase()) || p.slug.includes(search.toLowerCase());
    const matchFilter = filter === 'all' || (filter === 'published' && p.isPublished) || (filter === 'draft' && !p.isPublished);
    return matchSearch && matchFilter;
  });

  const publishedCount = pages.filter(p => p.isPublished).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">CMS Pages</h1>
          <p className="text-gray-400 text-sm mt-0.5">{pages.length} total · {publishedCount} published</p>
        </div>
        <Link to="/admin/cms/new" className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors">
          <Plus className="h-4 w-4" /> New Page
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search pages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500"
          />
        </div>
        <div className="flex gap-1 bg-gray-900 border border-gray-700 rounded-lg p-1">
          {[['all', 'All'], ['published', 'Published'], ['draft', 'Drafts']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => setFilter(val)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${filter === val ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Pages grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-gray-900 border border-gray-800 rounded-xl">
          <FileText className="h-12 w-12 text-gray-700 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-1">{search ? 'No results found' : 'No pages yet'}</h3>
          <p className="text-gray-500 text-sm mb-4">
            {search ? 'Try a different search term' : 'Create your first CMS page to get started'}
          </p>
          {!search && (
            <Link to="/admin/cms/new" className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors">
              <Plus className="h-4 w-4" /> Create Page
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((page) => (
            <div key={page._id} className="bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-600 transition-colors group">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${page.isPublished ? 'bg-emerald-900/50 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
                    {page.isPublished ? <CheckCircle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {page.isPublished ? 'Published' : 'Draft'}
                  </div>
                  {page.showInNav && (
                    <span className="text-xs bg-blue-900/50 text-blue-400 px-2 py-1 rounded-full flex items-center gap-1">
                      <Globe className="h-3 w-3" /> In Nav
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-white truncate">{page.title}</h3>
                <p className="text-xs text-gray-500 mt-1 truncate">/p/{page.slug}</p>
                <p className="text-xs text-gray-600 mt-2">
                  {page.content?.length || 0} block{page.content?.length !== 1 ? 's' : ''} · {page.template || 'default'} template
                </p>
              </div>
              <div className="border-t border-gray-800 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link to={`/admin/cms/${page._id}`} className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800">
                    <Edit3 className="h-3.5 w-3.5" /> Edit
                  </Link>
                  {page.isPublished && (
                    <Link to={`/p/${page.slug}`} target="_blank" className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 transition-colors px-2 py-1 rounded hover:bg-gray-800">
                      <ExternalLink className="h-3.5 w-3.5" /> View
                    </Link>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePublish(page)}
                    className="p-1.5 rounded hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                    title={page.isPublished ? 'Unpublish' : 'Publish'}
                  >
                    {page.isPublished ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                  <button
                    onClick={() => deletePage(page._id)}
                    disabled={deleting === page._id}
                    className="p-1.5 rounded hover:bg-red-900/30 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
