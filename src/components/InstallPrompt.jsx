import { useEffect, useState } from 'react';
import { Download, CheckCircle2, Share } from 'lucide-react';
import { Button } from './Form';

// Detects the browser's native "beforeinstallprompt" event (Chrome/Edge/
// Android) and offers a real install button. On iOS Safari, which never
// fires that event, we show manual "Add to Home Screen" instructions
// instead - never a fake/dead button.
export default function InstallPrompt({ compact }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setInstalled(standalone);

    const ios = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    setIsIOS(ios && !standalone);

    const onPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) setShowIOSHelp((s) => !s);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    setDeferredPrompt(null);
  };

  if (installed) {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-mint-600">
        <CheckCircle2 size={16} /> App Installed
      </span>
    );
  }

  if (!deferredPrompt && !isIOS) return null; // unsupported browser - no fake button

  return (
    <div className={compact ? '' : 'relative'}>
      <Button size={compact ? 'sm' : 'md'} variant={compact ? 'outline' : 'primary'} onClick={handleInstall}>
        <Download size={compact ? 14 : 16} /> Install KamWala App
      </Button>
      {showIOSHelp && (
        <div className="absolute z-20 mt-2 w-64 bg-white border border-cloud-200 rounded-card shadow-pop p-3.5 text-sm text-ink-700">
          <p className="flex items-center gap-1.5 font-semibold mb-1">
            <Share size={14} /> Add to Home Screen
          </p>
          <p>Tap the Share button in Safari, then choose "Add to Home Screen".</p>
        </div>
      )}
    </div>
  );
}
