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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400">
            <Smartphone className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Install Academic Tracker</h3>
            <p className="text-xs text-slate-400">Android & Desktop Progressive Web App</p>
          </div>
        </div>

        <div className="space-y-4 py-4 text-sm text-slate-300">
          {isInstalled ? (
            <div className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-4 text-emerald-300">
              <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
              <div>
                <div className="font-semibold">App Already Installed!</div>
                <div className="text-xs text-emerald-400/80">
                  You are already running Academic Tracker in standalone app mode.
                </div>
              </div>
            </div>
          ) : (
            <>
              {deferredPrompt && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-4 text-center">
                  <p className="mb-3 text-xs text-indigo-300">
                    Your browser supports 1-click automatic installation!
                  </p>
                  <button
                    onClick={handleInstallClick}
                    className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-500 py-2.5 font-medium text-white shadow-lg shadow-indigo-500/25 transition-transform hover:scale-[1.02]"
                  >
                    Click to Install on Android
                  </button>
                </div>
              )}

              <div className="space-y-3">
                <div className="font-semibold text-white">How to Install on Android (Chrome):</div>
                <ol className="space-y-2.5 text-xs">
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-indigo-400">1</span>
                    <span>Open the public shareable link in <strong>Google Chrome</strong> on your Android phone.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-indigo-400">2</span>
                    <span>Tap the <strong>three vertical dots menu (⋮)</strong> at the top-right corner of Chrome.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-indigo-400">3</span>
                    <span>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 font-bold text-indigo-400">4</span>
                    <span>Confirm by clicking <strong>Add / Install</strong>. The app will be placed directly in your Android App Drawer and Home Screen with its custom logo and standalone windowing!</span>
                  </li>
                </ol>
              </div>

              {/* Technical Distinction Note */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">
                <div className="flex items-center gap-2 font-medium text-slate-300">
                  <Info className="h-4 w-4 text-indigo-400" />
                  <span>PWA vs Standalone APK:</span>
                </div>
                <p className="mt-1 leading-relaxed">
                  This application is distributed as a <strong>modern Progressive Web App (WebAPK)</strong>. It provides full offline access, home-screen launch, and push notifications without requiring APK sideloading or enabling third-party unknown sources.
                </p>
              </div>
            </>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-800 pt-4">
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
