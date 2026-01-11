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

const MimeEncoderTool: React.FC<MimeEncoderToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [encodingType, setEncodingType] = useState<MimeEncodingType>('auto');
  const [detectedType, setDetectedType] = useState<'base64' | 'quoted-printable' | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const editorRef = useRef<HTMLDivElement>(null);

  const detectEncoding = (str: string): 'base64' | 'quoted-printable' => {
    const input = str.trim();
    if (!input) return 'base64';
    const qpMatches = (input.match(/=[0-9A-Fa-f]{2}/g) || []).length;
    const hasSoftLineBreak = /=\r?\n/.test(input);
    const cleanB64 = input.replace(/\s/g, '');
    const isBase64Dense = /^[A-Za-z0-9+/=]+$/.test(cleanB64);
    if (qpMatches > 0 || hasSoftLineBreak) return 'quoted-printable';
    if (isBase64Dense && cleanB64.length > 4) return 'base64';
    return 'quoted-printable';
  };

  const handleEditorChange = () => {
    if (editorRef.current) setInputText(editorRef.current.innerHTML);
  };

  useEffect(() => {
    try {
      if (!inputText.trim()) { setOutputText(''); setDetectedType(null); setError(null); return; }
      let activeType: 'base64' | 'quoted-printable' = 'base64';
      if (mode === 'decode' && encodingType === 'auto') {
        activeType = detectEncoding(inputText);
        setDetectedType(activeType);
      } else {
        activeType = encodingType === 'auto' ? 'base64' : encodingType;
        setDetectedType(null);
      }
      if (mode === 'encode') setOutputText(processMimeContent(inputText, activeType, 'encode'));
      else setOutputText(processMimeContent(inputText, activeType, 'decode'));
      setError(null);
    } catch (e) { setOutputText(''); setDetectedType(null); setError('Processing failed'); }
  }, [inputText, encodingType, mode]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(outputText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-fuchsia-600 p-2 rounded-xl text-white">
              <Code2 size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-fuchsia-500">MIME Tool</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">RFC Protocol Forensic Node</p>
            </div>
          </div>
        </div>
        <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
           <button onClick={() => setMode('encode')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'encode' ? 'bg-fuchsia-600 text-white shadow-lg' : 'text-slate-500'}`}>Encode</button>
           <button onClick={() => setMode('decode')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${mode === 'decode' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}>Decode</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-[500px]">
        <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Forensic Input</h3>
             <button onClick={() => setInputText('')} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash2 size={16} /></button>
          </div>
          <textarea value={inputText} onChange={(e) => setInputText(e.target.value)} className={`flex-1 w-full p-5 border rounded-3xl outline-none font-mono text-[11px] resize-none custom-scrollbar leading-relaxed ${isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`} placeholder="Paste data for RFC processing..." />
        </div>

        <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
             <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Output Result</h3>
             <div className="flex items-center gap-2">
                <select value={encodingType} onChange={(e) => setEncodingType(e.target.value as MimeEncodingType)} className={`rounded-xl px-3 py-1.5 text-[9px] font-black border outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200'}`}>
                   {mode === 'decode' && <option value="auto">AUTO</option>}
                   <option value="base64">BASE64</option>
                   <option value="quoted-printable">QP</option>
                </select>
                <button onClick={copyToClipboard} className="p-2 bg-indigo-600/10 text-indigo-400 rounded-xl border border-indigo-500/20">{isCopied ? <Check size={16} /> : <Copy size={16} />}</button>
             </div>
          </div>
          <textarea readOnly value={outputText} className={`flex-1 w-full p-5 border rounded-3xl outline-none font-mono text-[11px] resize-none custom-scrollbar leading-relaxed ${isDark ? 'bg-[#05080f] border-[#1e293b] text-indigo-400' : 'bg-slate-100 border-slate-100 text-indigo-700'}`} placeholder="Processing matrix idle..." />
        </div>
      </div>
    </div>
  );
};

export default MimeEncoderTool;