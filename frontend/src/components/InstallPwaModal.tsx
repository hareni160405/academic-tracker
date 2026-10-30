import React, { useState, useEffect } from 'react';
import { X, Smartphone, Share2, PlusSquare, CheckCircle2, ShieldCheck, Info } from 'lucide-react';

interface InstallPwaModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallPwaModal: React.FC<InstallPwaModalProps> = ({ isOpen, onClose }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Install Academic Tracker</h3>
            <p className="text-xs text-emerald-800 font-medium">Android & Desktop Progressive Web App</p>
          </div>
        </div>

        <div className="space-y-4 py-4 text-sm text-slate-600">
          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" />
              <div>
                <div className="font-semibold">App Already Installed!</div>
                <div className="text-xs text-emerald-700">
                  You are already running Academic Tracker in standalone app mode.
                </div>
              </div>
            </div>
          ) : (
            <>
              {deferredPrompt && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-center">
                  <p className="mb-3 text-xs font-semibold text-emerald-900">
                    Your browser supports 1-click automatic installation!
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 py-2.5 font-medium text-white shadow-md shadow-emerald-600/20 transition-transform hover:scale-[1.02]"
                  >
                    Click to Install on Android
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="font-semibold text-slate-900">How to Install on Android (Chrome):</div>
                <ol className="space-y-2.5 text-xs text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800">1</span>
                    <span>Open the public shareable link in <strong>Google Chrome</strong> on your Android phone.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800">2</span>
                    <span>Tap the <strong>three vertical dots menu (⋮)</strong> at the top-right corner of Chrome.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800">3</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sky-100 font-bold text-sky-800">4</span>
                    <span>Confirm by clicking <strong>Add / Install</strong>. The app will be placed directly in your Android App Drawer and Home Screen with its custom logo and standalone windowing!</span>
                  </li>
                </ol>
              </div>

              {/* Technical Distinction Note */}
              <div className="rounded-xl border border-sky-100 bg-sky-50/70 p-3 text-xs text-sky-900">
                <div className="flex items-center gap-2 font-semibold text-sky-950">
                  <Info className="h-4 w-4 text-sky-600" />
                  <span>PWA vs Standalone APK:</span>
                </div>
                <p className="mt-1 leading-relaxed text-sky-800">
                  This application is distributed as a <strong>modern Progressive Web App (WebAPK)</strong>. It provides full offline access, home-screen launch, and push notifications without requiring APK sideloading or enabling third-party unknown sources.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 pt-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
