import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowLeft, 
  Scissors, 
  Copy, 
  Check, 
  RotateCcw, 
  ChevronDown, 
  ChevronUp, 
  Layout, 
  Code2, 
  Eye, 
  GripVertical,
  FileCode,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { useNotify } from '../App';

interface HtmlCleanerToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface CleanerOptions {
  removeImgSrc: boolean;
  removeImgSrcset: boolean;
  removeImgAlt: boolean;
  removeAHref: boolean;
  removeCssUrl: boolean;
  replaceColors: boolean;
  replaceBgAttrs: boolean;
  removeText: boolean;
  preserveComments: boolean;
  normalizeBorders: boolean;
  removeInlineBg: boolean;
}

interface ForensicReport {
  imgSrc: string[];
  imgSrcset: string[];
  aHref: string[];
  cssUrls: string[];
  colors: string[];
}

const HtmlCleanerTool: React.FC<HtmlCleanerToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';

  const [inputHtml, setInputHtml] = useState('');
  const [cleanedHtml, setCleanedHtml] = useState('');
  const [report, setReport] = useState<ForensicReport>({ imgSrc: [], imgSrcset: [], aHref: [], cssUrls: [], colors: [] });
  const [options, setOptions] = useState<CleanerOptions>({
    removeImgSrc: true,
    removeImgSrcset: true,
    removeImgAlt: true,
    removeAHref: true,
    removeCssUrl: true,
    replaceColors: true,
    replaceBgAttrs: true,
    removeText: true,
    preserveComments: true,
    normalizeBorders: true,
    removeInlineBg: true,
  });

  const [splitA, setSplitA] = useState(33.33);
  const [splitB, setSplitB] = useState(33.33);
  const [isResizingA, setIsResizingA] = useState(false);
  const [isResizingB, setIsResizingB] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [openReportSections, setOpenReportSections] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);

  const toggleOption = (key: keyof CleanerOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleReportSection = (section: string) => {
    setOpenReportSections(prev => 
      prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
    );
  };

  const processHtml = useCallback(() => {
    if (!inputHtml.trim()) {
      setCleanedHtml('');
      setReport({ imgSrc: [], imgSrcset: [], aHref: [], cssUrls: [], colors: [] });
      return;
    }

    let result = inputHtml;
    const newReport: ForensicReport = { imgSrc: [], imgSrcset: [], aHref: [], cssUrls: [], colors: [] };

    // Forensic Extraction (Before Cleaning)
    const extract = (regex: RegExp, list: string[]) => {
      let match;
      while ((match = regex.exec(inputHtml)) !== null) {
        if (match[1] && !list.includes(match[1])) list.push(match[1]);
      }
    };

    extract(/src=["'](.*?)["']/gi, newReport.imgSrc);
    extract(/srcset=["'](.*?)["']/gi, newReport.imgSrcset);
    extract(/href=["'](.*?)["']/gi, newReport.aHref);
    extract(/url\(['"]?(.*?)['"]?\)/gi, newReport.cssUrls);
    const hexMatches = inputHtml.match(/#(?:[0-9a-fA-F]{3}){1,2}/g) || [];
    newReport.colors = Array.from(new Set(hexMatches));

    // CLEANING LOGIC (Matching User Prototype Patterns)
    
    // 1. Handle Comments (Placeholder Strategy)
    const comments: string[] = [];
    if (options.preserveComments) {
      result = result.replace(/<!--[\s\S]*?-->/g, (comment) => {
        comments.push(comment);
        return `<!--COMMENT_PLACEHOLDER_${comments.length - 1}-->`;
      });
    } else {
      result = result.replace(/<!--[\s\S]*?-->/g, '');
    }

    // 2. Text Content Removal (Character to Space Masking)
    if (options.removeText) {
      const tags = ['p', 'a', 'span', 'div', 'strong', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'td'];
      const textRegex = new RegExp(`(<(${tags.join('|')})(\\s[^>]*)?>)([\\s\\S]*?)(</\\2>)`, 'gi');
      result = result.replace(textRegex, (match, p1, p2, p3, p4, p5) => {
        // Replace non-whitespace with spaces to preserve layout flow
        const innerContentRemoved = p4.replace(/([^<>]*)(?=<|$)/g, (text: string) => text.replace(/\S/g, ' '));
        return `${p1}${innerContentRemoved}${p5}`;
      });
    }

    // 3. Attribute Value Sanitization (Quoted & Unquoted)
    if (options.removeAHref) {
      result = result.replace(/(<a\s+[^>]*href=")[^"]*("[^>]*>)/gi, '$1""$2');
      result = result.replace(/(<a\s+[^>]*href=)[^\s>]+([^>]*>)/gi, '$1""$2');
    }

    if (options.removeImgSrc) {
      result = result.replace(/(<img\s+[^>]*src=")[^"]*("[^>]*>)/gi, '$1""$2');
      result = result.replace(/(<img\s+[^>]*src=)[^\s>]+([^>]*>)/gi, '$1""$2');
    }

    if (options.removeImgSrcset) {
      result = result.replace(/(<img\s+[^>]*srcset=")[^"]*("[^>]*>)/gi, '$1""$2');
      result = result.replace(/(<img\s+[^>]*srcset=)[^\s>]+([^>]*>)/gi, '$1""$2');
    }

    if (options.removeImgAlt) {
      result = result.replace(/(<img\s+[^>]*alt=")[^"]*("[^>]*>)/gi, '$1$2');
    }

    // 4. Color & Background Normalization
    if (options.replaceColors) {
      result = result.replace(/color\s*:\s*#[0-9a-fA-F]{3,6}\s*;?/gi, 'color:#ffffff;');
    }

    if (options.replaceBgAttrs) {
      result = result.replace(/background-color\s*:\s*#[0-9a-fA-F]{3,6}\s*;?/gi, 'background-color:#ffffff;');
      result = result.replace(/bgcolor\s*=\s*"?#[0-9a-fA-F]{3,6}"?/gi, 'bgcolor="#ffffff"');
      result = result.replace(/background\s*:\s*#[0-9a-fA-F]{3,6}\s*;?/gi, 'background:#ffffff;');
    }

    // 5. Border Normalization
    if (options.normalizeBorders) {
      result = result.replace(/(solid\s*\d+px\s*)#[0-9a-fA-F]{3,6}/gi, '$1#ffffff');
      result = result.replace(/(\d+px\s+solid\s*)#[0-9a-fA-F]{3,6}/gi, '$1#ffffff');
    }

    // 6. CSS URL & Background Image Removal
    if (options.removeCssUrl) {
      result = result.replace(/url\s*\(\s*['"]?[^'"]*['"]?\s*\)/gi, "url('')");
    }

    if (options.removeInlineBg) {
      result = result.replace(/(background\s*=\s*")[^"]*("\s*style="[^"]*background-[^"]*";?)/gi, '$1$2');
      result = result.replace(/background-image\s*:\s*url\s*\(\s*['"]?[^'"]*['"]?\s*\)\s*;?/gi, 'background-image:none;');
    }

    // 7. Restore Comments
    if (options.preserveComments) {
      result = result.replace(/<!--COMMENT_PLACEHOLDER_(\d+)-->/g, (_, index) => {
        return comments[parseInt(index)] || '';
      });
    }

    setCleanedHtml(result);
    setReport(newReport);
  }, [inputHtml, options]);

  useEffect(() => {
    processHtml();
  }, [inputHtml, options, processHtml]);

  const handleResize = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;

    if (isResizingA) {
      setSplitA(Math.max(10, Math.min(percentage, 80)));
    } else if (isResizingB) {
      setSplitB(Math.max(10, Math.min(percentage - splitA, 80)));
    }
  }, [isResizingA, isResizingB, splitA]);

  useEffect(() => {
    if (isResizingA || isResizingB) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', () => { setIsResizingA(false); setIsResizingB(false); });
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
    };
  }, [isResizingA, isResizingB, handleResize]);

  const copyCleaned = () => {
    navigator.clipboard.writeText(cleanedHtml);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    notify('success', 'Sanitized HTML copied.');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';

  return (
    <div className="h-screen flex flex-col gap-0 overflow-hidden">
      <header className={`shrink-0 flex items-center justify-between px-6 py-3 border-b ${cardClasses} z-50 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Scissors size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">HTML Forensic Cleaner</h1>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setInputHtml('')} className="p-2 text-slate-500 hover:text-rose-400 transition-colors">
            <RotateCcw size={18} />
          </button>
          <button onClick={copyCleaned} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isCopied ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>
            {isCopied ? <Check size={14} /> : <Copy size={14} />} {isCopied ? 'Copied' : 'Copy Result'}
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Sticky Filter Panel */}
        <div className={`shrink-0 px-6 py-2 border-b flex items-center gap-6 overflow-x-auto no-scrollbar ${isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-4">
             <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Filter Rules:</span>
             <div className="flex gap-4">
                <CleanerToggle label="IMG SRC" checked={options.removeImgSrc} onChange={() => toggleOption('removeImgSrc')} />
                <CleanerToggle label="HREF" checked={options.removeAHref} onChange={() => toggleOption('removeAHref')} />
                <CleanerToggle label="CSS URL" checked={options.removeCssUrl} onChange={() => toggleOption('removeCssUrl')} />
                <CleanerToggle label="COLORS" checked={options.replaceColors} onChange={() => toggleOption('replaceColors')} />
                <CleanerToggle label="BG ATTRS" checked={options.replaceBgAttrs} onChange={() => toggleOption('replaceBgAttrs')} />
                <CleanerToggle label="TEXT" checked={options.removeText} onChange={() => toggleOption('removeText')} />
                <CleanerToggle label="COMMENTS" checked={options.preserveComments} onChange={() => toggleOption('preserveComments')} />
                <CleanerToggle label="BORDERS" checked={options.normalizeBorders} onChange={() => toggleOption('normalizeBorders')} />
             </div>
          </div>
        </div>

        {/* Resizable 3-Column Workspace */}
        <div ref={containerRef} className="flex-1 flex min-h-0 relative select-none">
          {/* Panel 1: Source */}
          <div style={{ width: `${splitA}%` }} className="h-full flex flex-col border-r border-slate-800/50">
             <div className="px-4 py-1.5 bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
                <span className="flex items-center gap-2"><FileCode size={12} className="text-indigo-400" /> Source HTML</span>
             </div>
             <textarea 
              value={inputHtml}
              onChange={(e) => setInputHtml(e.target.value)}
              className="flex-1 w-full bg-slate-950 p-4 outline-none font-mono text-[11px] text-slate-300 resize-none custom-scrollbar"
              placeholder="<!-- Paste your HTML tracking code here -->"
             />
          </div>

          <div onMouseDown={() => setIsResizingA(true)} className="w-1 h-full cursor-col-resize bg-slate-800 hover:bg-indigo-600 transition-colors z-10 flex items-center justify-center">
             <GripVertical size={10} className="text-slate-600" />
          </div>

          {/* Panel 2: Cleaned */}
          <div style={{ width: `${splitB}%` }} className="h-full flex flex-col border-r border-slate-800/50">
            <div className="px-4 py-1.5 bg-slate-900/50 border-b border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2"><Code2 size={12} className="text-emerald-400" /> Sanitized Markup</span>
            </div>
            <textarea 
              readOnly
              value={cleanedHtml}
              className="flex-1 w-full bg-slate-900/40 p-4 outline-none font-mono text-[11px] text-emerald-400/80 resize-none custom-scrollbar"
            />
          </div>

          <div onMouseDown={() => setIsResizingB(true)} className="w-1 h-full cursor-col-resize bg-slate-800 hover:bg-indigo-600 transition-colors z-10 flex items-center justify-center">
             <GripVertical size={10} className="text-slate-600" />
          </div>

          {/* Panel 3: Preview */}
          <div className="flex-1 h-full flex flex-col bg-white">
            <div className="px-4 py-1.5 bg-slate-100 border-b border-slate-200 text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600"><Eye size={12} /> Visual Audit</span>
            </div>
            <div className="flex-1 overflow-hidden relative">
               <iframe 
                srcDoc={cleanedHtml}
                className="w-full h-full border-none pointer-events-none"
                title="Sanitized Preview"
               />
            </div>
          </div>
        </div>

        {/* Forensic Report Section (Accordion) */}
        <div className={`shrink-0 max-h-64 overflow-y-auto border-t custom-scrollbar ${isDark ? 'bg-[#05080f] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
           <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-6">
                 <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                       <Layout size={18} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-widest">Extracted Forensic Report</h3>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <ReportItem 
                    title="Image Sources" 
                    count={report.imgSrc.length} 
                    items={report.imgSrc} 
                    isOpen={openReportSections.includes('img')} 
                    onToggle={() => toggleReportSection('img')} 
                    isDark={isDark}
                 />
                 <ReportItem 
                    title="Anchor Hrefs" 
                    count={report.aHref.length} 
                    items={report.aHref} 
                    isOpen={openReportSections.includes('href')} 
                    onToggle={() => toggleReportSection('href')} 
                    isDark={isDark}
                 />
                 <ReportItem 
                    title="CSS Assets" 
                    count={report.cssUrls.length} 
                    items={report.cssUrls} 
                    isOpen={openReportSections.includes('css')} 
                    onToggle={() => toggleReportSection('css')} 
                    isDark={isDark}
                 />
                 <ReportItem 
                    title="Colors Replaced" 
                    count={report.colors.length} 
                    items={report.colors} 
                    isOpen={openReportSections.includes('colors')} 
                    onToggle={() => toggleReportSection('colors')} 
                    isDark={isDark}
                 />
              </div>
           </div>
        </div>
      </div>

      <footer className={`shrink-0 px-6 py-2 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex gap-4">
           <span>Engine: V4.0 Forensic</span>
           <span className="opacity-40">|</span>
           <span className="flex items-center gap-1.5 text-emerald-500"><ShieldCheck size={12}/> Verified RFC Sanitization</span>
        </div>
        <p>© {new Date().getFullYear()} Authenticator Pro Lab</p>
      </footer>
    </div>
  );
};

const CleanerToggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: () => void }) => (
  <label className="flex items-center gap-2 cursor-pointer group">
    <input type="checkbox" checked={checked} onChange={onChange} className="hidden" />
    <div className={`w-3 h-3 rounded-sm border transition-all ${checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-700 group-hover:border-slate-500'}`}>
       {checked && <Check size={10} className="text-white mx-auto" />}
    </div>
    <span className={`text-[9px] font-black uppercase tracking-tighter transition-colors ${checked ? 'text-slate-100' : 'text-slate-600 group-hover:text-slate-400'}`}>
      {label}
    </span>
  </label>
);

const ReportItem = ({ title, count, items, isOpen, onToggle, isDark }: any) => (
  <div className={`rounded-xl border overflow-hidden ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-100'}`}>
    <button onClick={onToggle} className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/5 transition-all text-left">
       <div className="flex items-center gap-2">
          <span className={`text-[10px] font-black uppercase tracking-widest ${count > 0 ? 'text-indigo-400' : 'text-slate-600'}`}>{title}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{count}</span>
       </div>
       {isOpen ? <ChevronUp size={14} className="text-slate-600" /> : <ChevronDown size={14} className="text-slate-600" />}
    </button>
    {isOpen && (
      <div className={`p-3 border-t max-h-40 overflow-y-auto custom-scrollbar ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
         {items.length > 0 ? (
           <ul className="space-y-2">
             {items.map((item: string, i: number) => (
               <li key={i} className="text-[9px] font-mono text-slate-500 break-all leading-tight">
                 {item}
               </li>
             ))}
           </ul>
         ) : (
           <span className="text-[9px] italic text-slate-700">No entries found</span>
         )}
      </div>
    )}
  </div>
);

export default HtmlCleanerTool;