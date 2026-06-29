import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import axios from 'axios';
import { Edit3, ChevronDown, ChevronUp, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function DynamicPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    axios.get(`/api/cms/public/${slug}`)
      .then(res => setPage(res.data.page))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
    </div>
  );

  if (notFound) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <h1 className="text-4xl font-bold text-gray-900 mb-2">404</h1>
      <p className="text-gray-500 mb-4">Page not found</p>
      <Link to="/" className="text-primary-600 hover:underline">← Back to Dashboard</Link>
    </div>
  );

  if (!page) return null;

  const visibleBlocks = (page.content || []).filter(b => b.isVisible !== false).sort((a, b) => a.order - b.order);
  const isAdmin = user?.role === 'admin' || user?.role === 'manager';

  const containerClass = page.template === 'full-width'
    ? 'w-full'
    : page.template === 'centered'
    ? 'max-w-3xl mx-auto px-4'
    : 'max-w-5xl mx-auto px-4';

  return (
    <div className="min-h-[60vh] pb-12">
      {/* Admin edit bar */}
      {isAdmin && (
        <div className="mb-6 flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Edit3 className="h-4 w-4" />
            <span>You are viewing a CMS page</span>
          </div>
          <Link to={`/admin/cms`} className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium rounded-lg transition-colors">
            <Edit3 className="h-3 w-3" /> Edit Page
          </Link>
        </div>
      )}

      {/* Page title */}
      <div className={`${containerClass} mb-8`}>
        <h1 className="text-3xl font-bold text-gray-900">{page.title}</h1>
      </div>

      {/* Content Blocks */}
      <div className="space-y-0">
        {visibleBlocks.map((block, idx) => (
          <BlockRenderer key={block._id || idx} block={block} containerClass={containerClass} />
        ))}
        {visibleBlocks.length === 0 && (
          <div className={`${containerClass} text-center py-20 text-gray-400`}>
            <p>This page has no content yet.</p>
            {isAdmin && <Link to={`/admin/cms`} className="text-primary-600 hover:underline mt-2 block">Add content →</Link>}
          </div>
        )}
      </div>
    </div>
  );
}

