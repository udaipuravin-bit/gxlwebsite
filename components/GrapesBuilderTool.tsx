import React, { useEffect, useRef, useState } from 'react';
import { 
  ArrowLeft, 
  Download, 
  FileJson, 
  RotateCcw, 
  Box, 
  Monitor, 
  Smartphone, 
  AlertCircle,
  Loader2,
  Palette,
  ShieldCheck
} from 'lucide-react';
import { useNotify } from '../App';

interface GrapesBuilderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const GrapesBuilderTool: React.FC<GrapesBuilderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const editorRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activeDevice, setActiveDevice] = useState<'desktop' | 'mobile'>('desktop');

  useEffect(() => {
    const loadGrapes = async () => {
      try {
        if ((window as any).grapesjs) {
          initGrapes();
          return;
        }

        // 1. Load Styles
        const linkId = 'grapesjs-css';
        if (!document.getElementById(linkId)) {
          const link = document.createElement('link');
          link.id = linkId;
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/grapesjs/dist/css/grapes.min.css';
          document.head.appendChild(link);
        }

        // 2. Sequential script loading (Core then Plugin)
        const coreId = 'grapesjs-core';
        if (!document.getElementById(coreId)) {
          const script = document.createElement('script');
          script.id = coreId;
          script.src = 'https://unpkg.com/grapesjs@latest';
          script.async = true;
          script.onload = () => {
            const pluginId = 'grapesjs-preset';
            const presetScript = document.createElement('script');
            presetScript.id = pluginId;
            presetScript.src = 'https://unpkg.com/grapesjs-preset-newsletter@latest';
            presetScript.async = true;
            presetScript.onload = () => {
              // Safety verification loop for the global object
              let retries = 0;
              const checkReady = setInterval(() => {
                if ((window as any).grapesjs) {
                  clearInterval(checkReady);
                  initGrapes();
                } else if (retries > 20) {
                  clearInterval(checkReady);
                  setLoadError('Markup engine "grapesjs" failed to initialize after 2 seconds.');
                }
                retries++;
              }, 100);
            };
            presetScript.onerror = () => setLoadError('Preset plugins failed to load.');
            document.body.appendChild(presetScript);
          };
          script.onerror = () => setLoadError('Markup core engine failed to load.');
          document.body.appendChild(script);
        } else if ((window as any).grapesjs) {
           initGrapes();
        }
      } catch (err) {
        setLoadError('Design engine catastrophic load failure.');
      }
    };

    loadGrapes();

    return () => {
      if (editorRef.current) {
        try { editorRef.current.destroy(); } catch (e) {}
        editorRef.current = null;
      }
    };
  }, []);

  const initGrapes = () => {
    if (editorRef.current || !(window as any).grapesjs) return;

    try {
      const editor = (window as any).grapesjs.init({
        container: '#gjs',
        height: '100%',
        width: 'auto',
        storageManager: {
          type: 'local',
          autosave: true,
          stepsBeforeSave: 1,
          prefix: 'gjs-markup-',
        },
        plugins: ['gjs-preset-newsletter'],
        pluginsOpts: {
          'gjs-preset-newsletter': {
            modalTitleImport: 'Import Markup',
          }
        },
        deviceManager: {
          devices: [
            { name: 'Desktop', width: '' },
            { name: 'Mobile', width: '320px', widthMedia: '480px' }
          ]
        }
      });

      // UI Theming
      const gjsContainer = document.querySelector('.gjs-editor-cont');
      if (gjsContainer) {
        if (isDark) gjsContainer.classList.add('gjs-dark');
        else gjsContainer.classList.remove('gjs-dark');
      }

      editorRef.current = editor;
      setIsLoaded(true);
    } catch (e) {
      setLoadError('Markup Studio initialization failure. Try refreshing your cache.');
    }
  };

  const exportHtml = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.runCommand('gjs-get-inlined-html');
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markup_template_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Email-compliant HTML exported.');
  };

  const exportJson = () => {
    if (!editorRef.current) return;
    const json = JSON.stringify(editorRef.current.getProjectData(), null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `markup_project_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Project data exported.');
  };

  const resetEditor = () => {
    if (editorRef.current && window.confirm('Clear canvas and reset project?')) {
      editorRef.current.DomComponents.clear();
      editorRef.current.CssComposer.clear();
      notify('info', 'Studio canvas reset.');
    }
  };

  const setDevice = (device: 'desktop' | 'mobile') => {
    if (!editorRef.current) return;
    editorRef.current.setDevice(device === 'desktop' ? 'Desktop' : 'Mobile');
    setActiveDevice(device);
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="h-screen flex flex-col gap-0 overflow-hidden bg-slate-950 font-sans">
      <header className={`shrink-0 flex items-center justify-between px-6 py-3 border-b ${cardClasses} z-50 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-1.5 rounded-lg text-white shadow-xl shadow-emerald-600/20">
              <Box size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Markup Studio</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Powered by GrapesJS Core</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={() => setDevice('desktop')}
              className={`p-2 rounded-lg transition-all ${activeDevice === 'desktop' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Monitor size={14} />
            </button>
            <button 
              onClick={() => setDevice('mobile')}
              className={`p-2 rounded-lg transition-all ${activeDevice === 'mobile' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Smartphone size={14} />
            </button>
          </div>
          <div className="h-6 w-px bg-slate-800 mx-2" />
          <button onClick={resetEditor} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-rose-400' : 'bg-white border-slate-200 text-slate-600'}`}>
            <RotateCcw size={18} />
          </button>
          <button onClick={exportJson} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}>
            <FileJson size={14} /> JSON
          </button>
          <button onClick={exportHtml} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-600/20">
            <Download size={14} /> Export HTML
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 relative bg-slate-900">
        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-[110]">
             <AlertCircle className="text-rose-500" size={48} />
             <p className="text-sm font-bold text-rose-400 uppercase tracking-widest text-center px-8">{loadError}</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 rounded-lg text-xs font-black uppercase tracking-widest">Retry Engine</button>
          </div>
        )}
        {!isLoaded && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-[100]">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
                <div className="absolute inset-0 rounded-full border-t-4 border-emerald-500 animate-spin" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 animate-pulse">Initializing Markup Engine</p>
          </div>
        )}
        <div id="gjs" className="h-full w-full overflow-hidden" />
      </div>

      <footer className={`shrink-0 px-6 py-2 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5"><Palette size={12}/> Standalone Markup Studio</span>
           <span className="opacity-40">|</span>
           <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={12}/> Open-Source Core</span>
        </div>
        <div className="flex items-center gap-4 opacity-50">
           <span>RFC Compliant Markup</span>
           <span>v4.2.0-STABLE</span>
        </div>
      </footer>
      <style>{`.gjs-dark .gjs-one-bg { background-color: #0f172a !important; } .gjs-dark .gjs-two-bg { background-color: #05080f !important; } .gjs-dark .gjs-three-bg { background-color: #1e293b !important; } .gjs-dark .gjs-four-bg { background-color: #334155 !important; } .gjs-dark .gjs-color-active { color: #6366f1 !important; }`}</style>
    </div>
  );
};

export default GrapesBuilderTool;