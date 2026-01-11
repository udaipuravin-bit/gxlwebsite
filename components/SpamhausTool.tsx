import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Loader2, 
  ShieldAlert, 
  Zap, 
  Terminal,
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

  const inputLines = useMemo(() => input.split(/\n/).map(l => l.trim()).filter(l => l.length > 0), [input]);
  const uniqueInputs = useMemo(() => Array.from(new Set(inputLines)).slice(0, 500), [inputLines]);

  const handleProcess = async () => {
    if (uniqueInputs.length === 0) { notify('warning', 'Input required.'); return; }
    setResults(uniqueInputs.map((u, i) => ({ id: i + 1, input: u, type: u.includes(':') || /^(\d{1,3}\.){3}\d{1,3}$/.test(u) ? 'ip' : 'domain', listed: false, datasets: [], reason: '', status: 'pending' })));
    setIsProcessing(true);
    for (let i = 0; i < uniqueInputs.length; i++) {
      const target = uniqueInputs[i];
      const type = target.includes(':') || /^(\d{1,3}\.){3}\d{1,3}$/.test(target) ? 'ip' : 'domain';
      setResults(prev => prev.map(r => r.input === target ? { ...r, status: 'loading' } : r));
      try {
        const reputation = await lookupSpamhausReputation(target, type);
        const isListed = reputation.some(rep => rep.listed);
        const allLists = Array.from(new Set(reputation.flatMap(rep => rep.lists)));
        const reasons = reputation.filter(rep => rep.listed).map(rep => rep.reason);
        let status: SpamhausResult['status'] = 'clean';
        if (isListed) status = reputation.flatMap(rep => rep.codes).some(c => ['2','3','4','5','6','7','9'].includes(c.split('.').pop() || '')) ? 'listed-high' : 'listed-low';
        
        const historyAllowed = allLists.some(list => ['XBL', 'CSS', 'DBL'].some(k => list.toUpperCase().includes(k)));
        const baseResult: Partial<SpamhausResult> = { 
          listed: isListed, 
          datasets: isListed ? allLists : ['None'], 
          reason: isListed ? Array.from(new Set(reasons)).join('; ') : 'NOT LISTED', 
          status: status, 
          releaseDate: (isListed && historyAllowed) ? 'pending_history' : '—' 
        };
        
        setResults(prev => prev.map(r => r.input === target ? { ...r, ...baseResult } as SpamhausResult : r));
        
        if (isListed && historyAllowed) {
          (async () => {
            const history = type === 'ip' ? await getIPReleaseDate(target) : await getDomainReleaseDate(target);
            setResults(prev => prev.map(r => r.input === target ? { ...r, releaseDate: history.text } : r));
          })();
        }
      } catch (err: any) { setResults(prev => prev.map(r => r.input === target ? { ...r, status: 'error', listed: false, reason: err.message || 'Resolve failure' } : r)); }
    }
    setIsProcessing(false);
    notify('success', 'Forensic reputation audit finalized.');
  };

  const filteredResults = useMemo(() => results.filter(r => r.input.toLowerCase().includes(searchQuery.toLowerCase()) || r.reason.toLowerCase().includes(searchQuery.toLowerCase())), [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2.5 rounded-2xl text-white shadow-xl shadow-rose-600/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-rose-500">Spamhaus Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Forensic Reputation & Release Audit</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => setResults([])} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="flex flex-col gap-6">
        <div className={`p-8 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12} className="text-rose-500" /> Target Node Matrix (One per line)</label>
          <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="8.8.8.8&#10;google.com" className={`w-full h-32 p-5 rounded-[1.5rem] border outline-none font-mono text-sm resize-none transition-all ${inputClasses}`} />
          <button onClick={handleProcess} disabled={isProcessing || uniqueInputs.length === 0} className="w-full py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {isProcessing ? <><Loader2 size={18} className="animate-spin" /> AUDITING MATRIX...</> : <><Zap size={18} /> RUN REPUTATION AUDIT</>}
          </button>
        </div>

        <div className={`rounded-[2rem] border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-6 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
               <History size={18} className="text-rose-400" />
               <h2 className="text-[12px] font-black uppercase tracking-widest">History & Release Node</h2>
            </div>
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input type="text" placeholder="Search result matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-sm font-bold transition-all ${inputClasses}`} />
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  <th className="px-8 py-5 w-16 text-center">ID</th>
                  <th className="px-8 py-5">Node Target</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Lists</th>
                  <th className="px-8 py-5">Forensic History</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-rose-500/5 transition-all group">
                    <td className="px-8 py-6 text-sm font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.input}</span>
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{r.type} check</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-8 py-6">
                       <div className="flex flex-wrap gap-1">
                          {r.datasets.map((d, i) => (
                            <span key={i} className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${r.listed ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>{d}</span>
                          ))}
                       </div>
                    </td>
                    <td className="px-8 py-6">
                       {r.releaseDate === 'pending_history' ? (
                         <div className="flex items-center gap-2 text-[10px] font-black text-rose-400 animate-pulse uppercase"><Loader2 size={12} className="animate-spin" /> Querying...</div>
                       ) : (
                         <div className="text-sm font-bold text-slate-500 uppercase leading-relaxed" dangerouslySetInnerHTML={{ __html: r.releaseDate || '—' }} />
                       )}
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-6 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">Awaiting Analysis</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: SpamhausResult['status'] }) => {
  const styles = { clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', 'listed-high': 'bg-rose-500/10 text-rose-500 border-rose-500/20', 'listed-low': 'bg-amber-500/10 text-amber-500 border-amber-500/20', loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse', error: 'bg-rose-500/10 text-rose-500 border-rose-500/20', pending: 'bg-slate-800 text-slate-600 border-slate-700' };
  const labels = { clean: 'CLEAN', 'listed-high': 'LISTED', 'listed-low': 'LISTED', loading: 'WAIT', error: 'ERR', pending: '...' };
  return <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase border ${styles[status]}`}>{labels[status]}</span>;
};

export default SpamhausTool;