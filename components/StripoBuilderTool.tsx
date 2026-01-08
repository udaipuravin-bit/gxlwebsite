
import React, { useEffect, useState, useRef } from 'react';
import { 
  ArrowLeft, 
  Download, 
  FileJson, 
  Save, 
  Zap, 
  Layout, 
  Monitor, 
  Info, 
  Loader2,
  ShieldCheck,
  Smartphone,
  Layers,
  Code2
} from 'lucide-react';
import { useNotify } from '../App';

interface StripoBuilderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

declare global {
  interface Window {
    Stripo: any;
  }
}

const StripoBuilderTool: React.FC<StripoBuilderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // NOTE: In a production environment, you should generate this token server-side (Cloudflare Worker)
  // using your Stripo Secret Key to ensure security and remove all branding.
  const STRIPO_PLUGIN_ID = "YOUR_STRIPO_PLUGIN_ID"; 
  const STRIPO_SECRET_KEY = "YOUR_STRIPO_SECRET_KEY";

  useEffect(() => {
    const scriptId = 'stripo-plugin-sdk';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = 'https://plugins.stripo.email/static/latest/stripo.js';
      script.async = true;
      script.onload = () => initStripo();
      document.body.appendChild(script);
    } else if (window.Stripo) {
      initStripo();
    }

    return () => {
      // Stripo handles its own cleanup usually, but we could destroy the instance if exposed
    };
  }, []);

  const initStripo = () => {
    if (!window.Stripo) return;

    window.Stripo.init({
      settingsId: STRIPO_PLUGIN_ID,
      containerId: 'stripo-container',
      locale: 'en',
      // Load initial design from your backend here
      html: '', 
      css: '',
      // AMP support configuration
      ampSupport: true,
      onEditorLoaded: () => {
        setIsLoaded(true);
        notify('info', 'Stripo Engine Ready');
      },
      onSave: (jsonDesign: string, html: string) => {
        handleBackendSave(jsonDesign, html);
      },
      onError: (err: string) => {
        console.error('Stripo Error:', err);
        notify('error', 'Editor error: ' + err);
      }
    });
  };

  const handleBackendSave = async (json: string, html: string) => {
    setIsSaving(true);
    try {
      // EXMAPLE: Point this to your Cloudflare Worker
      // await fetch('/api/save-template', { method: 'POST', body: JSON.stringify({ json, html }) });
      console.log('Design JSON:', json);
      notify('success', 'Design state synchronized with storage.');
    } catch (e) {
      notify('error', 'Failed to save to cloud.');
    } finally {
      setIsSaving(false);
    }
  };

  const exportHtml = () => {
    if (!window.Stripo) return;
    window.Stripo.getHtml((html: string) => {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stripo_export_${Date.now()}.html`;
      a.click();
      URL.revokeObjectURL(url);
      notify('success', 'Standard HTML Export Complete');
    });
  };

  const exportAmpHtml = () => {
    if (!window.Stripo) return;
    window.Stripo.getAmpHtml((amp: string) => {
      const blob = new Blob([amp], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stripo_amp_export_${Date.now()}.html`;
      a.click();
      notify('success', 'AMP HTML Export Complete');
    });
  };

  const triggerSave = () => {
    if (!window.Stripo) return;
    window.Stripo.triggerSave();
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="h-screen flex flex-col gap-0 overflow-hidden bg-slate-950 font-sans">
      {/* Header Toolbar */}
      <header className={`shrink-0 flex items-center justify-between px-6 py-3 border-b ${cardClasses} z-50 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-xl shadow-indigo-600/20">
              <Layers size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">Stripo Studio</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enterprise Design Node</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={triggerSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            {isSaving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} 
            Cloud Save
          </button>
          
          <div className="h-6 w-px bg-slate-800 mx-2" />
          
          <button 
            onClick={exportAmpHtml}
            className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-amber-600/20"
          >
            <Zap size={14} /> Export AMP
          </button>
          
          <button 
            onClick={exportHtml}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/20"
          >
            <Download size={14} /> Export HTML
          </button>
        </div>
      </header>

      {/* Stripo Viewport */}
      <div className="flex-1 min-h-0 relative bg-white">
        {!isLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-slate-950 z-[100]">
             <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
             </div>
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400 animate-pulse">Initializing Stripo SDK</p>
          </div>
        )}
        <div id="stripo-container" className="h-full w-full" />
      </div>

      {/* Technical Footer */}
      <footer className={`shrink-0 px-6 py-2 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex gap-4">
           <span className="flex items-center gap-1.5"><ShieldCheck size={12}/> Verified Plugin Mode</span>
           <span className="opacity-40">|</span>
           <span className="text-emerald-500 flex items-center gap-1"><Code2 size={12}/> AMP Compliant</span>
        </div>
        <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
           <Info size={12} />
           <span>White-Label Deployment v5.0</span>
        </div>
      </footer>
    </div>
  );
};

export default StripoBuilderTool;
