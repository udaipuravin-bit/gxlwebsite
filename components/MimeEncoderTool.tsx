import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Zap, 
  FileText,
  Eye,
  AlertCircle,
  Hash,
  Terminal,
  ArrowRightLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Info
} from 'lucide-react';
import { processMimeContent } from '../services/mimeService';
import { useNotify } from '../App';

interface MimeEncoderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
  initialData?: string;
}

const PLACEHOLDER_CONTENT = `<html>
<body>
  <h1 style='color: #6366f1;'>Welcome! 🚀</h1>
  <p>Deliverability testing for ✨ emojis and 📧 symbols.</p>
  <div style='background: #f1f5f9; padding: 20px; border-radius: 8px;'>Valid HTML & CSS styles preserved.</div>
</body>
</html>`;

const MimeEncoderTool: React.FC<MimeEncoderToolProps> = ({ onBack, theme, initialData }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  // Logic State - Set to empty string by default so user doesn't have to delete it
  const [input, setInput] = useState(initialData || '');
  const [output, setOutput] = useState('');
  const [method, setMethod] = useState<'base64' | 'quoted-printable' | 'auto'>('auto');
  const [opMode, setOpMode] = useState<'encode' | 'decode'>(initialData ? 'decode' : 'encode');
  
  // UI State
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Default to Auto-Detect when entering Decode mode
  useEffect(() => {
    if (opMode === 'decode') {
      setMethod('auto');
    } else if (method === 'auto') {
      // Auto isn't an encoding method, switch to a valid one when going back to encode
      setMethod('quoted-printable');
    }
  }, [opMode]);

  // Core Processing Engine
  useEffect(() => {
    try {
      if (!input.trim()) {
        setOutput('');
        setError(null);
        return;
      }
      const result = processMimeContent(input, method, opMode, true);
      setOutput(result);
      setError(null);
    } catch (e: any) {
      setOutput('');
      setError(e.message || 'Protocol Processing Error');
    }
  }, [input, method, opMode]);

  // Visual Audit Sync
  const previewHtml = useMemo(() => {
    if (error) return `<!DOCTYPE html><html><body style="background:#0f172a;color:#ef4444;font-family:sans-serif;padding:40px;text-align:center;"><h3>Decoding Error</h3><p>${error}</p></body></html>`;
    
    // If input is empty, show empty state in preview
    if (!input.trim() && opMode === 'encode') {
      return `<!DOCTYPE html><html><body style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;color:#94a3b8;background:#f8fafc;text-transform:uppercase;font-weight:900;letter-spacing:0.2em;font-size:11px;">Awaiting Input Matrix...</body></html>`;
    }

    const contentToRender = opMode === 'decode' ? output : input;
    return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:20px; font-family: sans-serif; color: ${isDark ? '#e2e8f0' : '#1e293b'};">${contentToRender}</body></html>`;
  }, [input, output, opMode, error, isDark]);

  const copyToClipboard = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    setIsCopied(true);
    notify('success', 'Forensic stream copied.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadPayload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mime_${method}_${opMode}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Download initiated.');
  };

  const inputClasses = isDark ? 'bg-[#020617] text-slate-300 border-slate-800' : 'bg-slate-50 text-slate-800 border-slate-200';
  const panelHeader = isDark ? 'bg-slate-900 border-b border-slate-800' : 'bg-white border-b border-slate-200';

  return (
    <div className={`h-screen flex flex-col ${isDark ? 'bg-slate-950' : 'bg-slate-100'} animate-in fade-in duration-500 overflow-hidden`}>
      {/* Primary Header */}
      <header className={`shrink-0 flex items-center justify-between p-4 border-b ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'} z-50`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-lg">
              <Code2 size={20} />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-black uppercase tracking-[0.15em] text-indigo-500 leading-none mb-1">MIME Forensic Studio</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Intelligence Matrix</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
           {/* Logic Switch */}
           <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button 
                onClick={() => setOpMode('encode')} 
                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${opMode === 'encode' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Encode
              </button>
              <button 
                onClick={() => setOpMode('decode')} 
                className={`px-5 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${opMode === 'decode' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Decode
              </button>
           </div>

           {/* Protocol Modes */}
           <div className="flex items-center gap-1">
             <ProtocolToggle 
               active={method === 'base64'} 
               onClick={() => setMethod('base64')} 
               label="B64" 
               isDark={isDark} 
             />
             <ProtocolToggle 
               active={method === 'quoted-printable'} 
               onClick={() => setMethod('quoted-printable')} 
               label="QP" 
               isDark={isDark} 
             />
             {opMode === 'decode' && (
               <ProtocolToggle 
                 active={method === 'auto'} 
                 onClick={() => setMethod('auto')} 
                 label="Auto-Detect" 
                 isDark={isDark} 
                 accent="emerald"
               />
             )}
           </div>
        </div>
      </header>

      {/* Main Workspace: Three Side-by-Side Columns */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Column 1: Source Matrix */}
        <div className="flex-1 flex flex-col border-r border-slate-800/50">
          <div className={`${panelHeader} px-4 py-2.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Terminal size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">1. Source Matrix</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => { setInput(PLACEHOLDER_CONTENT); setOpMode('encode'); }} 
                className="p-1 text-slate-500 hover:text-indigo-400" 
                title="Load Example Template"
              >
                <Info size={14} />
              </button>
              <button onClick={() => setInput('')} className="p-1 text-slate-600 hover:text-rose-500 transition-colors">
                <Trash2 size={14}/>
              </button>
            </div>
          </div>
          <div className="flex-1 relative">
            <textarea 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              spellCheck={false}
              className={`w-full h-full p-6 outline-none font-mono text-xs leading-relaxed resize-none custom-scrollbar ${inputClasses}`}
              placeholder={PLACEHOLDER_CONTENT}
            />
          </div>
        </div>

        {/* Column 2: Protocol Stream Buffer */}
        <div className="flex-1 flex flex-col border-r border-slate-800/50">
          <div className={`${panelHeader} px-4 py-2.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Hash size={14} className="text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">2. {opMode === 'encode' ? 'Encoded' : 'Decoded'} Buffer</span>
            </div>
            <div className="flex gap-3">
               <button onClick={downloadPayload} className="p-1 text-slate-500 hover:text-white" title="Download Payload">
                 <Download size={14}/>
               </button>
               <button onClick={copyToClipboard} className="p-1 text-slate-500 hover:text-white" title="Copy Buffer">
                 <Copy size={14}/>
               </button>
            </div>
          </div>
          <div className="flex-1 relative bg-[#05080f]">
            {error ? (
              <div className="h-full flex flex-col items-center justify-center p-8 text-center text-rose-500 gap-3">
                <AlertCircle size={32} strokeWidth={1} />
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">{error}</p>
              </div>
            ) : (
              <textarea 
                readOnly
                value={output}
                className="w-full h-full bg-transparent p-6 outline-none font-mono text-[11px] leading-relaxed resize-none custom-scrollbar text-emerald-400/80 selection:bg-emerald-500/20"
                placeholder="Result stream buffer..."
              />
            )}
            {!error && output && (
              <div className="absolute bottom-4 right-4 pointer-events-none">
                 <span className="text-[9px] font-black bg-black/40 px-2 py-1 rounded border border-slate-800 text-slate-600 uppercase tracking-widest">
                   SIZE: {new Blob([output]).size} octets
                 </span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Live Visual Audit */}
        <div className="flex-1 flex flex-col">
          <div className={`${panelHeader} px-4 py-2.5 flex items-center justify-between`}>
            <div className="flex items-center gap-2">
              <Eye size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">3. Live Visual Audit</span>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">SYNC_ACTIVE</span>
            </div>
          </div>
          <div className="flex-1 bg-white relative">
            <iframe 
              srcDoc={previewHtml} 
              className="w-full h-full border-none"
              title="Forensic Visual Preview"
              sandbox="allow-popups"
            />
          </div>
        </div>
      </div>

      {/* Logical Footer Status */}
      <footer className={`shrink-0 border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'} px-6 py-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-500`}>
        <div className="flex gap-4">
          <span className="text-indigo-500 flex items-center gap-1.5">
            <Zap size={10} fill="currentColor" /> UTF-8 MULTI-BYTE READY
          </span>
          <span className="opacity-40">|</span>
          <span className="flex items-center gap-1.5">
            CODEC: {method.toUpperCase()}
          </span>
          <span className="opacity-40">|</span>
          <span className="text-emerald-500">RFC 2045/2047 COMPLIANT</span>
        </div>
        <div className="hidden md:flex gap-4 items-center">
           <span className="flex items-center gap-1"><FileText size={10}/> SMTP TRANSPORT READY</span>
           <span className="text-indigo-400">STUDIO V7.2</span>
        </div>
      </footer>
    </div>
  );
};

const ProtocolToggle = ({ active, onClick, label, isDark, accent = 'indigo' }: any) => {
  const activeColor = accent === 'emerald' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/50' : 'bg-indigo-600/10 text-indigo-400 border-indigo-500/50';
  return (
    <button 
      onClick={onClick} 
      className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${active ? activeColor : isDark ? 'bg-slate-800 border-slate-700 text-slate-500 hover:text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-500 hover:text-slate-700'}`}
    >
      {label}
    </button>
  );
};

export default MimeEncoderTool;