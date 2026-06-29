import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const CMSContext = createContext();

export const useCMS = () => {
  const context = useContext(CMSContext);
  if (!context) throw new Error('useCMS must be used within CMSProvider');
  return context;
};

export const CMSProvider = ({ children }) => {
  const [settings, setSettings] = useState(null);
  const [navigation, setNavigation] = useState(null);
  const [cmsPages, setCmsPages] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const [settingsRes, navRes, pagesRes] = await Promise.allSettled([
        axios.get('/api/site-settings'),
        axios.get('/api/navigation/main'),
        axios.get('/api/cms/public'),
      ]);
      if (settingsRes.status === 'fulfilled') setSettings(settingsRes.value.data.settings);
      if (navRes.status === 'fulfilled') setNavigation(navRes.value.data.nav);
      if (pagesRes.status === 'fulfilled') setCmsPages(pagesRes.value.data.pages || []);
    } catch (err) {
      console.error('CMS fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const refreshSettings = async () => {
    try {
      const res = await axios.get('/api/site-settings');
      setSettings(res.data.settings);
    } catch (err) {
      console.error('Settings refresh error:', err);
    }
  };

  const refreshNavigation = async () => {
    try {
      const res = await axios.get('/api/navigation/main');
      setNavigation(res.data.nav);
    } catch (err) {
      console.error('Nav refresh error:', err);
    }
  };

  const refreshPages = async () => {
    try {
      const res = await axios.get('/api/cms/public');
      setCmsPages(res.data.pages || []);
    } catch (err) {
      console.error('Pages refresh error:', err);
    }
  };

  return (
    <CMSContext.Provider value={{
      settings,
      navigation,
      cmsPages,
      loading,
      refreshSettings,
      refreshNavigation,
      refreshPages,
      refreshAll: fetchAll,
    }}>
      {children}
    </CMSContext.Provider>
  );
};
