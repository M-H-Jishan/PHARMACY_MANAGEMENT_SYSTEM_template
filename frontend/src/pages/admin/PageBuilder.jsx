import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCMS } from '../../context/CMSContext';
import {
  Save, Eye, EyeOff, ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Settings, Type, Image, Layout, Grid, HelpCircle, Users, Star, Phone,
  Code, Minus, Zap, GripVertical, X, Check
} from 'lucide-react';

const BLOCK_TYPES = [
  { type: 'hero', label: 'Hero Banner', icon: Layout, desc: 'Full-width hero with title, subtitle & CTA' },
  { type: 'text', label: 'Text Block', icon: Type, desc: 'Heading + rich text content' },
  { type: 'features', label: 'Features Grid', icon: Grid, desc: 'Grid of feature cards with icons' },
  { type: 'stats', label: 'Stats Bar', icon: Zap, desc: 'Key numbers / statistics' },
  { type: 'image', label: 'Image', icon: Image, desc: 'Single image with caption' },
  { type: 'gallery', label: 'Gallery', icon: Image, desc: 'Multiple images in a grid' },
  { type: 'faq', label: 'FAQ', icon: HelpCircle, desc: 'Collapsible Q&A section' },
  { type: 'team', label: 'Team', icon: Users, desc: 'Team member cards' },
  { type: 'testimonials', label: 'Testimonials', icon: Star, desc: 'Customer quotes' },
  { type: 'contact', label: 'Contact Info', icon: Phone, desc: 'Contact details section' },
  { type: 'cta', label: 'Call to Action', icon: Zap, desc: 'Action prompt with button' },
  { type: 'divider', label: 'Divider', icon: Minus, desc: 'Section separator' },
  { type: 'custom_html', label: 'Custom HTML', icon: Code, desc: 'Raw HTML for advanced users' },
];

