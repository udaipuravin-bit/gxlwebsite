import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Layout, 
  Download, 
  FileJson, 
  RotateCcw, 
  Zap, 
  Monitor,
  Info,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useNotify } from '../App';

interface EmailBuilderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

declare global {
  interface Window {
    unlayer: any;
  }
}

const EmailBuilderTool: React.FC<EmailBuilderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Tracking initialization to prevent race conditions
  const initialized = useRef(false);

  useEffect(() => {
    const scriptId = 'unlayer-core-sdk';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const onScriptLoad = () => {
      if (initialized.current) return;
      try {
        // Wait 500ms for window object to fully stabilize in some browsers
        setTimeout(() => {
          if (window.unlayer) {
            initEditor();
            initialized.current = true;
          } else {
            setLoadError('Unlayer core object not found after script load.');
          }
        }, 500);
      } catch (err) {
        setLoadError('Initialization failure.');
      }
    };

    const onScriptError = () => {
      setLoadError('Failed to load Unlayer SDK. This script might be blocked by browser extensions or firewall settings.');
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://editor.unlayer.com/embed.js';
      script.async = true;
      // Note: Removed crossOrigin anonymous to prevent opaque responses on some CDNs
      script.onload = onScriptLoad;
      script.onerror = onScriptError;
      document.body.appendChild(script);
    } else if (window.unlayer) {
      onScriptLoad();
    }

    return () => {};
  }, []);

  const initEditor = () => {
    if (window.unlayer) {
      try {
        window.unlayer.init({
          id: 'editor-canvas',
          projectId: 0,
          displayMode: 'email',
          appearance: {
            theme: isDark ? 'dark' : 'light',
            panels: {
              tools: {
                dock: 'right'
              }
            }
          },
          customCSS: `
            .blockbuilder-branding, .unlayer-branding { display: none !important; }
          `
        });
        setIsLoaded(true);
      } catch (e) {
        setLoadError('Failed to initialize Unlayer workspace.');
      }
    }
  };

  const handleExportHtml = () => {
    if (!window.unlayer) return;
    setIsExporting(true);
    window.unlayer.exportHtml((data: any) => {
      const { html } = data;
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email_template_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
      notify('success', 'Responsive HTML exported successfully.');
    });
  };

  const handleSaveDesign = () => {
    if (!window.unlayer) return;
    window.unlayer.saveDesign((design: any) => {
      const blob = new Blob([JSON.stringify(design, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `email_project_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      notify('success', 'Design JSON project exported.');
    });
  };

  const handleReset = () => {
    if (window.unlayer && window.confirm('Are you sure you want to clear the current workspace?')) {
      window.unlayer.loadDesign({
        body: {
          rows: [],
          values: { backgroundColor: '#ffffff' }
        }
      });
      notify('info', 'Workspace reset to blank state.');
    }
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="h-screen flex flex-col gap-0 overflow-hidden bg-slate-950">
      <header className={`shrink-0 flex items-center justify-between px-6 py-3 border-b ${cardClasses} z-50 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-xl shadow-indigo-600/20">
              <Layout size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Visual Studio</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Powered by Unlayer</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleReset}
            className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-600'}`}
            title="Clear Workspace"
          >
            <RotateCcw size={18} />
          </button>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <button 
            onClick={handleSaveDesign}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            <FileJson size={14} /> Save JSON
          </button>
          <button 
            onClick={handleExportHtml}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isExporting ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20'}`}
          >
            {isExporting ? <Loader2 className="animate-spin" size={14} /> : <Download size={14} />} 
            {isExporting ? 'Exporting...' : 'Export HTML'}
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative">
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-[110]">
             <AlertCircle className="text-rose-500" size={48} />
             <p className="text-sm font-bold text-rose-400 uppercase tracking-widest text-center px-8">{loadError}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest">Retry Reload</button>
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-[100]">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Initializing Unlayer Studio</p>
          </div>
        )}
        <div 
          id="editor-canvas" 
          className="w-full h-full"
          style={{ minHeight: '100%' }}
        />
      </div>

      <footer className={`shrink-0 px-6 py-2 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5"><Monitor size={12}/> Global Studio Instance</span>
           <span className="opacity-40">|</span>
           <span className="text-emerald-500">Production Mode Active</span>
        </div>
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity cursor-help">
           <Info size={12} />
           <span>Use JSON format to preserve project state across sessions</span>
        </div>
      </footer>
    </div>
  );
};

export default EmailBuilderTool;