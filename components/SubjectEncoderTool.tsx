
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
  ShieldCheck,
  Globe,
  ChevronDown,
  Terminal,
  Activity,
  Trash2,
  Hash,
  Fingerprint,
  FlaskConical
} from 'lucide-react';
import { encodeBase64, encodeQuotedPrintable, encodeRFC2047 } from '../services/mimeService';

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
  "UTF-8", "UTF-16", "UTF-32", "US-ASCII", 
  "Windows-1250", "Windows-1251", "Windows-1252", "Windows-1253", "Windows-1254", "Windows-1255", "Windows-1256", "Windows-1257", "Windows-1258",
  "ISO-8859-1", "ISO-8859-2", "ISO-8859-3", "ISO-8859-4", "ISO-8859-5", "ISO-8859-6", "ISO-8859-7", "ISO-8859-8", "ISO-8859-9", "ISO-8859-10", "ISO-8859-11", "ISO-8859-13", "ISO-8859-14", "ISO-8859-15", "ISO-8859-16",
  "KOI8-R", "KOI8-U", "Shift_JIS", "Shift_JIS-2004", "EUC-JP", "EUC-JISX0213", "GB2312", "GBK", "GB18030", "Big5", "EUC-TW", "EUC-CN", "KS_X_1001", "EUC-KR", "JIS_X0201", "JIS_X0208", "JIS_X0212", "MacRoman", "MacCyrillic", "IBM437", "IBM850", "IBM866", "TIS-620", "VISCII", "HZ-GB-2312", "BOCU-1", "SCSU"
];