const DEFAULT_BLOCK_DATA = {
  hero: { title: 'Welcome', subtitle: 'Your subtitle here', description: '', ctaText: 'Get Started', ctaLink: '/', bgColor: '#1e40af', textColor: '#ffffff', bgImage: '' },
  text: { heading: 'Section Title', content: 'Add your content here...', alignment: 'left' },
  features: { heading: 'Our Features', subheading: '', items: [{ icon: '⭐', title: 'Feature 1', description: 'Description' }, { icon: '🚀', title: 'Feature 2', description: 'Description' }, { icon: '💡', title: 'Feature 3', description: 'Description' }] },
  stats: { heading: '', items: [{ value: '100+', label: 'Customers' }, { value: '50+', label: 'Products' }, { value: '24/7', label: 'Support' }] },
  image: { src: '', alt: '', caption: '', width: 'full' },
  gallery: { heading: 'Gallery', images: [{ src: '', alt: '', caption: '' }] },
  faq: { heading: 'Frequently Asked Questions', items: [{ question: 'Question?', answer: 'Answer here.' }] },
  team: { heading: 'Our Team', members: [{ name: 'Team Member', role: 'Role', photo: '', bio: '' }] },
  testimonials: { heading: 'What People Say', items: [{ name: 'Customer Name', role: 'Job Title', quote: 'Great service!', photo: '' }] },
  contact: { heading: 'Contact Us', email: '', phone: '', address: '', hours: '' },
  cta: { heading: 'Ready to get started?', subheading: 'Join thousands of satisfied customers', buttonText: 'Contact Us', buttonLink: '/', bgColor: '#7c3aed' },
  divider: { style: 'line', margin: 'normal' },
  custom_html: { html: '<!-- Your custom HTML here -->' },
};

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default function PageBuilder() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { refreshPages } = useCMS();
  const isNew = !id || id === 'new';

  const [page, setPage] = useState({
    title: '',
    slug: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    showInNav: false,
    navLabel: '',
    navOrder: 0,
    parentNavSlug: '',
    template: 'default',
    content: [],
  });

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [showBlockPicker, setShowBlockPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('content'); // 'content' | 'settings' | 'seo'
  const [editingBlock, setEditingBlock] = useState(null);
  const [autoSlug, setAutoSlug] = useState(isNew);

  useEffect(() => {
    if (!isNew) {
      axios.get(`/api/cms/${id}`)
        .then(res => { setPage(res.data.page); setAutoSlug(false); })
        .catch(() => { toast.error('Page not found'); navigate('/admin/cms'); })
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleTitleChange = (val) => {
    setPage(prev => ({ ...prev, title: val, ...(autoSlug ? { slug: slugify(val) } : {}) }));
  };

  const addBlock = (type) => {
    const newBlock = { type, data: { ...DEFAULT_BLOCK_DATA[type] }, order: page.content.length, isVisible: true, _id: Date.now().toString() };
    setPage(prev => ({ ...prev, content: [...prev.content, newBlock] }));
    setShowBlockPicker(false);
    setEditingBlock(newBlock._id);
  };

  const removeBlock = (idx) => {
    setPage(prev => ({ ...prev, content: prev.content.filter((_, i) => i !== idx) }));
    setEditingBlock(null);
  };

  const moveBlock = (idx, dir) => {
    const newContent = [...page.content];
    const target = idx + dir;
    if (target < 0 || target >= newContent.length) return;
    [newContent[idx], newContent[target]] = [newContent[target], newContent[idx]];
    setPage(prev => ({ ...prev, content: newContent }));
  };

  const updateBlockData = (idx, data) => {
    setPage(prev => ({ ...prev, content: prev.content.map((b, i) => i === idx ? { ...b, data: { ...b.data, ...data } } : b) }));
  };

  const toggleBlockVisibility = (idx) => {
    setPage(prev => ({ ...prev, content: prev.content.map((b, i) => i === idx ? { ...b, isVisible: !b.isVisible } : b) }));
  };

  const savePage = async (publish = null) => {
    if (!page.title.trim()) return toast.error('Page title is required');
    if (!page.slug.trim()) return toast.error('Page slug is required');
    setSaving(true);
    try {
      const payload = { ...page };
      if (publish !== null) payload.isPublished = publish;
      payload.content = payload.content.map((b, i) => ({ ...b, order: i }));
      let res;
      if (isNew) res = await axios.post('/api/cms', payload);
      else res = await axios.put(`/api/cms/${id}`, payload);
      toast.success(isNew ? 'Page created!' : 'Page saved!');
      setPage(res.data.page);
      refreshPages();
      if (isNew) navigate(`/admin/cms/${res.data.page._id}`, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save page');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-0 -m-4 sm:-m-6 lg:-m-8">
      {/* Top toolbar */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin/cms')} className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-semibold text-white truncate max-w-[200px] sm:max-w-none">
                {page.title || 'Untitled Page'}
              </h1>
              <p className="text-xs text-gray-500">/p/{page.slug || 'slug'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && page.isPublished && (
              <a href={`/p/${page.slug}`} target="_blank" rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg hover:bg-gray-800 transition-colors">
                <Eye className="h-3.5 w-3.5" /> Preview
              </a>
            )}
            <button
              onClick={() => savePage(!page.isPublished)}
              disabled={saving}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${page.isPublished ? 'border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}
            >
              {page.isPublished ? 'Unpublish' : 'Publish'}
            </button>
            <button onClick={() => savePage(null)} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-60">
              {saving ? <div className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Save
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3 border-t border-gray-800 pt-3">
          {[['content', 'Content'], ['settings', 'Page Settings'], ['seo', 'SEO']].map(([tab, label]) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 sm:p-6 lg:p-8">
        {/* Page title/slug always visible */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Page Title *</label>
              <input type="text" value={page.title} onChange={e => handleTitleChange(e.target.value)} placeholder="My Awesome Page"
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">
                URL Slug * <span className="text-gray-600 font-normal">(e.g. "about-us" → /p/about-us)</span>
              </label>
              <div className="flex gap-2">
                <input type="text" value={page.slug} onChange={e => { setAutoSlug(false); setPage(prev => ({ ...prev, slug: slugify(e.target.value) })); }} placeholder="page-slug"
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                <button onClick={() => { setAutoSlug(true); setPage(prev => ({ ...prev, slug: slugify(prev.title) })); }}
                  className="px-2 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-500 hover:text-white transition-colors text-xs" title="Auto-generate from title">
                  ↺
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT TAB */}
        {activeTab === 'content' && (
          <div className="space-y-3">
            {page.content.map((block, idx) => {
              const isEditing = editingBlock === (block._id || idx.toString());
              const blockMeta = BLOCK_TYPES.find(b => b.type === block.type);
              return (
                <div key={block._id || idx} className={`bg-gray-900 border rounded-xl transition-colors ${isEditing ? 'border-violet-500' : 'border-gray-800 hover:border-gray-700'}`}>
                  {/* Block header */}
                  <div className="flex items-center gap-3 px-4 py-3 cursor-pointer" onClick={() => setEditingBlock(isEditing ? null : (block._id || idx.toString()))}>
                    <GripVertical className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <blockMeta.icon className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-white">{blockMeta.label}</span>
                      {block.data?.title && <span className="text-xs text-gray-500 ml-2 truncate">— {block.data.title}</span>}
                      {block.data?.heading && <span className="text-xs text-gray-500 ml-2 truncate">— {block.data.heading}</span>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, -1); }} disabled={idx === 0}
                        className="p-1 rounded text-gray-600 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
                        <ChevronUp className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); moveBlock(idx, 1); }} disabled={idx === page.content.length - 1}
                        className="p-1 rounded text-gray-600 hover:text-white hover:bg-gray-800 disabled:opacity-30 transition-colors">
                        <ChevronDown className="h-3.5 w-3.5" />
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); toggleBlockVisibility(idx); }}
                        className="p-1 rounded text-gray-600 hover:text-white hover:bg-gray-800 transition-colors">
                        {block.isVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-gray-600" />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); removeBlock(idx); }}
                        className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-gray-800 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {/* Block editor */}
                  {isEditing && (
                    <div className="border-t border-gray-800 p-4">
                      <BlockEditor block={block} idx={idx} onChange={(data) => updateBlockData(idx, data)} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Add block button */}
            <div className="relative">
              <button onClick={() => setShowBlockPicker(!showBlockPicker)}
                className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-white hover:border-violet-500 transition-colors text-sm">
                <Plus className="h-4 w-4" /> Add Content Block
              </button>

              {showBlockPicker && (
                <div className="absolute top-full left-0 right-0 mt-2 z-20 bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-white">Choose Block Type</h4>
                    <button onClick={() => setShowBlockPicker(false)} className="text-gray-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                    {BLOCK_TYPES.map(bt => (
                      <button key={bt.type} onClick={() => addBlock(bt.type)}
                        className="flex flex-col items-center gap-2 p-3 rounded-lg border border-gray-800 hover:border-violet-500 hover:bg-violet-600/10 text-center transition-colors group">
                        <bt.icon className="h-5 w-5 text-gray-400 group-hover:text-violet-400" />
                        <span className="text-xs font-medium text-gray-300 group-hover:text-white">{bt.label}</span>
                        <span className="text-[10px] text-gray-600 leading-tight">{bt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {page.content.length === 0 && !showBlockPicker && (
              <div className="text-center py-12 bg-gray-900/50 border border-dashed border-gray-800 rounded-xl">
                <Layout className="h-10 w-10 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No content blocks yet</p>
                <p className="text-gray-600 text-xs mt-1">Click "Add Content Block" to start building your page</p>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Template</label>
                <select value={page.template} onChange={e => setPage(prev => ({ ...prev, template: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
                  <option value="default">Default</option>
                  <option value="full-width">Full Width</option>
                  <option value="centered">Centered</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Nav Order</label>
                <input type="number" value={page.navOrder} onChange={e => setPage(prev => ({ ...prev, navOrder: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={page.isPublished} onChange={e => setPage(prev => ({ ...prev, isPublished: e.target.checked }))} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Published</p>
                  <p className="text-xs text-gray-500">Make this page publicly visible</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div className="relative">
                  <input type="checkbox" checked={page.showInNav} onChange={e => setPage(prev => ({ ...prev, showInNav: e.target.checked }))} className="sr-only peer" />
                  <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-white">Show in Navigation</p>
                  <p className="text-xs text-gray-500">Add this page link to the sidebar navigation</p>
                </div>
              </label>
            </div>

            {page.showInNav && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pl-4 border-l-2 border-violet-600/30">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Nav Label</label>
                  <input type="text" value={page.navLabel} onChange={e => setPage(prev => ({ ...prev, navLabel: e.target.value }))} placeholder={page.title}
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Parent Menu (optional slug)</label>
                  <input type="text" value={page.parentNavSlug} onChange={e => setPage(prev => ({ ...prev, parentNavSlug: e.target.value }))} placeholder="parent-page-slug"
                    className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEO TAB */}
        {activeTab === 'seo' && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Meta Title</label>
              <input type="text" value={page.metaTitle} onChange={e => setPage(prev => ({ ...prev, metaTitle: e.target.value }))} placeholder={page.title}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
              <p className="text-xs text-gray-600 mt-1">{(page.metaTitle || page.title).length}/60 characters</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Meta Description</label>
              <textarea rows={3} value={page.metaDescription} onChange={e => setPage(prev => ({ ...prev, metaDescription: e.target.value }))} placeholder="Brief description for search engines..."
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" />
              <p className="text-xs text-gray-600 mt-1">{page.metaDescription.length}/160 characters</p>
            </div>
            <div className="bg-gray-800 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-400 mb-2">Search Preview</p>
              <p className="text-blue-400 text-sm">{page.metaTitle || page.title || 'Page Title'}</p>
              <p className="text-green-500 text-xs">{window.location.origin}/p/{page.slug || 'page-slug'}</p>
              <p className="text-gray-300 text-xs mt-1 line-clamp-2">{page.metaDescription || 'No description set.'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function BlockEditor({ block, idx, onChange }) {
  const d = block.data;

  switch (block.type) {
    case 'hero':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Title" value={d.title} onChange={v => onChange({ title: v })} />
            <Field label="Subtitle" value={d.subtitle} onChange={v => onChange({ subtitle: v })} />
          </div>
          <Field label="Description" value={d.description} onChange={v => onChange({ description: v })} type="textarea" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="CTA Button Text" value={d.ctaText} onChange={v => onChange({ ctaText: v })} />
            <Field label="CTA Link" value={d.ctaLink} onChange={v => onChange({ ctaLink: v })} />
            <Field label="Background Image URL" value={d.bgImage} onChange={v => onChange({ bgImage: v })} />
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Background Color</label>
              <div className="flex gap-2">
                <input type="color" value={d.bgColor || '#1e40af'} onChange={e => onChange({ bgColor: e.target.value })} className="h-9 w-12 bg-gray-800 border border-gray-700 rounded cursor-pointer" />
                <input type="text" value={d.bgColor || '#1e40af'} onChange={e => onChange({ bgColor: e.target.value })} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
              </div>
            </div>
          </div>
        </div>
      );

    case 'text':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2"><Field label="Heading" value={d.heading} onChange={v => onChange({ heading: v })} /></div>
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Alignment</label>
              <select value={d.alignment} onChange={e => onChange({ alignment: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
          <Field label="Content" value={d.content} onChange={v => onChange({ content: v })} type="textarea" rows={6} />
        </div>
      );

    case 'features':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Section Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
            <Field label="Subheading" value={d.subheading} onChange={v => onChange({ subheading: v })} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Feature Items</label>
              <button onClick={() => onChange({ items: [...(d.items || []), { icon: '⭐', title: '', description: '' }] })}
                className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Item</button>
            </div>
            {(d.items || []).map((item, i) => (
              <div key={i} className="flex gap-2 items-start bg-gray-800 rounded-lg p-3">
                <input type="text" value={item.icon} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], icon: e.target.value }; onChange({ items }); }} placeholder="🎯" className="w-12 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-center text-white focus:outline-none focus:border-violet-500" />
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input type="text" value={item.title} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], title: e.target.value }; onChange({ items }); }} placeholder="Title" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                  <input type="text" value={item.description} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], description: e.target.value }; onChange({ items }); }} placeholder="Description" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                </div>
                <button onClick={() => onChange({ items: d.items.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="space-y-3">
          <Field label="Section Heading (optional)" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Stat Items</label>
              <button onClick={() => onChange({ items: [...(d.items || []), { value: '', label: '' }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {(d.items || []).map((item, i) => (
              <div key={i} className="flex gap-2 bg-gray-800 rounded-lg p-2">
                <input type="text" value={item.value} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], value: e.target.value }; onChange({ items }); }} placeholder="100+" className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <input type="text" value={item.label} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], label: e.target.value }; onChange({ items }); }} placeholder="Customers" className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <button onClick={() => onChange({ items: d.items.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'image':
      return (
        <div className="space-y-3">
          <Field label="Image URL" value={d.src} onChange={v => onChange({ src: v })} placeholder="https://example.com/image.jpg" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Alt Text" value={d.alt} onChange={v => onChange({ alt: v })} />
            <Field label="Caption" value={d.caption} onChange={v => onChange({ caption: v })} />
          </div>
          {d.src && <img src={d.src} alt={d.alt} className="max-h-40 rounded-lg border border-gray-700 object-cover" onError={e => e.target.style.display = 'none'} />}
        </div>
      );

    case 'gallery':
      return (
        <div className="space-y-3">
          <Field label="Gallery Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Images</label>
              <button onClick={() => onChange({ images: [...(d.images || []), { src: '', alt: '', caption: '' }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Image</button>
            </div>
            {(d.images || []).map((img, i) => (
              <div key={i} className="flex gap-2 bg-gray-800 rounded-lg p-2">
                <input type="text" value={img.src} onChange={e => { const images = [...d.images]; images[i] = { ...images[i], src: e.target.value }; onChange({ images }); }} placeholder="Image URL" className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <input type="text" value={img.alt} onChange={e => { const images = [...d.images]; images[i] = { ...images[i], alt: e.target.value }; onChange({ images }); }} placeholder="Alt text" className="w-24 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <button onClick={() => onChange({ images: d.images.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className="space-y-3">
          <Field label="Section Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">FAQ Items</label>
              <button onClick={() => onChange({ items: [...(d.items || []), { question: '', answer: '' }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {(d.items || []).map((item, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={item.question} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], question: e.target.value }; onChange({ items }); }} placeholder="Question?" className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                  <button onClick={() => onChange({ items: d.items.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="h-4 w-4" /></button>
                </div>
                <textarea value={item.answer} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], answer: e.target.value }; onChange({ items }); }} placeholder="Answer..." rows={2} className="w-full px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
              </div>
            ))}
          </div>
        </div>
      );

    case 'team':
      return (
        <div className="space-y-3">
          <Field label="Section Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Members</label>
              <button onClick={() => onChange({ members: [...(d.members || []), { name: '', role: '', photo: '', bio: '' }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add Member</button>
            </div>
            {(d.members || []).map((m, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
                <input type="text" value={m.name} onChange={e => { const members = [...d.members]; members[i] = { ...members[i], name: e.target.value }; onChange({ members }); }} placeholder="Name" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <input type="text" value={m.role} onChange={e => { const members = [...d.members]; members[i] = { ...members[i], role: e.target.value }; onChange({ members }); }} placeholder="Role" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <input type="text" value={m.photo} onChange={e => { const members = [...d.members]; members[i] = { ...members[i], photo: e.target.value }; onChange({ members }); }} placeholder="Photo URL" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <div className="flex gap-2">
                  <input type="text" value={m.bio} onChange={e => { const members = [...d.members]; members[i] = { ...members[i], bio: e.target.value }; onChange({ members }); }} placeholder="Short bio" className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                  <button onClick={() => onChange({ members: d.members.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="space-y-3">
          <Field label="Section Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-gray-400">Testimonials</label>
              <button onClick={() => onChange({ items: [...(d.items || []), { name: '', role: '', quote: '', photo: '' }] })} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"><Plus className="h-3 w-3" /> Add</button>
            </div>
            {(d.items || []).map((item, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-3 grid grid-cols-2 gap-2">
                <input type="text" value={item.name} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], name: e.target.value }; onChange({ items }); }} placeholder="Name" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <input type="text" value={item.role} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], role: e.target.value }; onChange({ items }); }} placeholder="Role/Company" className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500" />
                <div className="col-span-2 flex gap-2">
                  <textarea value={item.quote} onChange={e => { const items = [...d.items]; items[i] = { ...items[i], quote: e.target.value }; onChange({ items }); }} placeholder="Quote..." rows={2} className="flex-1 px-2 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white focus:outline-none focus:border-violet-500 resize-none" />
                  <button onClick={() => onChange({ items: d.items.filter((_, j) => j !== i) })} className="text-gray-600 hover:text-red-400 self-start"><X className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className="space-y-3">
          <Field label="Section Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Email" value={d.email} onChange={v => onChange({ email: v })} />
            <Field label="Phone" value={d.phone} onChange={v => onChange({ phone: v })} />
            <Field label="Address" value={d.address} onChange={v => onChange({ address: v })} />
            <Field label="Working Hours" value={d.hours} onChange={v => onChange({ hours: v })} />
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Heading" value={d.heading} onChange={v => onChange({ heading: v })} />
            <Field label="Subheading" value={d.subheading} onChange={v => onChange({ subheading: v })} />
            <Field label="Button Text" value={d.buttonText} onChange={v => onChange({ buttonText: v })} />
            <Field label="Button Link" value={d.buttonLink} onChange={v => onChange({ buttonLink: v })} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Background Color</label>
            <div className="flex gap-2">
              <input type="color" value={d.bgColor || '#7c3aed'} onChange={e => onChange({ bgColor: e.target.value })} className="h-9 w-12 bg-gray-800 border border-gray-700 rounded cursor-pointer" />
              <input type="text" value={d.bgColor || '#7c3aed'} onChange={e => onChange({ bgColor: e.target.value })} className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
            </div>
          </div>
        </div>
      );

    case 'custom_html':
      return (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1.5">HTML Code</label>
          <textarea value={d.html} onChange={e => onChange({ html: e.target.value })} rows={10}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-green-400 font-mono focus:outline-none focus:border-violet-500 resize-none"
            placeholder="<!-- Your custom HTML here -->" />
        </div>
      );

    case 'divider':
      return (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Style</label>
            <select value={d.style} onChange={e => onChange({ style: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
              <option value="line">Line</option>
              <option value="dots">Dots</option>
              <option value="space">Space Only</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Margin</label>
            <select value={d.margin} onChange={e => onChange({ margin: e.target.value })} className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
              <option value="small">Small</option>
              <option value="normal">Normal</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
      );

    default:
      return <p className="text-sm text-gray-500">No editor for this block type.</p>;
  }
}

function Field({ label, value, onChange, type = 'text', placeholder = '', rows = 4 }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" />
      ) : (
        <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
      )}
    </div>
  );
}