function BlockRenderer({ block, containerClass }) {
  const { type, data } = block;

  switch (type) {
    case 'hero':
      return (
        <div className="w-full py-16 sm:py-24 mb-8" style={{ backgroundColor: data.bgColor || '#1e40af', backgroundImage: data.bgImage ? `url(${data.bgImage})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="max-w-5xl mx-auto px-4 text-center" style={{ color: data.textColor || '#ffffff' }}>
            <h2 className="text-4xl sm:text-5xl font-bold leading-tight mb-4">{data.title}</h2>
            {data.subtitle && <p className="text-xl sm:text-2xl opacity-90 mb-4">{data.subtitle}</p>}
            {data.description && <p className="text-base opacity-80 max-w-2xl mx-auto mb-8">{data.description}</p>}
            {data.ctaText && (
              <Link to={data.ctaLink || '/'} className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-opacity-90 transition-colors shadow-lg">
                {data.ctaText}
              </Link>
            )}
          </div>
        </div>
      );

    case 'text':
      return (
        <div className={`${containerClass} py-8`}>
          {data.heading && <h2 className={`text-2xl font-bold text-gray-900 mb-4 text-${data.alignment || 'left'}`}>{data.heading}</h2>}
          {data.content && (
            <div className={`text-gray-700 leading-relaxed whitespace-pre-line text-${data.alignment || 'left'}`}>
              {data.content}
            </div>
          )}
        </div>
      );

    case 'features':
      return (
        <div className={`${containerClass} py-10`}>
          {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">{data.heading}</h2>}
          {data.subheading && <p className="text-gray-500 text-center mb-8">{data.subheading}</p>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
            {(data.items || []).map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{item.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'stats':
      return (
        <div className="w-full bg-primary-600 py-12 mb-4">
          <div className="max-w-5xl mx-auto px-4">
            {data.heading && <h2 className="text-xl font-bold text-white text-center mb-8">{data.heading}</h2>}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
              {(data.items || []).map((item, i) => (
                <div key={i}>
                  <p className="text-3xl font-bold text-white">{item.value}</p>
                  <p className="text-sm text-primary-100 mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'image':
      return (
        <div className={`${containerClass} py-6`}>
          <figure className="text-center">
            <img src={data.src} alt={data.alt || ''} className={`rounded-xl shadow-md mx-auto ${data.width === 'full' ? 'w-full' : 'max-w-2xl'}`} />
            {data.caption && <figcaption className="text-sm text-gray-500 mt-2">{data.caption}</figcaption>}
          </figure>
        </div>
      );

    case 'gallery':
      return (
        <div className={`${containerClass} py-8`}>
          {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">{data.heading}</h2>}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {(data.images || []).filter(img => img.src).map((img, i) => (
              <div key={i} className="relative group overflow-hidden rounded-xl">
                <img src={img.src} alt={img.alt || ''} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                {img.caption && <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</div>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'faq':
      return (
        <div className={`${containerClass} py-10`}>
          {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{data.heading}</h2>}
          <div className="space-y-3 max-w-3xl mx-auto">
            {(data.items || []).map((item, i) => <FAQItem key={i} question={item.question} answer={item.answer} />)}
          </div>
        </div>
      );

    case 'team':
      return (
        <div className={`${containerClass} py-10`}>
          {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{data.heading}</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {(data.members || []).map((m, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-6 text-center hover:shadow-md transition-shadow">
                {m.photo ? (
                  <img src={m.photo} alt={m.name} className="h-20 w-20 rounded-full mx-auto mb-4 object-cover border-4 border-gray-100" />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-2xl font-bold mx-auto mb-4">
                    {m.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <h3 className="font-semibold text-gray-900">{m.name}</h3>
                <p className="text-sm text-primary-600">{m.role}</p>
                {m.bio && <p className="text-xs text-gray-500 mt-2">{m.bio}</p>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'testimonials':
      return (
        <div className="w-full bg-gray-50 py-12">
          <div className={`${containerClass}`}>
            {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{data.heading}</h2>}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(data.items || []).map((item, i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <p className="text-gray-700 italic mb-4">"{item.quote}"</p>
                  <div className="flex items-center gap-3">
                    {item.photo ? (
                      <img src={item.photo} alt={item.name} className="h-10 w-10 rounded-full object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                        {item.name?.charAt(0)?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );

    case 'contact':
      return (
        <div className={`${containerClass} py-10`}>
          {data.heading && <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">{data.heading}</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {data.email && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Mail className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <a href={`mailto:${data.email}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">{data.email}</a>
                </div>
              </div>
            )}
            {data.phone && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Phone className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <a href={`tel:${data.phone}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">{data.phone}</a>
                </div>
              </div>
            )}
            {data.address && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <MapPin className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">{data.address}</p>
                </div>
              </div>
            )}
            {data.hours && (
              <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200">
                <Clock className="h-5 w-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500">Hours</p>
                  <p className="text-sm font-medium text-gray-900">{data.hours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      );

    case 'cta':
      return (
        <div className="w-full py-14 my-4" style={{ backgroundColor: data.bgColor || '#7c3aed' }}>
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">{data.heading}</h2>
            {data.subheading && <p className="text-white/80 mb-8">{data.subheading}</p>}
            {data.buttonText && (
              <Link to={data.buttonLink || '/'} className="inline-block px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl hover:bg-opacity-90 transition-colors shadow-lg">
                {data.buttonText}
              </Link>
            )}
          </div>
        </div>
      );

    case 'divider': {
      const marginMap = { small: 'my-4', normal: 'my-8', large: 'my-16' };
      return (
        <div className={`${containerClass} ${marginMap[data.margin] || 'my-8'}`}>
          {data.style === 'line' && <hr className="border-gray-200" />}
          {data.style === 'dots' && <div className="flex justify-center gap-2"><span className="h-2 w-2 rounded-full bg-gray-300" /><span className="h-2 w-2 rounded-full bg-gray-300" /><span className="h-2 w-2 rounded-full bg-gray-300" /></div>}
        </div>
      );
    }

    case 'custom_html':
      return (
        <div className={`${containerClass} py-4`} dangerouslySetInnerHTML={{ __html: data.html || '' }} />
      );

    default:
      return null;
  }
}

function FAQItem({ question, answer }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left bg-white hover:bg-gray-50 transition-colors">
        <span className="font-medium text-gray-900">{question}</span>
        {open ? <ChevronUp className="h-4 w-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-2 bg-white border-t border-gray-100 text-sm text-gray-600 leading-relaxed">
          {answer}
        </div>
      )}
    </div>
  );
}
