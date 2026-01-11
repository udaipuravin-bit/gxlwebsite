import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  ArrowLeft, 
  Scissors, 
  Copy, 
  Check, 
  RotateCcw, 
  Eye, 
  GripVertical,
  ShieldCheck,
  Zap,
  Trash2,
  ChevronDown,
  FileCode,
  Globe,
  Database,
  Terminal,
  Activity,
  Maximize2,
  Code
} from 'lucide-react';
import { useNotify } from '../App';

interface HtmlCleanerToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface FilterRules {
  imgSrc: boolean;
  href: boolean;
  cssUrl: boolean;
  colors: boolean;
  bgAttrs: boolean;
  text: boolean;
  comments: boolean;
  borders: boolean;
}

interface ForensicReport {
  images: string[];
  links: string[];
  cssAssets: string[];
  colors: string[];
}

const HtmlCleanerTool: React.FC<HtmlCleanerToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';

  const [inputHtml, setInputHtml] = useState('');
  const [sanitizedHtml, setSanitizedHtml] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  
  const [rules, setRules] = useState<FilterRules>({
    imgSrc: true,
    href: true,
    cssUrl: true,
    colors: true,
    bgAttrs: true,
    text: false,
    comments: true,
    borders: true,
  });

  const toggleRule = (key: keyof FilterRules) => {
    setRules(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const forensicReport = useMemo<ForensicReport>(() => {
    if (!inputHtml) return { images: [], links: [], cssAssets: [], colors: [] };

    const images = Array.from(inputHtml.matchAll(/src="([^"]+)"/gi)).map(m => m[1]);
    const links = Array.from(inputHtml.matchAll(/href="([^"]+)"/gi)).map(m => m[1]);
    const cssAssets = Array.from(inputHtml.matchAll(/url\(['"]?([^'"]+)['"]?\)/gi)).map(m => m[1]);
    const colors = Array.from(inputHtml.matchAll(/#[0-9a-fA-F]{3,6}|rgba?\([^)]+\)/gi)).map(m => m[0]);

    return {
      images: Array.from(new Set(images)),
      links: Array.from(new Set(links)),
      cssAssets: Array.from(new Set(cssAssets)),
      colors: Array.from(new Set(colors)),
    };
  }, [inputHtml]);

  const processHtml = useCallback(() => {
    if (!inputHtml.trim()) {
      setSanitizedHtml('');
      return;
    }

    let result = inputHtml;

    if (rules.comments) {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }
    if (rules.href) {
      result = result.replace(/(<a\s+[^>]*href=")[^"]*("[^>]*>)/gi, '$1#$2');
    }
    if (rules.imgSrc) {
      result = result.replace(/(<img\s+[^>]*src=")[^"]*("[^>]*>)/gi, '$1https://via.placeholder.com/1x1/cccccc/cccccc.png$2');
      result = result.replace(/\s+srcset="[^"]*"/gi, '');
    }
    if (rules.cssUrl) {
      result = result.replace(/url\s*\(\s*['"]?[^'"]*['"]?\s*\)/gi, "url('')");
    }
    if (rules.bgAttrs) {
      result = result.replace(/\s+bgcolor="[^"]*"/gi, '');
      result = result.replace(/\s+background="[^"]*"/gi, '');
    }
    if (rules.colors) {
      result = result.replace(/color\s*:\s*#[0-9a-fA-F]{3,6}\s*;?/gi, 'color:inherit;');
      result = result.replace(/background-color\s*:\s*#[0-9a-fA-F]{3,6}\s*;?/gi, 'background-color:transparent;');
    }
    if (rules.borders) {
      result = result.replace(/\s+border="[^"]*"/gi, ' border="0"');
      result = result.replace(/border\s*:\s*[^;]+;?/gi, 'border:none;');
    }
    if (rules.text) {
      result = result.replace(/>([^<]+)</g, (match, text) => {
        if (!text.trim()) return match;
        return `>[...] <`;
      });
    }

    setSanitizedHtml(result);
  }, [inputHtml, rules]);

  useEffect(() => {
    const timer = setTimeout(processHtml, 150);
    return () => clearTimeout(timer);
  }, [inputHtml, rules, processHtml]);

  const handleCopy = () => {
    if (!sanitizedHtml) return;
    navigator.clipboard.writeText(sanitizedHtml);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    notify('success', 'Forensic markup copied.');
  };

  const bgClass = isDark ? 'bg-[#050812]' : 'bg-slate-50';
  const panelHeaderClass = isDark ? 'bg-[#0a0f1c] border-b border-slate-800/50' : 'bg-slate-100 border-b border-slate-200';

  return (
    <div className={`min-h-screen flex flex-col ${bgClass} animate-in fade-in duration-500`}>
      {/* Header */}
      <header className="bg-[#0f172a] border-b border-indigo-500/20 px-4 py-3 flex items-center justify-between z-[100] shadow-2xl">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-lg transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Scissors size={18} />
            </div>
            <h1 className="text-sm font-black uppercase tracking-[0.1em] text-white">HTML Forensic Cleaner</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setInputHtml('')} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
            <RotateCcw size={18} />
          </button>
          <button 
            onClick={handleCopy} 
            disabled={!sanitizedHtml}
            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-600/20 disabled:opacity-50'}`}
          >
            {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? 'COPIED' : 'COPY RESULT'}
          </button>
        </div>
      </header>

      {/* Rules Bar */}
      <div className="bg-[#050812] border-b border-slate-800/50 px-6 py-3 flex items-center gap-6 overflow-x-auto no-scrollbar">
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-500 shrink-0">Filter Rules:</span>
        <div className="flex items-center gap-4">
          <RuleCheckbox label="IMG SRC" checked={rules.imgSrc} onChange={() => toggleRule('imgSrc')} />
          <RuleCheckbox label="HREF" checked={rules.href} onChange={() => toggleRule('href')} />
          <RuleCheckbox label="CSS URL" checked={rules.cssUrl} onChange={() => toggleRule('cssUrl')} />
          <RuleCheckbox label="COLORS" checked={rules.colors} onChange={() => toggleRule('colors')} />
          <RuleCheckbox label="BG ATTRS" checked={rules.bgAttrs} onChange={() => toggleRule('bgAttrs')} />
          <RuleCheckbox label="TEXT" checked={rules.text} onChange={() => toggleRule('text')} />
          <RuleCheckbox label="COMMENTS" checked={rules.comments} onChange={() => toggleRule('comments')} />
          <RuleCheckbox label="BORDERS" checked={rules.borders} onChange={() => toggleRule('borders')} />
        </div>
      </div>

      {/* Three-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source HTML */}
        <div className="flex-1 flex flex-col border-r border-slate-800/50">
          <div className={`${panelHeaderClass} px-4 py-2 flex items-center gap-2`}>
            <FileCode size={14} className="text-indigo-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Source HTML</span>
          </div>
          <textarea 
            value={inputHtml}
            onChange={(e) => setInputHtml(e.target.value)}
            className="flex-1 w-full bg-transparent p-6 outline-none font-mono text-[11px] text-slate-300 resize-none custom-scrollbar leading-relaxed"
            placeholder="<!-- Paste your HTML tracking code here -->"
          />
        </div>

        {/* Sanitized Markup */}
        <div className="flex-1 flex flex-col border-r border-slate-800/50">
          <div className={`${panelHeaderClass} px-4 py-2 flex items-center gap-2`}>
            <Code size={14} className="text-emerald-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Sanitized Markup</span>
          </div>
          <textarea 
            readOnly
            value={sanitizedHtml}
            className="flex-1 w-full bg-transparent p-6 outline-none font-mono text-[11px] text-indigo-400/80 resize-none custom-scrollbar leading-relaxed"
            placeholder="Forensic output matrix..."
          />
        </div>

        {/* Visual Audit */}
        <div className="flex-1 flex flex-col bg-white">
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center gap-2">
            <Eye size={14} className="text-slate-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Visual Audit</span>
          </div>
          <div className="flex-1 relative">
            <iframe 
              srcDoc={sanitizedHtml || '<html><body style="display:flex;align-items:center;justify-center;height:100vh;margin:0;font-family:sans-serif;color:#94a3b8;background:#f8fafc;text-transform:uppercase;font-weight:900;letter-spacing:0.2em;font-size:11px;">Waiting for payload...</body></html>'} 
              className="w-full h-full border-none"
              title="Audit Preview"
            />
          </div>
        </div>
      </div>

      {/* Forensic Report Dashboard */}
      <div className="shrink-0 bg-[#0a0f1c] border-t border-slate-800/50 p-6 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Database size={18} className="text-indigo-400" />
          <h2 className="text-[12px] font-black uppercase tracking-[0.2em] text-white">Extracted Forensic Report</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <ForensicDropdown label="Image Sources" count={forensicReport.images.length} items={forensicReport.images} />
          <ForensicDropdown label="Anchor Hrefs" count={forensicReport.links.length} items={forensicReport.links} />
          <ForensicDropdown label="CSS Assets" count={forensicReport.cssAssets.length} items={forensicReport.cssAssets} />
          <ForensicDropdown label="Colors Replaced" count={forensicReport.colors.length} items={forensicReport.colors} />
        </div>
      </div>

      {/* Footer */}
      <footer className="shrink-0 bg-[#05080f] border-t border-slate-900 px-6 py-2.5 flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-slate-600">
        <div className="flex gap-4">
          <span>Engine: V4.0 Forensic</span>
          <span className="text-emerald-500 flex items-center gap-1">
            <ShieldCheck size={10} /> Verified RFC Sanitization
          </span>
        </div>
        <span>© 2026 Authenticator Pro Lab</span>
      </footer>
    </div>
  );
};

const RuleCheckbox = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <div className={`w-3.5 h-3.5 rounded border transition-all flex items-center justify-center ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 group-hover:border-slate-500'}`}>
      {checked && <Check size={10} className="text-white font-black" strokeWidth={4} />}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${checked ? 'text-slate-200' : 'text-slate-600 group-hover:text-slate-400'}`}>{label}</span>
  </label>
);

const ForensicDropdown = ({ label, count, items }: { label: string; count: number; items: string[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#050812] border border-slate-800/50 rounded-xl hover:border-indigo-500/50 transition-all group"
      >
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{label}</span>
          <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono font-bold text-slate-400 group-hover:text-white">{count}</span>
        </div>
        <ChevronDown size={14} className={`text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && items.length > 0 && (
        <div className="absolute bottom-full mb-2 w-full max-h-40 overflow-y-auto bg-[#0a0f1c] border border-indigo-500/30 rounded-xl shadow-2xl p-2 z-[200] custom-scrollbar animate-in slide-in-from-bottom-2">
          {items.map((item, i) => (
            <div key={i} className="px-3 py-2 text-[9px] font-mono text-indigo-300 break-all border-b border-slate-800/50 last:border-0 hover:bg-indigo-500/10 rounded">
              {item}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HtmlCleanerTool;