const SubjectEncoderTool: React.FC<SubjectEncoderToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [subject, setSubject] = useState('Exclusive Deal 🚀 Buy One Get One Free! 🔥');
  const [selectedCharset, setSelectedCharset] = useState('UTF-8');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [charsetSearch, setCharsetSearch] = useState('');
  const [showCharsetDropdown, setShowCharsetDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCharsetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCharsets = useMemo(() => 
    CHARSETS.filter(c => c.toLowerCase().includes(charsetSearch.toLowerCase())),
    [charsetSearch]
  );

  const variants = useMemo(() => {
    if (!subject.trim()) return [];
    
    const uniqueStrings = new Set<string>();
    const results: EncodedVariant[] = [];
    const cs = selectedCharset;

    const addUnique = (label: string, value: string, collection: number) => {
      if (!uniqueStrings.has(value)) {
        uniqueStrings.add(value);
        results.push({ id: `v-${results.length}`, label, value, collection });
      }
    };

    // Fix: Explicitly type words as string[] to ensure downstream operations like slice/join/forEach work with string types
    const words: string[] = subject.split(/\s+/);
    const mid = Math.floor(subject.length / 2);

    // --- COLLECTION 1: BASE64 VARIANTS ---
    const labelCasings = [cs, cs.toLowerCase(), cs.toUpperCase(), cs.charAt(0) + cs.slice(1).toLowerCase()];
    labelCasings.forEach((label) => {
      addUnique(`Standard B64 (${label})`, encodeRFC2047(subject, 'B', label), 1);
    });

    [1, 2, 3, 5, 8, 10, 12, 15, 20, 25, 30].forEach(size => {
      let chunks = [];
      for (let i = 0; i < subject.length; i += size) {
        chunks.push(encodeRFC2047(subject.slice(i, i + size), 'B', cs));
      }
      addUnique(`Chunked B64 (${size})`, chunks.join(' '), 1);
      addUnique(`Folded B64 (${size} Space)`, chunks.join('\r\n '), 1);
      addUnique(`Folded B64 (${size} Tab)`, chunks.join('\r\n\t'), 1);
    });

    addUnique('Word-by-word B64', words.map(w => encodeRFC2047(w, 'B', cs)).join(' '), 1);

    // --- COLLECTION 2: QUOTED-PRINTABLE VARIANTS ---
    labelCasings.forEach((label) => {
      addUnique(`Standard QP (${label})`, encodeRFC2047(subject, 'Q', label), 2);
      addUnique(`Full Hex QP (${label})`, encodeRFC2047(subject, 'Q', label, true), 2);
    });

    addUnique('Space-as-Underscore QP', `=?${cs}?Q?${encodeQuotedPrintable(subject, true).replace(/\s/g, '_')}?=`, 2);
    addUnique('Space-as-Hex QP', `=?${cs}?Q?${encodeQuotedPrintable(subject, true).replace(/\s/g, '=20')}?=`, 2);

    [1, 2, 3, 5, 8, 10, 12, 15, 20].forEach(size => {
      let chunks = [];
      let hexChunks = [];
      for (let i = 0; i < subject.length; i += size) {
        chunks.push(encodeRFC2047(subject.slice(i, i + size), 'Q', cs));
        hexChunks.push(encodeRFC2047(subject.slice(i, i + size), 'Q', cs, true));
      }
      addUnique(`Chunked QP (${size})`, chunks.join(' '), 2);
      addUnique(`Chunked Hex QP (${size})`, hexChunks.join(' '), 2);
    });

    // --- COLLECTION 3: MIXED B/Q SYNTHESIS ---
    addUnique('B / Q Alternating Word', words.map((w, i) => encodeRFC2047(w, i % 2 === 0 ? 'B' : 'Q', cs)).join(' '), 3);
    addUnique('Q / B Alternating Word', words.map((w, i) => encodeRFC2047(w, i % 2 === 0 ? 'Q' : 'B', cs)).join(' '), 3);
    addUnique('B Start / Q End', encodeRFC2047(subject.slice(0, mid), 'B', cs) + ' ' + encodeRFC2047(subject.slice(mid), 'Q', cs), 3);
    addUnique('Q Start / B End', encodeRFC2047(subject.slice(0, mid), 'Q', cs) + ' ' + encodeRFC2047(subject.slice(mid), 'B', cs), 3);

    const mixSize = 6;
    let mixedChain = [];
    for (let i = 0; i < subject.length; i += mixSize) {
      mixedChain.push(encodeRFC2047(subject.slice(i, i + mixSize), (i / mixSize) % 2 === 0 ? 'B' : 'Q', cs));
    }
    addUnique('Interleaved B/Q Chunks', mixedChain.join(' '), 3);

    // --- COLLECTION 4: MULTI-CHARSET CHAINS ---
    const primaryCharsets = ["UTF-8", "ISO-8859-1", "Windows-1252", "US-ASCII", "KOI8-R"];
    // Fix: Explicitly cast array elements to string to satisfy encodeRFC2047 parameter expectations and avoid unknown type error
    addUnique('UTF-8 + ISO Word Split', encodeRFC2047(words[0] as string, 'B', 'UTF-8') + ' ' + encodeRFC2047(words.slice(1).join(' ') as string, 'B', 'ISO-8859-1'), 4);
    
    // Fix: Explicitly type multiChain as string[] to prevent unknown assignment errors
    let multiChain: string[] = [];
    words.forEach((w, i) => {
      const charset = primaryCharsets[i % primaryCharsets.length];
      multiChain.push(encodeRFC2047(w, 'B', charset));
    });
    addUnique('Rainbow Charset Word Chain', multiChain.join(' '), 4);

    // --- COLLECTION 5: FORENSIC & EDGE CASES ---
    addUnique('Forensic: Single-Char B64', Array.from(subject.slice(0, 15)).map(c => encodeRFC2047(c, 'B', cs)).join(' '), 5);
    addUnique('Forensic: Single-Char QP', Array.from(subject.slice(0, 15)).map(c => encodeRFC2047(c, 'Q', cs)).join(' '), 5);
    addUnique('Forensic: Empty word gap', encodeRFC2047(subject.slice(0, mid), 'B', cs) + ' =?UTF-8?Q??= ' + encodeRFC2047(subject.slice(mid), 'B', cs), 5);
    addUnique('Edge: UTF8 Alias', encodeRFC2047(subject, 'B', 'UTF8'), 5);
    addUnique('Edge: Latin1 Alias', encodeRFC2047(subject, 'Q', 'latin1'), 5);

    return results;
  }, [subject, selectedCharset]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`h-[calc(100vh-64px)] flex flex-col p-4 md:p-6 lg:p-6 gap-4 max-w-full mx-auto animate-in fade-in duration-500 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-5 p-5 rounded-3xl shadow-2xl border backdrop-blur-xl relative z-[100] ${isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white/90 border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-3 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-indigo-500 via-fuchsia-500 to-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
              <FlaskConical size={26} />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight">Subject <span className="text-fuchsia-500">Master</span></h1>
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">RFC 2047 Intelligence Engine</p>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl flex flex-col md:flex-row gap-3">
          <div className={`relative flex-1 flex items-center p-1 rounded-2xl border transition-all ${isDark ? 'bg-slate-950 border-slate-800 focus-within:border-indigo-500' : 'bg-slate-50 border-slate-200'}`}>
            <Terminal size={16} className="absolute left-4 text-indigo-500" />
            <input 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Source Subject Line..."
              className="w-full pl-10 pr-4 py-2.5 bg-transparent outline-none font-bold text-sm"
            />
          </div>

          <div className="relative shrink-0" ref={dropdownRef}>
             <button 
              onClick={() => setShowCharsetDropdown(!showCharsetDropdown)}
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-[0.2em] transition-all ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900' : 'bg-white border-slate-200 text-slate-600'}`}
             >
               <Globe size={14} className="text-fuchsia-500" />
               {selectedCharset}
               <ChevronDown size={14} className={`transition-transform ${showCharsetDropdown ? 'rotate-180' : ''}`} />
             </button>

             {showCharsetDropdown && (
               <div className={`absolute right-0 top-full mt-2 w-72 rounded-2xl shadow-2xl border z-[200] overflow-hidden animate-in zoom-in-95 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="p-3 border-b border-slate-800/50">
                    <div className="relative">
                      <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                      <input 
                        value={charsetSearch}
                        onChange={(e) => setCharsetSearch(e.target.value)}
                        placeholder="Search charsets..."
                        autoFocus
                        className={`w-full pl-8 pr-3 py-2 rounded-xl text-[10px] font-bold outline-none ${isDark ? 'bg-slate-950 text-white' : 'bg-slate-50'}`}
                      />
                    </div>
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar p-1">
                    {filteredCharsets.map(c => (
                      <button 
                        key={c}
                        onClick={() => { setSelectedCharset(c); setShowCharsetDropdown(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[10px] font-bold rounded-xl transition-all ${selectedCharset === c ? 'bg-indigo-600 text-white' : isDark ? 'text-slate-400 hover:bg-slate-800 hover:text-white' : 'hover:bg-slate-100'}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
               </div>
             )}
          </div>
        </div>

        <div className={`px-4 py-2 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20' : 'bg-indigo-50 border-indigo-100'}`}>
           <Fingerprint className="text-indigo-500" size={18} />
           <div className="text-left">
              <p className="text-[10px] font-black uppercase text-slate-500">Uniqueness Result</p>
              <p className="text-sm font-black text-indigo-500">{variants.length} UNIQUE ENCODINGS</p>
           </div>
        </div>
      </header>

      {/* Grid Workspace */}
      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar p-1">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 pb-12">
          
          <CollectionSection title="Collection 1: Base64 Variants" variants={variants.filter(v => v.collection === 1)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} icon={<Layers className="text-indigo-400" size={18} />} />
          <CollectionSection title="Collection 2: Quoted-Printable" variants={variants.filter(v => v.collection === 2)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} icon={<Code className="text-fuchsia-400" size={18} />} />
          <CollectionSection title="Collection 3: Mixed B/Q Synthesis" variants={variants.filter(v => v.collection === 3)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} icon={<ShieldCheck className="text-emerald-400" size={18} />} />
          <CollectionSection title="Collection 4: Multi-Charset Chains" variants={variants.filter(v => v.collection === 4)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} icon={<Globe className="text-sky-400" size={18} />} />
          <CollectionSection title="Collection 5: Forensic & Edge Cases" variants={variants.filter(v => v.collection === 5)} onCopy={copyToClipboard} copiedId={copiedId} isDark={isDark} icon={<Activity className="text-rose-400" size={18} />} />

        </div>
      </div>

      {/* Footer */}
      <footer className={`shrink-0 pt-4 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro Lab</p>
        <div className="flex gap-8 items-center">
           <span className="flex items-center gap-1.5 opacity-60 uppercase"><Hash size={12}/> Deduplication Engine v4.0</span>
           <span className="flex items-center gap-1.5 text-emerald-500 uppercase"><ShieldCheck size={12}/> Verified RFC 2047</span>
        </div>
      </footer>
    </div>
  );
};

interface CollectionProps {
  title: string;
  variants: EncodedVariant[];
  onCopy: (val: string, id: string) => void;
  copiedId: string | null;
  isDark: boolean;
  icon: React.ReactNode;
}

const CollectionSection: React.FC<CollectionProps> = ({ title, variants, onCopy, copiedId, isDark, icon }) => (
  <section className={`p-8 rounded-[2rem] border shadow-2xl flex flex-col gap-8 transition-all ${isDark ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-slate-200'}`}>
    <div className="flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-2xl ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
          {icon}
        </div>
        <h3 className="text-sm font-black uppercase tracking-[0.25em] text-slate-500">{title}</h3>
      </div>
      <span className="text-[10px] font-black px-3 py-1 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
        {variants.length} Unique
      </span>
    </div>
    
    <div className="grid grid-cols-1 gap-4">
      {variants.map(v => (
        <div key={v.id} className={`group relative p-5 rounded-3xl border transition-all duration-300 ${isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-100'} hover:border-indigo-500/50 hover:shadow-xl hover:translate-x-1`}>
          <div className="flex justify-between items-center mb-3">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-indigo-400 transition-colors">{v.label}</span>
             <button 
              onClick={() => onCopy(v.value, v.id)}
              className={`p-2 rounded-xl transition-all ${isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-600 hover:text-white' : 'bg-white hover:bg-slate-100 text-slate-400 hover:text-indigo-600'} shadow-sm border border-transparent hover:border-slate-700`}
             >
               {copiedId === v.id ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
             </button>
          </div>
          <div className={`p-4 rounded-2xl border font-mono text-[11px] break-all leading-relaxed transition-all ${isDark ? 'bg-slate-950 border-slate-800/50 text-indigo-400 group-hover:text-indigo-300' : 'bg-white border-slate-100 text-indigo-700 group-hover:text-indigo-800'}`}>
             {v.value}
          </div>
        </div>
      ))}
    </div>
  </section>
);

export default SubjectEncoderTool;
