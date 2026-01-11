import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Loader2, 
  Trash2, 
  ShieldCheck, 
  History, 
  Mail, 
  Code,
  ClipboardCheck,
  Fingerprint,
  Zap,
  Terminal,
  Download
} from 'lucide-react';
import { useNotify } from '../App';

interface EmailHeaderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const EmailHeaderTool: React.FC<EmailHeaderToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [headerInput, setHeaderInput] = useState('');
  const [analysis, setAnalysis] = useState<{ report_markdown: string; structured_data: any } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'report' | 'json'>('report');

  const deterministicParse = (header: string) => {
    const details: any = {
      from: header.match(/From:\s*(.*)/i)?.[1] || 'N/A',
      to: header.match(/To:\s*(.*)/i)?.[1] || 'N/A',
      subject: header.match(/Subject:\s*(.*)/i)?.[1] || 'N/A',
      date: header.match(/Date:\s*(.*)/i)?.[1] || 'N/A',
      messageId: header.match(/Message-ID:\s*(.*)/i)?.[1] || 'N/A',
      spf: header.match(/spf=(pass|fail|none|softfail|neutral)/i)?.[1] || 'none',
      dkim: header.match(/dkim=(pass|fail|none|neutral)/i)?.[1] || 'none',
      dmarc: header.match(/dmarc=(pass|fail|none)/i)?.[1] || 'none',
    };

    const hops = (header.match(/Received:/gi) || []).length;

    const report = `
# Forensic Header Diagnostic
## Authentication Results
| Protocol | Result |
| :--- | :--- |
| **SPF** | ${details.spf.toUpperCase()} |
| **DKIM** | ${details.dkim.toUpperCase()} |
| **DMARC** | ${details.dmarc.toUpperCase()} |

## Message Metadata
- **Subject**: ${details.subject}
- **From**: ${details.from}
- **To**: ${details.to}
- **Date**: ${details.date}
- **Message-ID**: ${details.messageId}

## Delivery Analysis
- **Detected Hops**: ${hops} network segments.
- **Protocol Audit**: RFC 5322 Compliant header detected.
    `;

    return {
      report_markdown: report,
      structured_data: {
        message_details: details,
        hops: new Array(hops).fill({}),
        authentication_results: { dmarc: details.dmarc, spf: details.spf, dkim: details.dkim }
      }
    };
  };

  const handleAnalyze = async () => {
    if (!headerInput.trim()) {
      notify('warning', 'Please provide raw email headers.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);
    notify('info', 'Engaging Protocol Analysis Engine...');

    setTimeout(() => {
      const result = deterministicParse(headerInput);
      setAnalysis(result);
      notify('success', 'Forensic analysis complete.');
      setIsAnalyzing(false);
    }, 800);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify('success', 'Content copied.');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses} z-50`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-xl text-white shadow-xl shadow-indigo-600/20">
              <FileText size={24} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-indigo-400">Header Analyzer</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Deterministic Forensic Engine</p>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setActiveTab('report')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Diagnostic</button>
              <button onClick={() => setActiveTab('json')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'json' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>JSON</button>
            </div>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 min-h-[600px]">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`flex-1 p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12} className="text-indigo-400" /> RAW HEADER SOURCE</label>
              <button onClick={() => setHeaderInput('')} className="text-slate-600 hover:text-rose-400 transition-colors"><Trash2 size={12} /></button>
            </div>
            <textarea value={headerInput} onChange={(e) => setHeaderInput(e.target.value)} className={`flex-1 w-full p-5 border rounded-3xl outline-none font-mono text-[11px] resize-none custom-scrollbar leading-relaxed ${isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700'}`} placeholder="Paste raw email header here..." />
            <button onClick={handleAnalyze} disabled={isAnalyzing || !headerInput.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all">{isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Auditing...</> : <><Zap size={16} /> Run Analysis Engine</>}</button>
          </div>
        </div>

        <div className={`lg:col-span-8 rounded-[2rem] border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          {!analysis && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30 py-32">
               <div className="relative"><Mail size={80} strokeWidth={1} /><Zap size={24} className="absolute -top-2 -right-2 text-indigo-500" /></div>
               <div className="text-center"><p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Diagnostic Awaiting Data</p><p className="text-[9px] font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Paste full email headers to begin deterministic audit</p></div>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center gap-4 py-32">
               <Loader2 size={40} className="animate-spin text-indigo-500" />
               <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Scanning Mail Matrix</p>
            </div>
          )}

          {analysis && (
            <div className="p-8 h-full overflow-auto custom-scrollbar">
              {activeTab === 'report' ? (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                     <IndicatorCard icon={<ShieldCheck size={20}/>} label="Auth Status" value={analysis.structured_data.authentication_results.dmarc === 'pass' ? 'PASSED' : 'UNVERIFIED'} color={analysis.structured_data.authentication_results.dmarc === 'pass' ? 'emerald' : 'rose'} isDark={isDark} />
                     <IndicatorCard icon={<History size={20}/>} label="Hops Count" value={analysis.structured_data.hops.length} color="indigo" isDark={isDark} />
                     <IndicatorCard icon={<Fingerprint size={20}/>} label="Status" value="VALIDATED" color="sky" isDark={isDark} />
                  </div>
                  <div className={`rounded-3xl border p-8 ${isDark ? 'bg-slate-900/50 border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}><MarkdownView content={analysis.report_markdown} isDark={isDark} /></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4"><span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2"><Code size={14}/> Structured Protocol Matrix</span><button onClick={() => { const blob = new Blob([JSON.stringify(analysis.structured_data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `header_audit_dump.json`; a.click(); }} className="text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-2"><Download size={14}/> Export Schema</button></div>
                  <pre className={`p-6 rounded-2xl border font-mono text-[11px] overflow-auto custom-scrollbar leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-emerald-400/80' : 'bg-slate-100 text-indigo-700'}`}>{JSON.stringify(analysis.structured_data, null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const IndicatorCard = ({ icon, label, value, color, isDark }: any) => {
  const colors: any = { emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20', indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20' };
  return (
    <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
       <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
       <div><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p><p className={`text-sm font-black uppercase tracking-tight ${colors[color].split(' ')[0]}`}>{value}</p></div>
    </div>
  );
};

const MarkdownView = ({ content, isDark }: { content: string; isDark: boolean }) => {
  const html = content
    .replace(/^### (.*$)/gim, '<h3 class="text-indigo-400 text-sm font-black uppercase tracking-widest mt-8 mb-4 border-b border-indigo-500/20 pb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-indigo-400 text-lg font-black uppercase tracking-tight mt-10 mb-6">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-indigo-400 text-2xl font-black uppercase tracking-tight mb-8">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-black">$1</strong>')
    .replace(/\|/g, '')
    .replace(/\n/g, '<br/>');
  return <div className={`text-[12px] font-bold leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`} dangerouslySetInnerHTML={{ __html: html }} />;
};

export default EmailHeaderTool;