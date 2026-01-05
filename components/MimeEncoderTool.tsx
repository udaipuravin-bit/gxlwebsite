
import React, { useState, useRef, useEffect } from 'react';
import { 
  ArrowLeft, 
  Code2, 
  Download, 
  Copy, 
  Check, 
  Trash2, 
  Bold, 
  Italic, 
  Underline, 
  AlertCircle, 
  ArrowRight, 
  Monitor,
  Zap
} from 'lucide-react';
import { MimeEncodingType } from '../types';
import { processMimeContent } from '../services/mimeService';

interface MimeEncoderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const FONT_FAMILIES = [
  'Arial, sans-serif',
  'Times New Roman, serif',
  'Verdana, sans-serif',
  'Courier New, monospace',
  'Georgia, serif',
  'Impact, sans-serif',
  'Tahoma, sans-serif'
];

const FONT_SIZES = ['12px', '14px', '16px', '18px', '24px', '32px'];

const COLORS = [
  '#f8fafc', '#94a3b8', '#1e293b', 
  '#ef4444', '#f59e0b', '#10b981', 
  '#3b82f6', '#6366f1', '#a855f7'
];

const EMOJIS = ['🚀', '🛡️', '✅', '⚠️', '✉️', '🔥', '🌍', '💎', '🎉'];

