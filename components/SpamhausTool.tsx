import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Download, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Terminal, 
  ExternalLink, 
  ChevronRight,
  Info,
  X,
  ShieldAlert,
  Shield,
  AlertTriangle,
  FileCheck,
  History
} from 'lucide-react';
import { SpamhausResult } from '../types';
import { lookupSpamhausReputation, getIPReleaseDate, getDomainReleaseDate } from '../services/dnsService';
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
    return Array.from(new Set(inputLines)).slice(0, 1000); 
  }, [inputLines]);

  const handleProcess = async () => {
    if (uniqueInputs.length === 0) {
      notify('warning', 'Input required: Please provide bulk IPs or domains.');
      return;
    }

    setResults(uniqueInputs.map((u, i) => ({
      id: i + 1,
      input: u,
      type: u.includes(':') || /^(\d{1,3}\.){3}\d{1,3}$/.test(u) ? 'ip' : 'domain',
      listed: false,
      datasets: [],
      reason: '',
      status: 'pending'
    })));

    setIsProcessing(true);
    setShowInstructions(false);
    notify('info', `Audit matrix initialized for ${uniqueInputs.length} targets.`);

    for (let i = 0; i < uniqueInputs.length; i++) {
      const target = uniqueInputs[i];
      const type = target.includes(':') || /^(\d{1,3}\.){3}\d{1,3}$/.test(target) ? 'ip' : 'domain';
      
      setResults(prev => prev.map(r => r.input === target ? { ...r, status: 'loading' } : r));

      try {
        const reputation = await lookupSpamhausReputation(target, type);
        
        const isListed = reputation.some(rep => rep.listed);
        // Extract the granular sub-datasets (XBL, CSS, SBL, etc)
        const allLists = Array.from(new Set(reputation.flatMap(rep => rep.lists)));
        const reasons = reputation.filter(rep => rep.listed || rep.reason.includes('Unauthorized')).map(rep => rep.reason);

        let status: SpamhausResult['status'] = 'clean';
        if (isListed) {
          const codes = reputation.flatMap(rep => rep.codes);
          const isHighRisk = codes.some(c => {
               const last = c.split('.').pop() || '';
               return ['2','3','4','5','6','7','9'].includes(last);
          });
          status = isHighRisk ? 'listed-high' : 'listed-low';
        }

        // Only XBL, CSS, DBL fetch the release date. SBL/PBL-only is ignored.
        const historyAllowed = allLists.some(list => {
          const u = list.toUpperCase();
          return u.includes('XBL') || u.includes('CSS') || u.includes('DBL');
        });

        const baseResult: Partial<SpamhausResult> = {
          listed: isListed,
          datasets: isListed ? allLists : (reasons.some(r => r.includes('Unauthorized')) ? ['Error'] : ['None']),
          reason: reasons.length > 0 ? (isListed ? reasons.join('; ') : reasons[0]) : 'NOT LISTED',
          status: reasons.some(r => r.includes('Unauthorized')) ? 'error' : status,
          releaseDate: (isListed && historyAllowed) ? 'pending_history' : '—'
        };

        setResults(prev => prev.map(r => r.input === target ? { ...r, ...baseResult } as SpamhausResult : r));

        // Background fetch for release dates ONLY if allowed
        if (isListed && historyAllowed) {
          (async () => {
            try {
              const history = type === 'ip' ? await getIPReleaseDate(target) : await getDomainReleaseDate(target);
              setResults(prev => prev.map(r => r.input === target ? { ...r, releaseDate: history.text } : r));
            } catch (err) {
              setResults(prev => prev.map(r => r.input === target ? { ...r, releaseDate: '<span class="text-rose-500 opacity-40">Fetch Error</span>' } : r));
            }
          })();
        }

      } catch (err: any) {
        setResults(prev => prev.map(r => r.input === target ? { 
          ...r, 
          status: 'error', 
          listed: false, 
          reason: err.message || 'DQS Resolve failure' 
        } : r));
      }
    }

    setIsProcessing(false);
    notify('success', 'Core reputation audit complete.');
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => 
      r.input.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reason.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-600';

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      
      {/* Header */}
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-xl shadow-rose-600/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Spamhaus Intelligence Hub</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">XBL / CSS / DBL Release Timeline</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setShowInstructions(!showInstructions)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-all font-bold text-xs border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            <Info size={16} /> <span className="hidden sm:inline">Operational Guide</span>
          </button>
        </div>
      </header>

      {/* Manual */}
      {showInstructions && (
        <section className={`p-8 rounded-3xl border animate-in slide-in-from-top-4 duration-300 ${cardClasses}`}>
          <div className="flex justify-between items-start mb-6">
             <h2 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
               <ShieldCheck className="text-rose-500" /> Professional Protocol
             </h2>
             <button onClick={() => setShowInstructions(false)} className="text-slate-500 hover:text-white">
                <X size={20} />
             </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
             <div className="space-y-4">
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-rose-500"/> Phase 1: DNSBL
                </p>
                <p className="text-slate-500 leading-relaxed font-medium">Verify current listing status across Spamhaus datasets (ZEN, DBL) using low-latency DNS resolution.</p>
             </div>
             <div className="space-y-4">
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-rose-500"/> Phase 2: Timeline
                </p>
                <p className="text-slate-500 leading-relaxed font-medium">For XBL, CSS, and DBL listings, the system queries the forensic timeline to determine the "Valid Until" timestamp.</p>
             </div>
             <div className="space-y-4">
                <p className="font-black text-slate-400 uppercase text-[10px] tracking-widest flex items-center gap-2">
                  <ChevronRight size={12} className="text-rose-500"/> IST Localization
                </p>
                <p className="text-slate-500 leading-relaxed font-medium">All timestamps are normalized and converted to Indian Standard Time (IST) for consistent forensic reporting.</p>
             </div>
          </div>
        </section>
      )}

      {/* Input Matrix */}
      <div className="grid grid-cols-1 gap-6">
        <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Terminal size={12} className="text-rose-500" /> Target Forensic Identifiers (IPs/Domains)
            </label>
            <span className="text-[10px] font-black text-slate-600 italic">Audit Capacity: 1,000 entries per session</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="8.8.8.8&#10;google.com&#10;2001:4860:4860::8888"
            className={`w-full h-56 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className={`px-5 py-2.5 rounded-2xl border flex items-center gap-3 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
               <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Targets Detected</span>
                  <span className="text-lg font-black text-rose-500 leading-none">{uniqueInputs.length}</span>
               </div>
            </div>
            <button
              onClick={handleProcess}
              disabled={isProcessing || uniqueInputs.length === 0}
              className="w-full sm:w-auto px-12 py-4 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Querying Nodes...</> : <><Zap size={16} /> Run Full Audit</>}
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
                placeholder="Search matrix results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
            <div className="flex gap-2">
               <button 
                onClick={() => {
                  const csv = [['Sl No', 'Identifier', 'Listed', 'Datasets', 'Reason', 'Release Date'].join(','), ...results.map(r => [r.id, r.input, r.listed ? 'YES' : 'NO', r.datasets.join(';'), r.reason, (r.releaseDate || '—').replace(/<[^>]*>/g, '')].join(','))].join('\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.setAttribute('href', url);
                  a.setAttribute('download', `spamhaus_timeline_${Date.now()}.csv`);
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl border font-black text-[10px] uppercase tracking-widest transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Download size={14} /> CSV Report
              </button>
              <button onClick={() => { setResults([]); notify('info', 'Matrix reset.'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-sm font-bold transition-all border border-rose-500/20">
                <Trash2 size={20} />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                  <th className="px-6 py-4 w-16 text-center">Sl No</th>
                  <th className="px-6 py-4">IP / Domain Identifier</th>
                  <th className="px-6 py-4 text-center">Listed</th>
                  <th className="px-6 py-4">Dataset(s)</th>
                  <th className="px-6 py-4">Reason / Reputation</th>
                  <th className="px-6 py-4 min-w-[280px]">Release Timeline (IST)</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r, index) => (
                  <tr key={index} className="hover:bg-rose-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.input}</span>
                         <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.2em] mt-0.5">{r.type} AUDIT</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={r.status} listed={r.listed} />
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-wrap gap-1">
                          {r.datasets.map((d, i) => (
                            <span key={i} className={`px-1.5 py-0.5 rounded text-[8px] font-black border uppercase tracking-tighter ${r.listed ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'}`}>
                              {d}
                            </span>
                          ))}
                       </div>
                    </td>
                    <td className="px-6 py-4">
                       <p className={`text-xs font-bold ${r.status === 'error' ? 'text-rose-600 italic' : r.listed ? (r.status === 'listed-high' ? 'text-rose-400' : 'text-amber-500') : 'text-slate-500 opacity-60'}`}>
                         {r.reason}
                       </p>
                    </td>
                    <td className="px-6 py-4">
                       <ReleaseDateCell releaseDate={r.releaseDate} listed={r.listed} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer Branding */}
      <footer className={`mt-auto pt-10 border-t flex flex-col sm:flex-row justify-between items-center gap-6 text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>© {new Date().getFullYear()} Authenticator Pro Lab • Spamhaus Intelligence Hub v7.3.0</p>
        <div className="flex gap-6">
          <a href="https://www.spamhaus.org/lookup/" target="_blank" className="hover:text-rose-400 flex items-center gap-1">Manual Audit <ExternalLink size={10}/></a>
        </div>
      </footer>
    </div>
  );
};

const ReleaseDateCell: React.FC<{ releaseDate?: string; listed: boolean }> = ({ releaseDate, listed }) => {
  if (!listed) return <span className="text-[10px] text-slate-600">—</span>;
  if (!releaseDate || releaseDate === 'pending_history') {
    return (
      <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">
        <Loader2 size={12} className="animate-spin" /> Fetching Timeline...
      </div>
    );
  }
  return (
    <div 
      className="text-[10px] font-mono leading-relaxed space-y-1"
      dangerouslySetInnerHTML={{ __html: releaseDate }}
    />
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
    clean: 'NO',
    'listed-high': 'YES (High)',
    'listed-low': 'YES (Low)',
    loading: 'QUERY',
    error: 'KEY ERROR',
    pending: 'QUEUE'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default SpamhausTool;