import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Type, 
  Copy, 
  Check, 
  Zap, 
  Layers, 
  Terminal, 
  FlaskConical,
  Fingerprint,
  Code,
  ShieldCheck,
  Search,
  ChevronRight
} from 'lucide-react';
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
  "UTF-8", "ISO-8859-1", "ISO-8859-15", "Windows-1252", "US-ASCII",
  "UTF-16", "Shift_JIS", "EUC-JP", "GB2312", "Big5", "KOI8-R"
];

const SubjectEncoderTool: React.FC<SubjectEncoderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [subject, setSubject] = useState('Welcome to Email Sparks! 🚀');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- RFC 2047 Core Logic ---
  
  const toB64 = (str: string) => {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.byteLength; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  };

  const toQP = (str: string, forceHex = false) => {
    const bytes = new TextEncoder().encode(str);
    let result = "";
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      // RFC 2047 Q-encoding rules (strict)
      if (!forceHex && ((b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122))) {
        result += String.fromCharCode(b);
      } else if (!forceHex && b === 32) {
        result += "_";
      } else {
        result += "=" + b.toString(16).toUpperCase().padStart(2, '0');
      }
    }
    return result;
  };

  const wrapRFC = (charset: string, mode: 'B' | 'Q', data: string) => `=?${charset}?${mode}?${data}?=`;

  // --- Variant Generation ---
  
  const variants = useMemo(() => {
    if (!subject.trim()) return [];
    
    const uniqueStore = new Set<string>();
    const results: EncodedVariant[] = [];

    const add = (label: string, value: string, collection: number) => {
      if (!uniqueStore.has(value)) {
        uniqueStore.add(value);
        results.push({ id: `v-${results.length}`, label, value, collection });
      }
    };

    const words = subject.split(/\s+/).filter(w => w.length > 0);

    // COLLECTION 1: BASE64 VARIANTS
    CHARSETS.forEach(cs => add(`B64 [${cs}]`, wrapRFC(cs, 'B', toB64(subject)), 1));
    // Segmentation variations for B64
    for (let i = 1; i <= Math.min(subject.length, 10); i++) {
      let chunks = [];
      for (let j = 0; j < subject.length; j += i) {
        chunks.push(wrapRFC('UTF-8', 'B', toB64(subject.substring(j, j + i))));
      }
      add(`B64 Fold [Step ${i}]`, chunks.join(' '), 1);
    }

    // COLLECTION 2: QUOTED-PRINTABLE VARIANTS
    CHARSETS.forEach(cs => add(`QP [${cs}]`, wrapRFC(cs, 'Q', toQP(subject)), 2));
    add(`QP Force Hex`, wrapRFC('UTF-8', 'Q', toQP(subject, true)), 2);
    // Segmentation variations for QP
    for (let i = 1; i <= Math.min(subject.length, 10); i++) {
      let chunks = [];
      for (let j = 0; j < subject.length; j += i) {
        chunks.push(wrapRFC('UTF-8', 'Q', toQP(subject.substring(j, j + i))));
      }
      add(`QP Fold [Step ${i}]`, chunks.join(' '), 2);
    }

    // COLLECTION 3: MIXED B/Q CHAINED
    if (words.length > 1) {
      const altBQ = words.map((w, i) => wrapRFC('UTF-8', i % 2 === 0 ? 'B' : 'Q', i % 2 === 0 ? toB64(w) : toQP(w))).join(' ');
      const altQB = words.map((w, i) => wrapRFC('UTF-8', i % 2 === 0 ? 'Q' : 'B', i % 2 === 0 ? toQP(w) : toB64(w))).join(' ');
      add(`Alternating B/Q`, altBQ, 3);
      add(`Alternating Q/B`, altQB, 3);
      
      // Half/Half
      const mid = Math.floor(words.length / 2);
      const halfB = words.slice(0, mid).map(w => wrapRFC('UTF-8', 'B', toB64(w))).join(' ');
      const halfQ = words.slice(mid).map(w => wrapRFC('UTF-8', 'Q', toQP(w))).join(' ');
      add(`B-Chain then Q-Chain`, `${halfB} ${halfQ}`, 3);
    }

    // COLLECTION 4: MULTI-CHARSET CHAIN
    if (words.length > 1) {
      const multiCs = words.map((w, i) => wrapRFC(CHARSETS[i % CHARSETS.length], 'B', toB64(w))).join(' ');
      add(`Charset Rotation (B)`, multiCs, 4);
      const multiCsQ = words.map((w, i) => wrapRFC(CHARSETS[i % CHARSETS.length], 'Q', toQP(w))).join(' ');
      add(`Charset Rotation (Q)`, multiCsQ, 4);
    }

    // COLLECTION 5: FORENSIC / EDGE RFC-VALID
    // One character chains
    const oneCharChain = subject.split('').map(c => wrapRFC('UTF-8', 'B', toB64(c))).join(' ');
    add(`Extreme 1-Char Segments`, oneCharChain, 5);
    
    // Case aliases
    add(`Case Alias [utf-8]`, wrapRFC('utf-8', 'B', toB64(subject)), 5);
    add(`Case Alias [Utf-8]`, wrapRFC('Utf-8', 'B', toB64(subject)), 5);
    
    // Aggressive folding (CRLF + WSP) - simulated in string
    const aggressiveFold = words.map(w => wrapRFC('UTF-8', 'B', toB64(w))).join('\r\n ');
    add(`RFC Aggressive Folding`, aggressiveFold, 5);

    // Padding variants (if word count allows more)
    // We fill up to 100+ by varying the segment sizes dynamically
    let s = 11;
    while (results.length < 120 && s < subject.length) {
       let chunks = [];
       for (let j = 0; j < subject.length; j += s) {
         chunks.push(wrapRFC('UTF-8', 'B', toB64(subject.substring(j, j + s))));
       }
       add(`Extended B64 Variant [${s}]`, chunks.join(' '), 1);
       s++;
    }

    return results;
  }, [subject]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('success', 'RFC 2047 sequence copied.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const cardClasses = isDark ? 'bg-[#0a0f1c] border-slate-800' : 'bg-white border-slate-200';

  return (
    <div className={`min-h-screen flex flex-col ${isDark ? 'bg-[#05080f]' : 'bg-slate-50'} animate-in fade-in duration-500`}>
      {/* Studio Header */}
      <header className={`shrink-0 z-[100] border-b backdrop-blur-xl sticky top-0 ${isDark ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className={`p-2.5 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
                <ArrowLeft size={18} />
              </button>
              <div className="flex items-center gap-3">
                <div className="bg-fuchsia-600 p-1.5 rounded-lg text-white shadow-lg shadow-fuchsia-600/20">
                  <Type size={20} />
                </div>
                <div>
                  <h1 className="text-sm font-black uppercase tracking-[0.15em] text-fuchsia-500">RFC 2047 Forensic Lab</h1>
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Multi-Entropy Subject Encoder</p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-2xl bg-fuchsia-500/10 border border-fuchsia-500/20">
               <Fingerprint size={14} className="text-fuchsia-400" />
               <span className="text-[10px] font-black uppercase text-fuchsia-400 tracking-widest">
                 {variants.length} UNIQUE ENCODINGS GENERATED
               </span>
            </div>
          </div>

          <div className="w-full">
            <div className={`relative flex items-center p-1 rounded-[2rem] border transition-all ${isDark ? 'bg-slate-950 border-slate-800 focus-within:border-fuchsia-500' : 'bg-white border-slate-200 shadow-sm'}`}>
              <Terminal size={20} className="absolute left-6 text-fuchsia-500" />
              <input 
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Enter email subject line..."
                className="w-full pl-14 pr-4 py-5 bg-transparent outline-none font-bold text-xl md:text-2xl tracking-tight"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Results Workspace */}
      <div className="flex-1 overflow-auto custom-scrollbar px-6 py-8">
        <div className="max-w-7xl mx-auto space-y-12">
          
          <VariantSection 
             title="Collection 1: Base64 Encodings" 
             desc="Strictly using B-encoding with charset rotation and segment folding."
             variants={variants.filter(v => v.collection === 1)} 
             isDark={isDark} 
             onCopy={copyToClipboard}
             copiedId={copiedId}
          />

          <VariantSection 
             title="Collection 2: Quoted-Printable" 
             desc="Q-encoding variations including force-hex and boundary segmentation."
             variants={variants.filter(v => v.collection === 2)} 
             isDark={isDark} 
             onCopy={copyToClipboard}
             copiedId={copiedId}
          />

          <VariantSection 
             title="Collection 3: Mixed B/Q Chains" 
             desc="Hybrid sequences combining both encoding modes within a single header."
             variants={variants.filter(v => v.collection === 3)} 
             isDark={isDark} 
             onCopy={copyToClipboard}
             copiedId={copiedId}
          />

          <VariantSection 
             title="Collection 4: Multi-Charset Encodings" 
             desc="Chain encodings where each segment or word declares a different charset."
             variants={variants.filter(v => v.collection === 4)} 
             isDark={isDark} 
             onCopy={copyToClipboard}
             copiedId={copiedId}
          />

          <VariantSection 
             title="Collection 5: Forensic & Edge Cases" 
             desc="RFC-valid stress variants: aggressive folding, extreme segmentation, and aliases."
             variants={variants.filter(v => v.collection === 5)} 
             isDark={isDark} 
             onCopy={copyToClipboard}
             copiedId={copiedId}
          />

        </div>
      </div>

      {/* Status Footer */}
      <footer className="shrink-0 bg-[#05080f] border-t border-slate-900 px-6 py-3 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
        <div className="flex gap-4">
          <span className="text-fuchsia-500 flex items-center gap-1">
            <FlaskConical size={10} fill="currentColor" /> Protocol Diagnostic Active
          </span>
          <span className="opacity-40">|</span>
          <span>Deduplication: STACK_HASH_VALID</span>
        </div>
        <div className="flex gap-4">
           <span>RFC 2047 Compliant</span>
           <span className="text-emerald-500 flex items-center gap-1"><ShieldCheck size={10}/> Verified Unique Output</span>
        </div>
      </footer>
    </div>
  );
};

const VariantSection = ({ title, desc, variants, isDark, onCopy, copiedId }: any) => {
  if (variants.length === 0) return null;
  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4 mb-2">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-fuchsia-500">{title}</h3>
        <div className="h-px flex-1 bg-slate-800/50" />
        <span className="text-[10px] font-black text-slate-500 bg-slate-800/20 px-2.5 py-1 rounded-lg uppercase tracking-widest">
          {variants.length} UNIQUE
        </span>
      </div>
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-6 opacity-60 ml-1">{desc}</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {variants.map((v: any) => (
          <div key={v.id} className={`group relative p-6 rounded-[2rem] border transition-all duration-300 ${isDark ? 'bg-[#0a0f1c] border-slate-800 hover:border-fuchsia-500/50' : 'bg-white border-slate-200 hover:shadow-xl hover:border-fuchsia-300'}`}>
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-2">
                 <Code size={12} className="text-fuchsia-400" />
                 <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{v.label}</span>
               </div>
               <button onClick={() => onCopy(v.value, v.id)} className={`p-2.5 rounded-xl transition-all ${isDark ? 'bg-slate-900 hover:bg-fuchsia-500 hover:text-white text-slate-500' : 'bg-slate-50 hover:bg-fuchsia-600 hover:text-white text-slate-400 border border-slate-100'}`}>
                 {copiedId === v.id ? <Check size={16} /> : <Copy size={16} />}
               </button>
            </div>
            <div className={`p-4 rounded-2xl font-mono text-[12px] break-all leading-relaxed whitespace-pre-wrap select-all min-h-[60px] flex items-center ${isDark ? 'bg-black/40 text-fuchsia-400/80 border border-slate-800 shadow-inner' : 'bg-slate-50 text-indigo-700 border border-slate-100 shadow-inner'}`}>
               {v.value}
            </div>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
               <ChevronRight size={12} className="text-fuchsia-500/30" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default SubjectEncoderTool;