import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCMS } from '../../context/CMSContext';
import {
  Save, Plus, Trash2, ChevronUp, ChevronDown, ChevronRight,
  Eye, EyeOff, Link2, Globe, X, RefreshCw, GripVertical, Info
} from 'lucide-react';

const ICON_OPTIONS = [
  'LayoutDashboard', 'ShoppingCart', 'Package', 'Warehouse', 'Truck',
  'BarChart3', 'Users', 'FileText', 'Settings', 'Globe', 'Home',
  'Info', 'Phone', 'Mail', 'Star', 'Heart', 'Book', 'Clipboard',
  'Calendar', 'Bell', 'Shield', 'Search', 'Map', 'Camera', 'Award'
];

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin only' },
  { value: 'manager', label: 'Manager+' },
  { value: 'pharmacist', label: 'Pharmacist+' },
  { value: 'cashier', label: 'Cashier+' },
];

const emptyItem = (order) => ({
  label: '', href: '/', type: 'internal', icon: '', order,
  roles: [], isVisible: true, children: [], _id: Date.now().toString()
});

export default function NavigationManager() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedItems, setExpandedItems] = useState({});
  const [cmsPages, setCmsPages] = useState([]);
  const { refreshNavigation } = useCMS();

  useEffect(() => {
    Promise.all([
      axios.get('/api/navigation/main'),
      axios.get('/api/cms/public'),
    ]).then(([navRes, pagesRes]) => {
      setItems(navRes.data.nav?.items || []);
      setCmsPages(pagesRes.data.pages || []);
    }).catch(() => toast.error('Failed to load navigation'))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      await axios.put('/api/navigation/main', { items: items.map((item, i) => ({ ...item, order: i })) });
      toast.success('Navigation saved!');
      refreshNavigation();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save navigation');
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    if (!window.confirm('Reset navigation to defaults?')) return;
    try {
      const res = await axios.post('/api/navigation/main/reset');
      setItems(res.data.nav.items);
      toast.success('Navigation reset to defaults');
      refreshNavigation();
    } catch (err) {
      toast.error('Failed to reset navigation');
    }
  };

  const addItem = () => setItems(prev => [...prev, emptyItem(prev.length)]);

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx));

  const moveItem = (idx, dir) => {
    const arr = [...items];
    const target = idx + dir;
    if (target < 0 || target >= arr.length) return;
    [arr[idx], arr[target]] = [arr[target], arr[idx]];
    setItems(arr);
  };

  const updateItem = (idx, updates) => setItems(prev => prev.map((item, i) => i === idx ? { ...item, ...updates } : item));

  const addChild = (parentIdx) => {
    const arr = [...items];
    arr[parentIdx] = { ...arr[parentIdx], children: [...(arr[parentIdx].children || []), emptyItem((arr[parentIdx].children || []).length)] };
    setItems(arr);
    setExpandedItems(prev => ({ ...prev, [parentIdx]: true }));
  };

  const removeChild = (parentIdx, childIdx) => {
    const arr = [...items];
    arr[parentIdx] = { ...arr[parentIdx], children: arr[parentIdx].children.filter((_, i) => i !== childIdx) };
    setItems(arr);
  };

  const updateChild = (parentIdx, childIdx, updates) => {
    const arr = [...items];
    arr[parentIdx] = { ...arr[parentIdx], children: arr[parentIdx].children.map((c, i) => i === childIdx ? { ...c, ...updates } : c) };
    setItems(arr);
  };

  const addCmsPageItem = (page) => {
    const newItem = { label: page.navLabel || page.title, href: `/p/${page.slug}`, type: 'cms_page', icon: 'FileText', order: items.length, roles: [], isVisible: true, children: [], _id: Date.now().toString() };
    setItems(prev => [...prev, newItem]);
    toast.success(`"${page.title}" added to navigation`);
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Navigation Manager</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage sidebar navigation — add, reorder, nest, and show/hide items</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={reset} className="flex items-center gap-1.5 px-3 py-2 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 text-sm rounded-lg transition-colors">
            <RefreshCw className="h-3.5 w-3.5" /> Reset
          </button>
          <button onClick={save} disabled={saving} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
            {saving ? <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Save Navigation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation Builder */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-300">Main Navigation Items</h2>
            <span className="text-xs text-gray-600">{items.length} items</span>
          </div>

          {items.map((item, idx) => (
            <div key={item._id || idx} className="bg-gray-900 border border-gray-800 rounded-xl">
              {/* Main item */}
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <GripVertical className="h-4 w-4 text-gray-700 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <input type="text" value={item.label} onChange={e => updateItem(idx, { label: e.target.value })} placeholder="Label" className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                    <input type="text" value={item.href} onChange={e => updateItem(idx, { href: e.target.value })} placeholder="/path" className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                    <select value={item.icon} onChange={e => updateItem(idx, { icon: e.target.value })} className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
                      <option value="">No Icon</option>
                      {ICON_OPTIONS.map(ico => <option key={ico} value={ico}>{ico}</option>)}
                    </select>
                    <select value={(item.roles || [])[0] || ''} onChange={e => updateItem(idx, { roles: e.target.value ? [e.target.value] : [] })} className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500">
                      {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => moveItem(idx, -1)} disabled={idx === 0} className="p-1 text-gray-600 hover:text-white disabled:opacity-30 rounded hover:bg-gray-800 transition-colors"><ChevronUp className="h-3.5 w-3.5" /></button>
                    <button onClick={() => moveItem(idx, 1)} disabled={idx === items.length - 1} className="p-1 text-gray-600 hover:text-white disabled:opacity-30 rounded hover:bg-gray-800 transition-colors"><ChevronDown className="h-3.5 w-3.5" /></button>
                    <button onClick={() => updateItem(idx, { isVisible: !item.isVisible })} className="p-1 rounded hover:bg-gray-800 transition-colors">
                      {item.isVisible ? <Eye className="h-3.5 w-3.5 text-gray-500" /> : <EyeOff className="h-3.5 w-3.5 text-gray-700" />}
                    </button>
                    <button onClick={() => removeItem(idx)} className="p-1 rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400 transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>

                {/* Type indicator */}
                <div className="flex items-center gap-2 ml-6">
                  <div className="flex gap-1">
                    {['internal', 'external', 'cms_page'].map(t => (
                      <button key={t} onClick={() => updateItem(idx, { type: t })}
                        className={`text-xs px-2 py-0.5 rounded-full transition-colors ${item.type === t ? 'bg-violet-600 text-white' : 'text-gray-600 hover:text-gray-400'}`}>
                        {t === 'internal' ? 'Internal' : t === 'external' ? 'External' : 'CMS Page'}
                      </button>
                    ))}
                  </div>
                  {(item.children || []).length > 0 && (
                    <button onClick={() => setExpandedItems(prev => ({ ...prev, [idx]: !prev[idx] }))}
                      className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 ml-auto">
                      <ChevronRight className={`h-3 w-3 transition-transform ${expandedItems[idx] ? 'rotate-90' : ''}`} />
                      {(item.children || []).length} sub-item{(item.children || []).length !== 1 ? 's' : ''}
                    </button>
                  )}
                  <button onClick={() => addChild(idx)} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 ml-auto">
                    <Plus className="h-3 w-3" /> Sub-item
                  </button>
                </div>
              </div>

              {/* Children */}
              {(item.children || []).length > 0 && (expandedItems[idx] !== false) && (
                <div className="border-t border-gray-800 px-4 pb-3 space-y-2 pt-3">
                  <p className="text-xs text-gray-600 mb-2">Sub-menu items (dropdown):</p>
                  {(item.children || []).map((child, cidx) => (
                    <div key={child._id || cidx} className="flex items-center gap-2 pl-4 border-l-2 border-gray-800">
                      <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <input type="text" value={child.label} onChange={e => updateChild(idx, cidx, { label: e.target.value })} placeholder="Sub-label" className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                        <input type="text" value={child.href} onChange={e => updateChild(idx, cidx, { href: e.target.value })} placeholder="/path" className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
                        <select value={child.icon} onChange={e => updateChild(idx, cidx, { icon: e.target.value })} className="px-2 py-1.5 bg-gray-800 border border-gray-700 rounded text-xs text-white focus:outline-none focus:border-violet-500">
                          <option value="">No Icon</option>
                          {ICON_OPTIONS.map(ico => <option key={ico} value={ico}>{ico}</option>)}
                        </select>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button onClick={() => updateChild(idx, cidx, { isVisible: !child.isVisible })} className="p-1 rounded hover:bg-gray-800">
                          {child.isVisible ? <Eye className="h-3 w-3 text-gray-500" /> : <EyeOff className="h-3 w-3 text-gray-700" />}
                        </button>
                        <button onClick={() => removeChild(idx, cidx)} className="p-1 rounded hover:bg-red-900/30 text-gray-600 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <button onClick={addItem} className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-white hover:border-violet-500 text-sm transition-colors">
            <Plus className="h-4 w-4" /> Add Navigation Item
          </button>
        </div>

        {/* CMS Pages Quick Add + Preview */}
        <div className="space-y-4">
          {/* CMS Pages */}
          {cmsPages.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3">Add CMS Page</h3>
              <p className="text-xs text-gray-500 mb-3">Click to add a CMS page to navigation</p>
              <div className="space-y-2">
                {cmsPages.map(page => {
                  const alreadyAdded = items.some(item => item.href === `/p/${page.slug}`);
                  return (
                    <div key={page._id} className="flex items-center justify-between py-1.5">
                      <div>
                        <p className="text-sm text-white">{page.title}</p>
                        <p className="text-xs text-gray-500">/p/{page.slug}</p>
                      </div>
                      <button
                        onClick={() => addCmsPageItem(page)}
                        disabled={alreadyAdded}
                        className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${alreadyAdded ? 'bg-gray-800 text-gray-600 cursor-not-allowed' : 'bg-violet-600 hover:bg-violet-700 text-white'}`}
                      >
                        {alreadyAdded ? 'Added' : '+ Add'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Navigation Preview</h3>
            <div className="bg-gray-950 rounded-lg p-3 space-y-1">
              {items.filter(i => i.isVisible).map((item, idx) => (
                <div key={idx}>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-gray-300">
                    <div className="h-1.5 w-1.5 rounded-full bg-violet-500 flex-shrink-0" />
                    <span className="truncate">{item.label || <span className="italic text-gray-600">Untitled</span>}</span>
                    <span className="ml-auto text-xs text-gray-600 truncate max-w-[80px]">{item.href}</span>
                  </div>
                  {(item.children || []).filter(c => c.isVisible).map((child, cidx) => (
                    <div key={cidx} className="flex items-center gap-2 px-2 py-1 rounded text-xs text-gray-500 pl-6">
                      <div className="h-1 w-1 rounded-full bg-gray-600 flex-shrink-0" />
                      <span className="truncate">{child.label || <span className="italic">Untitled</span>}</span>
                    </div>
                  ))}
                </div>
              ))}
              {items.filter(i => i.isVisible).length === 0 && (
                <p className="text-xs text-gray-600 text-center py-2">No visible items</p>
              )}
            </div>
          </div>

          {/* Tips */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Tips</h3>
            </div>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li>• Use <strong className="text-gray-400">Sub-items</strong> to create dropdown menus</li>
              <li>• Set <strong className="text-gray-400">Role</strong> to restrict visibility per user role</li>
              <li>• <strong className="text-gray-400">Internal</strong> links use React Router (no page reload)</li>
              <li>• <strong className="text-gray-400">External</strong> links open in a new tab</li>
              <li>• Click the eye icon to hide without deleting</li>
              <li>• CMS pages use path: <code className="text-violet-400">/p/slug</code></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
