import React, { useState, useEffect } from 'react';
import { DownloadCloud, Sparkles, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE } from '../api';

export const CURRENT_APP_VERSION = '4.5';
export const CURRENT_VERSION_CODE = 33;

export interface AppVersionInfo {
  version: string;
  versionCode: number;
  minVersionCode: number;
  apkUrl: string;
  downloadUrl: string;
  releaseNotes: string;
  forceUpdate?: boolean;
}

interface InAppUpdateBannerProps {
  onDismiss?: () => void;
  showAlwaysIfAvailable?: boolean;
}

export const InAppUpdateBanner: React.FC<InAppUpdateBannerProps> = ({
  onDismiss,
  showAlwaysIfAvailable = true
}) => {
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const base = API_BASE.replace(/\/api\/?$/, '');
        const res = await fetch(`${base}/api/app-version`);
        if (res.ok) {
          const data: AppVersionInfo = await res.json();
          // If remote version code is higher, or remote version != current
          if (data && (data.versionCode > CURRENT_VERSION_CODE || data.version !== CURRENT_APP_VERSION)) {
            setUpdateInfo(data);
          }
        }
      } catch (e) {
        // Silent catch for offline or initial load
      }
    };

    checkVersion();
  }, []);

  if (!updateInfo || isDismissed) {
    return null;
  }

  const handleStartUpdate = () => {
    setIsDownloading(true);
    const base = API_BASE.replace(/\/api\/?$/, '');
    const apkUrl = updateInfo.downloadUrl || `${base}/QuickServe_Latest.apk`;
    
    // Trigger direct APK download - Android prompts "Do you want to install an update to this app?"
    window.location.href = apkUrl;

    setTimeout(() => {
      setIsDownloading(false);
    }, 4000);
  };

  return (
    <div className="bg-gradient-to-r from-pink-600 via-rose-600 to-indigo-700 text-white px-4 py-2.5 shadow-lg border-b border-pink-400/30 flex items-center justify-between gap-3 sticky top-0 z-50 animate-fadeIn">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0 border border-white/30">
          <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-tight truncate">
              Naya QuickServe v{updateInfo.version} Available!
            </span>
            <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-semibold text-pink-100 hidden sm:inline">
              Bina Uninstall kiye Update
            </span>
          </div>
          <p className="text-[11px] text-pink-100 truncate">
            {updateInfo.releaseNotes || 'Naye features aur fast performance ke sath direct update karein.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={handleStartUpdate}
          disabled={isDownloading}
          className="px-3 py-1.5 bg-white text-pink-700 hover:bg-pink-50 active:scale-95 text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
        >
          {isDownloading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Downloading...</span>
            </>
          ) : (
            <>
              <DownloadCloud className="w-3.5 h-3.5" />
              <span>Update Now</span>
            </>
          )}
        </button>

        {!updateInfo.forceUpdate && (
          <button
            type="button"
            onClick={() => {
              setIsDismissed(true);
              if (onDismiss) onDismiss();
            }}
            className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded-md transition-colors"
            title="Baad me update karein"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};
