import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Download, 
  Loader2, 
  AlertOctagon, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Globe, 
  Hash, 
  FileText, 
  Info,
  X,
  ShieldAlert,
  Terminal,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SpamhausResult } from '../types';
import { lookupSpamhausReputation } from '../services/dnsService';
import { useNotify } from '../App';

interface SpamhausToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const SpamhausTool: React.FC<SpamhausToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<SpamhausResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInstructions, setShowInstructions] = useState(false);

  const inputLines = useMemo(() => {
    return input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0);
  }, [input]);

  const uniqueInputs = useMemo(() => {
    return Array.from(new Set(inputLines));
  }, [inputLines]);

  const handleProcess = async () => {
    const dqsKey = process.env.SPAMHAUS_DQS_KEY;
    if (!dqsKey) {
      notify('error', 'Critical Error: SPAMHAUS_DQS_KEY is not configured in environment.');
      return;
    }

    if (uniqueInputs.length === 0) {
      notify('warning', 'Please provide target IPs or domains.');
      return;
    }

    if (uniqueInputs.length > 1000) {
      notify('warning', 'Bulk limit of 1000 inputs exceeded. Truncating list...');
      uniqueInputs.length = 1000;
    }

    setResults(uniqueInputs.map((u, i) => ({
      id: i + 1,
      input: u,
      type: /^(\d{1,3}\.){3}\d{1,3}$/.test(u) ? 'ip' : 'domain',
      listed: false,
      datasets: [],
      reason: '',
      codes: [],
      status: 'pending'
    })));

    setIsProcessing(true);
    notify('info', `Initializing query for ${uniqueInputs.length} targets via Spamhaus DQS.`);

    for (let i = 0; i < uniqueInputs.length; i++) {
      const target = uniqueInputs[i];
      const type = /^(\d{1,3}\.){3}\d{1,3}$/.test(target) ? 'ip' : 'domain';
      
      setResults(prev => prev.map(r => r.input === target ? { ...r, status: 'loading' } : r));

      try {
        const reputation = await lookupSpamhausReputation(target, type, dqsKey);
        
        const isListed = reputation.some(rep => rep.listed);
        const datasets = reputation.filter(rep => rep.listed).map(rep => rep.dataset);
        const reasons = reputation.filter(rep => rep.listed).map(rep => rep.reason);
        const allCodes = reputation.flatMap(rep => rep.codes);

        let status: SpamhausResult['status'] = 'clean';
        if (isListed) {
          const hasHighRisk = reputation.some(rep => 
            rep.codes.some(c => c.endsWith('.2') || c.endsWith('.3') || c.endsWith('.4') || c.endsWith('.9'))
          );
          status = hasHighRisk ? 'listed-high' : 'listed-low';
        }

        setResults(prev => prev.map(r => r.input === target ? {
          ...r,
          listed: isListed,
          datasets: isListed ? datasets : ['None'],
          reason: isListed ? reasons.join(', ') : 'NOT LISTED',
          codes: allCodes,
          status
        } : r));
      } catch (err: any) {
        setResults(prev => prev.map(r => r.input === target ? { 
          ...r, 
          status: 'error', 
          reason: err.message || 'Lookup failure' 
        } : r));
      }
    }

    setIsProcessing(false);
    notify('success', 'Spamhaus Intelligence Matrix populated.');
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => 
      r.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.datasets.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [results, searchQuery]);

  const handleExport = () => {
    if (results.length === 0) return;
    const csvContent = [
      ['SL No', 'IP Address / Domain', 'Listed', 'Dataset(s)', 'Reason / Reputation', 'Return Code(s)'],
      ...results.map(r => [
        r.id, r.input, r.listed ? 'Yes' : 'No', r.datasets.join('; '), r.reason, r.codes.join('; ')
      ])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `spamhaus_dqs_export_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    notify('success', 'Intelligence report downloaded as CSV.');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Dynamic Header */}
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-xl shadow-rose-600/20">
              <AlertOctagon size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Spamhaus DQS Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Performance Reputation Matrix</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-xs border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Info size={16} /> <span className="hidden sm:inline">How to Use</span>
          </button>
          {results.length > 0 && (
            <button onClick={() => { setResults([]); notify('info', 'Results cleared.'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-sm font-bold transition-all border border-rose-500/20">
              <Trash2 size={20} />
            </button>
          )}
        </div>
      </header>

      {/* Instructions Section */}
      {showInstructions && (
        <section className={`p-8 rounded-3xl border animate-in slide-in-from-top-4 duration-300 ${cardClasses}`}>
          <div className="flex justify-between items-start mb-6">
             <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
               <ShieldCheck className="text-indigo-500" /> Operational Protocol
             </h2>
             <button onClick={() => setShowInstructions(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 text-sm">
             <div className="space-y-4">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-indigo-500"/> Workflow
                </p>
                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>Paste IPv4 addresses or domains (one per line).</li>
                  <li>Click <strong className="text-indigo-400">"Check Reputation"</strong> to query Spamhaus DQS.</li>
                  <li>Analyze the listed dataset and response codes.</li>
                  <li>Results are strictly based on DNS A-record responses.</li>
                </ol>
             </div>
             <div className="space-y-4">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-indigo-500"/> Dataset Dictionary
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-2">
                     <span className="font-black text-indigo-400 min-w-[45px]">ZEN:</span>
                     <span className="text-slate-400">Combined IP reputation (SBL, XBL, PBL).</span>
                  </li>
                  <li className="flex gap-2">
                     <span className="font-black text-indigo-400 min-w-[45px]">DBL:</span>
                     <span className="text-slate-400">Domain Block List for malicious/spam identifiers.</span>
                  </li>
                  <li className="flex gap-2">
                     <span className="font-black text-indigo-400 min-w-[45px]">ZRD:</span>
                     <span className="text-slate-400">Zero Reputation Domains (Observed 0–24h ago).</span>
                  </li>
                </ul>
             </div>
             <div className="space-y-4">
                <p className="font-bold text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-indigo-500"/> Disclaimers
                </p>
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10">
                   <p className="text-[11px] leading-relaxed text-slate-500 italic">
                     Data provided for informational purposes. If listed, follow official Spamhaus delisting procedures at spamhaus.org. We do not store or track query history.
                   </p>
                </div>
             </div>
          </div>
        </section>
      )}

      {/* Input Area */}
      <div className="grid grid-cols-1 gap-6">
        <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Terminal size={12} className="text-indigo-400" /> Intelligence Targets
            </label>
            <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
               Max: 1000 Lines
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="8.8.8.8&#10;example.com&#10;1.2.3.4"
            className={`w-full h-56 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Unique Targets</span>
                  <span className="text-lg font-black text-indigo-500 leading-none">{uniqueInputs.length}</span>
               </div>
               <div className="h-8 w-px bg-slate-800 hidden sm:block" />
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Bulk Limit</span>
                  <span className="text-lg font-black text-slate-600 leading-none">1,000</span>
               </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing || uniqueInputs.length === 0}
              className="w-full sm:w-auto px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Auditing Matrix...</> : <><Zap size={16} /> Check Reputation</>}
            </button>
          </div>
        </div>
      </div>

      {/* Results Matrix */}
      {results.length > 0 && (
        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-5 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search result matrix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
            <button 
              onClick={handleExport}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
            >
              <Download size={14} /> Export CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                  <th className="px-6 py-4 w-16">Sl No</th>
                  <th className="px-6 py-4">IP Address / Domain</th>
                  <th className="px-6 py-4 text-center">Listed</th>
                  <th className="px-6 py-4">Dataset(s)</th>
                  <th className="px-6 py-4">Reason / Reputation</th>
                  <th className="px-6 py-4 text-right">Return Code(s)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r, index) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.input}</span>
                         <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{r.type} Check</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={r.status} listed={r.listed} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                          {r.datasets.map((d, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded text-[9px] font-black border uppercase tracking-tighter ${r.listed ? (r.status === 'listed-high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20') : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                              {d}
                            </span>
                          ))}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className={`text-xs font-bold ${r.status === 'error' ? 'text-rose-600' : r.listed ? (r.status === 'listed-high' ? 'text-rose-400' : 'text-amber-400') : 'text-slate-500'}`}>
                         {r.reason}
                       </p>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex flex-col items-end gap-1">
                          {r.codes.map((c, i) => (
                             <code key={i} className="text-[9px] font-mono font-bold text-slate-500 bg-slate-500/10 px-1.5 py-0.5 rounded border border-slate-500/10">{c}</code>
                          ))}
                          {r.codes.length === 0 && <span className="text-[10px] text-slate-700 italic">—</span>}
                       </div>
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-30">
                          <Activity size={40} />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">Matrix is empty</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Site Footer Static Content */}
      <footer className={`mt-auto pt-10 border-t flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <div className="flex items-center gap-4">
          <p>© {new Date().getFullYear()} Authenticator Pro Lab</p>
          <div className="w-px h-3 bg-slate-800 hidden sm:block" />
          <p>DQS Protocol v2.4</p>
        </div>
        <div className="flex gap-6">
          <a href="https://www.spamhaus.org/pbl/" target="_blank" className="hover:text-indigo-400 flex items-center gap-1">Spamhaus PBL <ExternalLink size={10}/></a>
          <a href="https://www.spamhaus.org/dbl/" target="_blank" className="hover:text-indigo-400 flex items-center gap-1">DBL Documentation <ExternalLink size={10}/></a>
        </div>
      </footer>
    </div>
  );
};

const StatusBadge: React.FC<{ status: SpamhausResult['status']; listed: boolean }> = ({ status, listed }) => {
  const styles = {
    clean: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    'listed-high': 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    'listed-low': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-800 text-slate-600 border-slate-700'
  };
  const labels = {
    clean: 'No',
    'listed-high': 'Yes',
    'listed-low': 'Yes',
    loading: 'Querying',
    error: 'Error',
    pending: 'Queued'
  };
  return (
    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default SpamhausTool;