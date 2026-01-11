import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Type, 
  Copy, 
  Check, 
  Zap, 
  Search,
  Code,
  Layers,
  ChevronDown,
  Terminal,
  Activity,
  Trash2,
  Hash,
  Fingerprint,
  FlaskConical
} from 'lucide-react';
import { encodeBase64, encodeQuotedPrintable, encodeRFC2047 } from '../services/mimeService';
import { useNotify } from '../App';

interface SubjectEncoderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface EncodedVariant {
  id: string;
  label: string;
  value: string;
  collection: number;
}

const CHARSETS = [
  "UTF-8", "UTF-16", "ISO-8859-1", "ISO-8859-2", "ISO-8859-15",
  "Windows-1251", "Windows-1252", "US-ASCII", "KOI8-R", "Shift_JIS"
];

const SubjectEncoderTool: React.FC<SubjectEncoderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [subject, setSubject] = useState('');
  const [selectedCharset, setSelectedCharset] = useState('UTF-8');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const variants = useMemo(() => {
    if (!subject.trim()) return [];
    
    const uniqueStrings = new Set<string>();
    const results: EncodedVariant[] = [];

    const addUnique = (label: string, value: string, collection: number) => {
      if (!uniqueStrings.has(value)) {
        uniqueStrings.add(value);
        results.push({ id: `v-${results.length}`, label, value, collection });
      }
    };

    const words = subject.split(/\s+/);

    // --- Generate 100+ Unique Variants ---
    
    // 1. Core RFC formats across all charsets (approx 20 variants)
    CHARSETS.forEach(cs => {
      addUnique(`Base64 ${cs}`, encodeRFC2047(subject, 'B', cs), 1);
      addUnique(`Quoted-Printable ${cs}`, encodeRFC2047(subject, 'Q', cs), 2);
    });

    // 2. Recursive Chunking variations (approx 100 variants: 50 chunks * 2 modes)
    for (let size = 1; size <= 55; size++) {
      let b64Chunks = [];
      let qpChunks = [];
      for (let i = 0; i < subject.length; i += size) {
        const slice = subject.slice(i, i + size);
        b64Chunks.push(encodeRFC2047(slice, 'B', selectedCharset));
        qpChunks.push(encodeRFC2047(slice, 'Q', selectedCharset));
      }
      addUnique(`B64 Chunk [${size}]`, b64Chunks.join(' '), 1);
      addUnique(`QP Chunk [${size}]`, qpChunks.join(' '), 2);
    }

    // 3. Word-based variants (approx 5 variants)
    if (words.length > 1) {
      addUnique(`B64 Word-by-Word`, words.map(w => encodeRFC2047(w, 'B', selectedCharset)).join(' '), 3);
      addUnique(`QP Word-by-Word`, words.map(w => encodeRFC2047(w, 'Q', selectedCharset)).join(' '), 3);
      addUnique(`Alternating B/Q Words`, words.map((w, i) => encodeRFC2047(w, i % 2 === 0 ? 'B' : 'Q', selectedCharset)).join(' '), 3);
      addUnique(`Multi-Charset Mix`, words.map((w, i) => encodeRFC2047(w, 'B', CHARSETS[i % CHARSETS.length])).join(' '), 3);
    }

    // 4. Forensic Obfuscation (Collection 4)
    addUnique(`Full Hex QP Obfuscation`, encodeRFC2047(subject, 'Q', selectedCharset, true), 4);
    addUnique(`Double Encoded B64`, encodeRFC2047(encodeBase64(subject), 'B', selectedCharset), 4);

    return results;
  }, [subject, selectedCharset]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('success', 'Variant copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isInputDark = isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className={`min-h-screen flex flex-col px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 gap-4 max-w-full mx-auto animate-in fade-in duration-500 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-[2.5rem] shadow-2xl border backdrop-blur-xl ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-3 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-white border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-fuchsia-600 p-2 rounded-2xl text-white shadow-lg">
              <Type size={22} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-fuchsia-500">Subject Encoder</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Entropy Variant Lab</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-3xl flex flex-col md:flex-row gap-4">
          <div className={`relative flex-1 flex items-center p-1 rounded-2xl border transition-all ${isDark ? 'bg-slate-950 border-slate-800 focus-within:border-fuchsia-500' : 'bg-slate-100 border-slate-200 focus-within:border-fuchsia-400'}`}>
            <Terminal size={16} className="absolute left-4 text-fuchsia-500" />
            <input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Paste raw subject line for obfuscation analysis..."
              className="w-full pl-10 pr-4 py-3 bg-transparent outline-none font-bold text-base"
            />
          </div>
          <select value={selectedCharset} onChange={(e) => setSelectedCharset(e.target.value)} className={`px-4 py-3 rounded-2xl border font-black text-xs uppercase outline-none cursor-pointer ${isInputDark}`}>
            {CHARSETS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar p-2">
        {variants.length > 0 ? (
          <div className="flex flex-col gap-10 pb-20">
            <CollectionSection title="Matrix 1: Base64 Encodings" variants={variants.filter(v => v.collection === 1)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} />
            <CollectionSection title="Matrix 2: Quoted-Printable" variants={variants.filter(v => v.collection === 2)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} />
            <CollectionSection title="Matrix 3: Advanced Structure" variants={variants.filter(v => v.collection === 3)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} />
            <CollectionSection title="Matrix 4: Forensic Obfuscation" variants={variants.filter(v => v.collection === 4)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} />
          </div>
        ) : (
          <div className="h-[60vh] flex flex-col items-center justify-center opacity-20">
             <FlaskConical size={80} strokeWidth={1} />
             <p className="text-[12px] font-black uppercase tracking-[0.4em] mt-6">Engage Matrix Input Above</p>
          </div>
        )}
      </div>
    </div>
  );
};

const CollectionSection = ({ title, variants, onCopy, copiedId, isDark }: any) => {
  if (variants.length === 0) return null;
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-slate-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-800/50" />
        <span className="text-[10px] font-black text-slate-600 bg-slate-800/20 px-2 py-0.5 rounded uppercase">{variants.length} UNIQUE</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {variants.map((v: any) => (
          <div key={v.id} className={`group p-6 rounded-[2rem] border transition-all duration-300 ${isDark ? 'bg-slate-900 border-slate-800 hover:border-fuchsia-500/50' : 'bg-white border-slate-200 hover:shadow-xl'}`}>
            <div className="flex justify-between items-center mb-3">
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{v.label}</span>
               <button onClick={() => onCopy(v.value, v.id)} className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-400' : 'bg-slate-50 hover:bg-slate-100 text-slate-500'}`}>
                 {copiedId === v.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
               </button>
            </div>
            <div className={`p-4 rounded-2xl font-mono text-[13px] break-all leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-fuchsia-400' : 'bg-slate-50 border-slate-100 text-indigo-700'}`}>
               {v.value}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SubjectEncoderTool;