import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

// Small EN <-> हिं switch. Preference is remembered on the device.
export default function LanguageToggle({ className = '' }) {
  const { lang, setLang } = useLanguage();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}
      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-pill border border-cloud-200 bg-white text-ink-700 hover:bg-cloud-50 transition-colors ${className}`}
      aria-label="Switch language"
    >
      <Languages size={14} />
      {lang === 'en' ? 'हिंदी' : 'English'}
    </button>
  );
}