const MimeEncoderTool: React.FC<MimeEncoderToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodingType, setEncodingType] = useState<MimeEncodingType>('auto');
  const [detectedType, setDetectedType] = useState<'base64' | 'quoted-printable' | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRawPreview, setShowRawPreview] = useState(false);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const detectEncoding = (str: string): 'base64' | 'quoted-printable' => {
    const input = str.trim();
    if (!input) return 'base64';

    // Signs of Quoted-Printable: "=XX" sequences or soft line breaks "=\r\n"
    const qpMatches = (input.match(/=[0-9A-Fa-f]{2}/g) || []).length;
    const hasSoftLineBreak = /=\r?\n/.test(input);
    
    // Signs of Base64: long continuous block of alphanumeric characters + "/" and "+"
    const cleanB64 = input.replace(/\s/g, '');
    const isBase64Dense = /^[A-Za-z0-9+/=]+$/.test(cleanB64);

    if (qpMatches > 0 || hasSoftLineBreak) {
      return 'quoted-printable';
    }
    
    if (isBase64Dense && cleanB64.length > 4) {
      return 'base64';
    }

    return 'quoted-printable'; // Safe fallback
  };

  const handleEditorChange = () => {
    if (editorRef.current) {
      setInputText(editorRef.current.innerHTML);
    }
  };

  useEffect(() => {
    try {
      if (!inputText.trim()) {
        setOutputText('');
        setDetectedType(null);
        setError(null);
        return;
      }

      let activeType: 'base64' | 'quoted-printable' = 'base64';
      
      if (mode === 'decode' && encodingType === 'auto') {
        activeType = detectEncoding(inputText);
        setDetectedType(activeType);
      } else {
        activeType = encodingType === 'auto' ? 'base64' : encodingType;
        setDetectedType(null);
      }

      if (mode === 'encode') {
        const encoded = processMimeContent(inputText, activeType, 'encode');
        setOutputText(encoded);
      } else {
        const decoded = processMimeContent(inputText, activeType, 'decode');
        setOutputText(decoded);
      }
      setError(null);
    } catch (e) {
      setOutputText('');
      setDetectedType(null);
      setError(e instanceof Error ? e.message : 'Processing failed');
    }
  }, [inputText, encodingType, mode]);

  const handleCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleEditorChange();
  };

  const insertEmoji = (emoji: string) => {
    document.execCommand('insertText', false, emoji);
    handleEditorChange();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const downloadTxt = () => {
    const blob = new Blob([outputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mime_output_${encodingType}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clear = () => {
    setInputText('');
    setOutputText('');
    setDetectedType(null);
    if (editorRef.current) editorRef.current.innerHTML = '';
  };

  const cardClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const headerClasses = isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200';
  const subCardClasses = isDark ? 'bg-slate-950/20' : 'bg-slate-50';

  return (
    <div className={`h-[calc(100vh-64px)] flex flex-col p-4 md:p-6 lg:p-6 gap-4 max-w-full mx-auto animate-in fade-in duration-500 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl shadow-xl border backdrop-blur-md ${headerClasses}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-fuchsia-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg">
              <Code2 size={22} />
            </div>
            <div>
              <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>MIME Forensic Suite</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">UTF-8 • HTML Sandbox • Auto-Detection</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
           <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button 
                onClick={() => { setMode('encode'); if (encodingType === 'auto') setEncodingType('base64'); }}
                className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'encode' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Encode
              </button>
              <button 
                onClick={() => setMode('decode')}
                className={`px-6 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${mode === 'decode' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Decode
              </button>
           </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-2 lg:gap-4 relative">
        <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border shadow-xl overflow-hidden group/pane ${cardClasses}`}>
           <div className={`${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} shrink-0 px-4 py-3 border-b flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-pulse shadow-[0_0_8px_rgba(217,70,239,0.5)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-fuchsia-500/80">1. Source Input</h3>
              </div>
              <button onClick={clear} className="text-slate-600 hover:text-rose-400 transition-colors" title="Clear All">
                <Trash2 size={14} />
              </button>
           </div>

           {mode === 'encode' && (
              <div className={`${isDark ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-100/50 border-slate-100'} shrink-0 px-3 py-1.5 border-b flex flex-wrap gap-1 overflow-x-auto no-scrollbar`}>
                 <ToolbarButton isDark={isDark} onClick={() => handleCommand('bold')} icon={<Bold size={12}/>} title="Bold" />
                 <ToolbarButton isDark={isDark} onClick={() => handleCommand('italic')} icon={<Italic size={12}/>} title="Italic" />
                 <ToolbarButton isDark={isDark} onClick={() => handleCommand('underline')} icon={<Underline size={12}/>} title="Underline" />
                 <div className="w-px h-3 bg-slate-700 mx-0.5 self-center" />
                 <select onChange={(e) => handleCommand('fontSize', e.target.value)} className="bg-transparent text-[9px] font-bold text-slate-500 outline-none cursor-pointer">
                    <option value="3">Size</option>
                    {FONT_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
                 <select onChange={(e) => handleCommand('fontName', e.target.value)} className="bg-transparent text-[9px] font-bold text-slate-500 outline-none cursor-pointer max-w-[60px]">
                    <option value="Arial">Font</option>
                    {FONT_FAMILIES.map(f => <option key={f} value={f}>{f.split(',')[0]}</option>)}
                 </select>
                 <div className="w-px h-3 bg-slate-700 mx-0.5 self-center" />
                 <div className="flex gap-1 items-center">
                    {EMOJIS.slice(0, 4).map(e => (
                      <button key={e} onClick={() => insertEmoji(e)} className="text-[10px]">{e}</button>
                    ))}
                 </div>
              </div>
           )}

           <div className="flex-1 overflow-hidden relative">
              {mode === 'encode' ? (
                <div 
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorChange}
                  className={`w-full h-full p-4 outline-none overflow-auto custom-scrollbar whitespace-pre-wrap break-all transition-colors ${subCardClasses} ${isDark ? 'text-slate-300 focus:bg-slate-950/40' : 'text-slate-700 focus:bg-white'}`}
                  data-placeholder="Draft content or paste HTML here..."
                />
              ) : (
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className={`w-full h-full p-4 border-none outline-none font-mono text-[10px] resize-none overflow-auto custom-scrollbar transition-colors ${subCardClasses} ${isDark ? 'text-slate-400 focus:bg-slate-950/40' : 'text-slate-600 focus:bg-white'}`}
                  placeholder="Paste encoded content for inspection..."
                />
              )}
           </div>
        </section>

        <div className={`hidden lg:flex items-center justify-center ${isDark ? 'text-slate-800' : 'text-slate-300'}`}>
           <ArrowRight className="animate-pulse" size={20} />
        </div>

        <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border shadow-xl overflow-hidden group/pane ${cardClasses}`}>
           <div className={`${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} shrink-0 px-4 py-3 border-b flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80">2. Result Code</h3>
              </div>
              <div className="flex items-center gap-2">
                 <select 
                    value={encodingType}
                    onChange={(e) => setEncodingType(e.target.value as MimeEncodingType)}
                    className={`${isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'} rounded px-2 py-0.5 text-[9px] font-black uppercase tracking-tighter outline-none cursor-pointer hover:border-slate-500 transition-colors`}
                 >
                   {mode === 'decode' && <option value="auto">✨ Auto Detect</option>}
                   <option value="base64">Base64</option>
                   <option value="quoted-printable">Quoted-Printable</option>
                 </select>
                 <button onClick={copyToClipboard} className="p-1 text-slate-500 hover:text-indigo-400 transition-colors" title="Copy">
                    {isCopied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                 </button>
                 <button onClick={downloadTxt} className="p-1 text-slate-500 hover:text-white transition-colors" title="Download">
                    <Download size={14} />
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-hidden flex flex-col">
              <textarea
                readOnly
                value={outputText}
                className={`w-full flex-1 p-4 border-none outline-none font-mono text-[10px] resize-none overflow-auto custom-scrollbar ${isDark ? 'bg-slate-950/40 text-indigo-400' : 'bg-slate-100 text-indigo-700'}`}
                placeholder="Results will process automatically..."
              />
              <div className={`${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} shrink-0 px-4 py-2 border-t flex items-center justify-between`}>
                 <div className="flex gap-4">
                   <div className="flex flex-col">
                      <span className="text-[7px] font-black uppercase text-slate-600 tracking-tighter">Format</span>
                      <span className={`text-[9px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>text/html</span>
                   </div>
                 </div>
                 {detectedType && (
                   <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md animate-in slide-in-from-right-2">
                     <Zap size={10} className="text-indigo-400" />
                     <span className="text-[8px] font-black uppercase text-indigo-400">Detected: {detectedType.replace('-', ' ')}</span>
                   </div>
                 )}
              </div>
           </div>
        </section>

        <div className={`hidden lg:flex items-center justify-center ${isDark ? 'text-slate-800' : 'text-slate-300'}`}>
           <ArrowRight className="animate-pulse" size={20} />
        </div>

        <section className={`flex-1 min-h-0 flex flex-col rounded-2xl border shadow-2xl overflow-hidden group/pane ring-1 ring-emerald-500/10 ${cardClasses}`}>
           <div className={`${isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'} shrink-0 px-4 py-3 border-b flex items-center justify-between`}>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                 <h3 className="text-[10px] font-black uppercase tracking-widest text-emerald-500/80">3. Live Render</h3>
              </div>
              <button 
                onClick={() => setShowRawPreview(!showRawPreview)}
                className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter transition-all ${showRawPreview ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500 hover:text-slate-300'}`}
              >
                 {showRawPreview ? 'Visual' : 'Raw HTML'}
              </button>
           </div>
           
           <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden m-2 rounded-lg shadow-inner">
              <div className="shrink-0 bg-slate-200/50 px-3 py-1 flex items-center gap-1.5 border-b border-slate-300/50">
                 <Monitor size={10} className="text-slate-400" />
                 <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Client Sandbox</span>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar p-4">
                 {showRawPreview ? (
                   <pre className="text-[10px] text-slate-800 font-mono whitespace-pre-wrap break-all leading-tight">
                      {mode === 'encode' ? inputText : outputText}
                   </pre>
                 ) : (
                   <div 
                    className="w-full h-full text-black rich-text-preview break-words text-sm"
                    dangerouslySetInnerHTML={{ __html: (mode === 'encode' ? inputText : outputText) || '<div class="text-slate-300 italic text-xs py-10 text-center">Awaiting data...</div>' }}
                   />
                 )}
              </div>
           </div>

           {error && (
              <div className="absolute bottom-4 left-4 right-4 p-2 bg-rose-500 text-white rounded-lg flex items-center gap-2 shadow-2xl animate-in slide-in-from-bottom-2">
                 <AlertCircle size={14} />
                 <p className="text-[9px] font-bold uppercase">{error}</p>
              </div>
           )}
        </section>
      </div>

      <footer className={`shrink-0 pt-3 border-t flex justify-between items-center text-[9px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro</p>
        <div className="flex gap-4">
          <span className="opacity-50">RFC Standards Compliant</span>
        </div>
      </footer>
    </div>
  );
};

const ToolbarButton: React.FC<{ onClick: () => void; icon: React.ReactNode; title: string; isDark: boolean }> = ({ onClick, icon, title, isDark }) => (
  <button 
    onClick={onClick}
    className={`p-1.5 rounded transition-all shrink-0 ${isDark ? 'text-slate-400 hover:text-fuchsia-400 hover:bg-slate-700/50' : 'text-slate-500 hover:text-fuchsia-600 hover:bg-slate-100'}`}
    title={title}
  >
    {icon}
  </button>
);

export default MimeEncoderTool;
