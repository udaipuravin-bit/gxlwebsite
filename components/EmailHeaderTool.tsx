
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Play, 
  Loader2, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  Mail, 
  Info,
  Code,
  ClipboardCheck,
  AlertTriangle,
  Fingerprint,
  Zap,
  Layout,
  Terminal,
  Download
} from 'lucide-react';
import { analyzeEmailHeader } from '../services/geminiService';
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

  const handleAnalyze = async () => {
    if (!headerInput.trim()) {
      notify('warning', 'Please provide raw email headers.');
      return;
    }
    
    setIsAnalyzing(true);
    setAnalysis(null);
    notify('info', 'Engaging Protocol Analysis Engine...');

    try {
      const result = await analyzeEmailHeader(headerInput);
      setAnalysis(result);
      notify('success', 'Forensic analysis complete.');
    } catch (err) {
      notify('error', 'Analysis engine failed. Ensure header is valid.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    notify('success', 'Content copied.');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col gap-0 overflow-hidden">
      <header className={`shrink-0 flex items-center justify-between px-6 py-4 border-b ${cardClasses} z-50 shadow-sm`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white shadow-xl shadow-indigo-600/20">
              <FileText size={20} />
            </div>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest">Protocol Header Analyzer</h1>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Deterministic Forensic Engine</p>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="flex items-center gap-2">
            <div className={`flex p-1 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
              <button 
                onClick={() => setActiveTab('report')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'report' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Diagnostic
              </button>
              <button 
                onClick={() => setActiveTab('json')}
                className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'json' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
              >
                Protocol JSON
              </button>
            </div>
            <button 
              onClick={() => copyToClipboard(activeTab === 'report' ? analysis.report_markdown : JSON.stringify(analysis.structured_data, null, 2))}
              className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-indigo-400' : 'bg-white border-slate-200 text-slate-600'}`}
            >
              <ClipboardCheck size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="flex-1 flex min-h-0">
        {/* Source Side */}
        <div className={`w-[400px] shrink-0 border-r flex flex-col ${isDark ? 'bg-slate-950 border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
          <div className="px-4 py-2 border-b flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Terminal size={12} className="text-indigo-400" /> RAW HEADER SOURCE
            </span>
            <button onClick={() => setHeaderInput('')} className="text-slate-600 hover:text-rose-400 transition-colors">
              <Trash2 size={12} />
            </button>
          </div>
          <div className="flex-1 relative">
            <textarea
              value={headerInput}
              onChange={(e) => setHeaderInput(e.target.value)}
              className={`w-full h-full p-4 outline-none font-mono text-[11px] resize-none custom-scrollbar leading-relaxed bg-transparent ${isDark ? 'text-slate-300' : 'text-slate-700'}`}
              placeholder="Paste raw email header here... (Authentication-Results, Received, DKIM-Signature, etc.)"
            />
          </div>
          <div className="p-4 border-t">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !headerInput.trim()}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isAnalyzing ? <><Loader2 size={16} className="animate-spin" /> Analyzing Protocol...</> : <><Zap size={16} /> Run Analysis Engine</>}
            </button>
          </div>
        </div>

        {/* Results Side */}
        <div className={`flex-1 overflow-auto custom-scrollbar ${isDark ? 'bg-[#05080f]' : 'bg-white'}`}>
          {!analysis && !isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
               <div className="relative">
                  <Mail size={80} strokeWidth={1} />
                  <Zap size={24} className="absolute -top-2 -right-2 text-indigo-500" />
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2">Diagnostic Awaiting Data</p>
                  <p className="text-[9px] font-bold uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">Paste full email headers to begin deterministic audit</p>
               </div>
            </div>
          )}

          {isAnalyzing && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
               <div className="relative w-16 h-16">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                  <div className="absolute inset-0 rounded-full border-t-4 border-indigo-500 animate-spin" />
               </div>
               <div className="text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 animate-pulse">Scanning Mail Matrix</p>
               </div>
            </div>
          )}

          {analysis && (
            <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {activeTab === 'report' ? (
                <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
                  {/* Summary Indicators */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                     <IndicatorCard 
                        icon={<ShieldCheck size={20}/>} 
                        label="Auth Status" 
                        value={analysis.structured_data.authentication_results.dmarc === 'pass' ? 'PASSED' : 'UNVERIFIED'} 
                        color={analysis.structured_data.authentication_results.dmarc === 'pass' ? 'emerald' : 'rose'}
                        isDark={isDark}
                     />
                     <IndicatorCard 
                        icon={<History size={20}/>} 
                        label="Hops Count" 
                        value={analysis.structured_data.hops.length} 
                        color="indigo"
                        isDark={isDark}
                     />
                     <IndicatorCard 
                        icon={<Fingerprint size={20}/>} 
                        label="Origin IP" 
                        value={analysis.structured_data.hops[analysis.structured_data.hops.length - 1]?.sending_ip || 'N/A'} 
                        color="sky"
                        isDark={isDark}
                     />
                  </div>

                  <div className={`rounded-3xl border p-8 ${isDark ? 'bg-slate-900/50 border-[#1e293b]' : 'bg-slate-50 border-slate-200'}`}>
                    <MarkdownView content={analysis.report_markdown} isDark={isDark} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                     <span className="text-[10px] font-black uppercase text-indigo-400 tracking-widest flex items-center gap-2">
                        <Code size={14}/> Structured Protocol Matrix
                     </span>
                     <button 
                      onClick={() => {
                        const blob = new Blob([JSON.stringify(analysis.structured_data, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `header_audit_${analysis.structured_data.message_details.message_id || 'dump'}.json`;
                        a.click();
                      }}
                      className="text-[10px] font-black uppercase text-slate-500 hover:text-white flex items-center gap-2"
                     >
                        <Download size={14}/> Export Schema
                     </button>
                  </div>
                  <pre className={`p-6 rounded-2xl border font-mono text-[11px] overflow-auto custom-scrollbar leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-emerald-400/80' : 'bg-slate-100 text-indigo-700'}`}>
                    {JSON.stringify(analysis.structured_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className={`shrink-0 px-6 py-2 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="flex gap-4">
           <span>RFC 5322 & 2822 Compliant</span>
           <span className="opacity-40">|</span>
           <span className="flex items-center gap-1.5 text-emerald-500"><ShieldCheck size={12}/> Validated Signature Audit</span>
        </div>
        <p>© {new Date().getFullYear()} Authenticator Pro Forensic Lab</p>
      </footer>
    </div>
  );
};

const IndicatorCard = ({ icon, label, value, color, isDark }: any) => {
  const colors: any = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-500 bg-rose-500/10 border-rose-500/20',
    indigo: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    sky: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
  };
  return (
    <div className={`p-5 rounded-3xl border flex items-center gap-4 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
       <div className={`p-3 rounded-2xl ${colors[color]}`}>{icon}</div>
       <div>
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
          <p className={`text-sm font-black uppercase tracking-tight ${colors[color].split(' ')[0]}`}>{value}</p>
       </div>
    </div>
  );
};

// Simple Markdown replacement for the forensic report
const MarkdownView = ({ content, isDark }: { content: string; isDark: boolean }) => {
  const html = content
    .replace(/^### (.*$)/gim, '<h3 class="text-indigo-400 text-sm font-black uppercase tracking-widest mt-8 mb-4 border-b border-indigo-500/20 pb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-white text-lg font-black uppercase tracking-tight mt-10 mb-6">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-white text-2xl font-black uppercase tracking-tight mb-8">$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-indigo-400 font-black">$1</strong>')
    .replace(/\|/g, '') // Rough table handling
    .replace(/\n/g, '<br/>');

  return (
    <div 
      className={`text-[12px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default EmailHeaderTool;
