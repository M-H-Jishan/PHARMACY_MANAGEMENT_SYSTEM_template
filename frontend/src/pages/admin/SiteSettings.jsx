import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useCMS } from '../../context/CMSContext';
import { Save, Globe, Palette, Building2, Phone, Share2, AlertTriangle, RefreshCw } from 'lucide-react';

const TABS = [
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'pharmacy', label: 'Pharmacy Info', icon: Building2 },
  { id: 'contact', label: 'Contact & Social', icon: Phone },
  { id: 'system', label: 'System', icon: Globe },
];

export default function SiteSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('branding');
  const { refreshSettings } = useCMS();

  useEffect(() => {
    axios.get('/api/site-settings')
      .then(res => setSettings(res.data.settings))
      .catch(() => toast.error('Failed to load settings'))
      .finally(() => setLoading(false));
  }, []);

  const update = (path, value) => {
    setSettings(prev => {
      if (path.includes('.')) {
        const [key, subkey] = path.split('.');
        return { ...prev, [key]: { ...(prev[key] || {}), [subkey]: value } };
      }
      return { ...prev, [path]: value };
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await axios.put('/api/site-settings', settings);
      setSettings(res.data.settings);
      toast.success('Settings saved!');
      refreshSettings();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) return (
    <div className="flex items-center justify-center py-20">
      <div className="h-8 w-8 border-4 border-violet-600/30 border-t-violet-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Site Settings</h1>
          <p className="text-gray-400 text-sm mt-0.5">Manage branding, pharmacy info, contact details and system preferences</p>
        </div>
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
          {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
          Save Settings
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 border border-gray-800 rounded-xl p-1">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors flex-1 justify-center ${activeTab === tab.id ? 'bg-violet-600 text-white' : 'text-gray-400 hover:text-white'}`}>
            <tab.icon className="h-4 w-4" />
            <span className="hidden sm:block">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* BRANDING TAB */}
      {activeTab === 'branding' && (
        <div className="space-y-4">
          <SettingsCard title="Identity">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Site Name" value={settings.siteName} onChange={v => update('siteName', v)} placeholder="PharmaPOS" />
              <Field label="Tagline" value={settings.tagline} onChange={v => update('tagline', v)} placeholder="Pharmacy Management System" />
              <Field label="Logo URL" value={settings.logoUrl} onChange={v => update('logoUrl', v)} placeholder="https://example.com/logo.png" />
              <Field label="Favicon URL" value={settings.faviconUrl} onChange={v => update('faviconUrl', v)} placeholder="https://example.com/favicon.ico" />
            </div>
            {settings.logoUrl && (
              <div className="mt-3 p-3 bg-gray-800 rounded-lg inline-block">
                <img src={settings.logoUrl} alt="Logo preview" className="h-12 object-contain rounded" onError={e => e.target.style.display = 'none'} />
              </div>
            )}
          </SettingsCard>

          <SettingsCard title="Color Theme">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ColorField label="Primary Color" value={settings.primaryColor} onChange={v => update('primaryColor', v)} />
              <ColorField label="Accent Color" value={settings.accentColor} onChange={v => update('accentColor', v)} />
              <ColorField label="Sidebar Color" value={settings.sidebarColor} onChange={v => update('sidebarColor', v)} />
            </div>
            <div className="mt-4 flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
              <div className="h-8 w-8 rounded-full" style={{ backgroundColor: settings.accentColor }} />
              <div className="h-8 w-8 rounded-full border border-gray-600" style={{ backgroundColor: settings.sidebarColor }} />
              <span className="text-xs text-gray-500 ml-2">Color preview</span>
            </div>
          </SettingsCard>

          <SettingsCard title="Footer">
            <Field label="Footer Text" value={settings.footerText} onChange={v => update('footerText', v)} placeholder="PharmaPOS © 2024. All rights reserved." />
          </SettingsCard>
        </div>
      )}

      {/* PHARMACY INFO TAB */}
      {activeTab === 'pharmacy' && (
        <div className="space-y-4">
          <SettingsCard title="Pharmacy Details">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Pharmacy Name" value={settings.pharmacyName} onChange={v => update('pharmacyName', v)} placeholder="HealthFirst Pharmacy" />
              <Field label="GSTIN" value={settings.gstin} onChange={v => update('gstin', v)} placeholder="27AABCH1234F1ZV" />
              <Field label="Drug License Number" value={settings.drugLicense} onChange={v => update('drugLicense', v)} placeholder="DL-MH-2024-00567" />
              <Field label="Contact Email" value={settings.contactEmail} onChange={v => update('contactEmail', v)} placeholder="info@pharmacy.com" />
            </div>
            <div className="mt-4">
              <Field label="Pharmacy Address" value={settings.pharmacyAddress} onChange={v => update('pharmacyAddress', v)} type="textarea" placeholder="Full address" />
            </div>
          </SettingsCard>

          <SettingsCard title="Localization & Billing">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <Field label="Currency Symbol" value={settings.currency} onChange={v => update('currency', v)} placeholder="₹" />
              <Field label="Currency Code" value={settings.currencyCode} onChange={v => update('currencyCode', v)} placeholder="INR" />
              <Field label="Timezone" value={settings.timezone} onChange={v => update('timezone', v)} placeholder="Asia/Kolkata" />
              <Field label="Date Format" value={settings.dateFormat} onChange={v => update('dateFormat', v)} placeholder="DD/MM/YYYY" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
              <Field label="Invoice Prefix" value={settings.invoicePrefix} onChange={v => update('invoicePrefix', v)} placeholder="INV" />
              <Field label="Low Stock Threshold" value={settings.lowStockThreshold} onChange={v => update('lowStockThreshold', parseInt(v) || 0)} type="number" />
              <Field label="Near Expiry Days" value={settings.nearExpiryDays} onChange={v => update('nearExpiryDays', parseInt(v) || 0)} type="number" />
            </div>
            <div className="mt-4 flex gap-6">
              <Toggle label="Tax Included in Price" desc="Show MRP as tax-inclusive" checked={settings.taxIncluded} onChange={v => update('taxIncluded', v)} />
            </div>
          </SettingsCard>
        </div>
      )}

      {/* CONTACT & SOCIAL TAB */}
      {activeTab === 'contact' && (
        <div className="space-y-4">
          <SettingsCard title="Contact Information">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Contact Email" value={settings.contactEmail} onChange={v => update('contactEmail', v)} placeholder="info@pharmacy.com" />
              <Field label="Contact Phone" value={settings.contactPhone} onChange={v => update('contactPhone', v)} placeholder="+91-9876543210" />
            </div>
          </SettingsCard>

          <SettingsCard title="Social Media Links">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Facebook" value={settings.socialLinks?.facebook} onChange={v => update('socialLinks.facebook', v)} placeholder="https://facebook.com/yourpage" />
              <Field label="Twitter / X" value={settings.socialLinks?.twitter} onChange={v => update('socialLinks.twitter', v)} placeholder="https://twitter.com/yourhandle" />
              <Field label="Instagram" value={settings.socialLinks?.instagram} onChange={v => update('socialLinks.instagram', v)} placeholder="https://instagram.com/yourpage" />
              <Field label="LinkedIn" value={settings.socialLinks?.linkedin} onChange={v => update('socialLinks.linkedin', v)} placeholder="https://linkedin.com/company/your" />
              <Field label="YouTube" value={settings.socialLinks?.youtube} onChange={v => update('socialLinks.youtube', v)} placeholder="https://youtube.com/@your-channel" />
            </div>
          </SettingsCard>
        </div>
      )}

      {/* SYSTEM TAB */}
      {activeTab === 'system' && (
        <div className="space-y-4">
          <SettingsCard title="Maintenance Mode">
            <div className={`rounded-lg p-4 border ${settings.maintenanceMode ? 'bg-red-950/20 border-red-800' : 'bg-gray-800 border-gray-700'}`}>
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className={`h-5 w-5 mt-0.5 ${settings.maintenanceMode ? 'text-red-400' : 'text-gray-500'}`} />
                <div>
                  <Toggle label="Enable Maintenance Mode" desc="Shows a maintenance message to all non-admin visitors" checked={settings.maintenanceMode} onChange={v => update('maintenanceMode', v)} />
                </div>
              </div>
              {settings.maintenanceMode && (
                <Field label="Maintenance Message" value={settings.maintenanceMessage} onChange={v => update('maintenanceMessage', v)} type="textarea" placeholder="Site is under maintenance. Please try again later." />
              )}
            </div>
          </SettingsCard>

          <SettingsCard title="Inventory Rules">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Field label="Low Stock Threshold (units)" value={settings.lowStockThreshold} onChange={v => update('lowStockThreshold', parseInt(v) || 0)} type="number" />
                <p className="text-xs text-gray-600 mt-1">Alert when stock falls below this quantity</p>
              </div>
              <div>
                <Field label="Near Expiry Warning (days)" value={settings.nearExpiryDays} onChange={v => update('nearExpiryDays', parseInt(v) || 0)} type="number" />
                <p className="text-xs text-gray-600 mt-1">Alert when expiry is within this many days</p>
              </div>
            </div>
          </SettingsCard>
        </div>
      )}

      {/* Save footer */}
      <div className="border-t border-gray-800 pt-4 flex justify-end">
        <button onClick={save} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-60">
          {saving ? <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
          Save All Settings
        </button>
      </div>
    </div>
  );
}

function SettingsCard({ title, children }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <h3 className="text-sm font-semibold text-white mb-4 pb-3 border-b border-gray-800">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      {type === 'textarea' ? (
        <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500 resize-none" />
      ) : (
        <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-violet-500" />
      )}
    </div>
  );
}

function ColorField({ label, value, onChange }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="flex gap-2">
        <input type="color" value={value || '#000000'} onChange={e => onChange(e.target.value)}
          className="h-9 w-12 bg-gray-800 border border-gray-700 rounded cursor-pointer flex-shrink-0" />
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-violet-500" />
      </div>
    </div>
  );
}

function Toggle({ label, desc, checked, onChange }) {
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div className="relative flex-shrink-0">
        <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="sr-only peer" />
        <div className="w-10 h-5 bg-gray-700 rounded-full peer peer-checked:bg-violet-600 transition-colors" />
        <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
      </div>
      <div>
        <p className="text-sm font-medium text-white">{label}</p>
        {desc && <p className="text-xs text-gray-500">{desc}</p>}
      </div>
    </label>
  );
}
