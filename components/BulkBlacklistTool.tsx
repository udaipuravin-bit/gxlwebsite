import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Zap, 
  Loader2, 
  Globe, 
  Grid,
  Activity,
  Wifi,
  Terminal,
  Server,
  Layers
} from 'lucide-react';
import { DnsResponse } from '../types';
import { useNotify } from '../App';
import { lookupPtrRecord } from '../services/dnsService';

interface MatrixEntry {
  id: number;
  target: string;
  type: 'ip' | 'domain';
  statusLabel: string;
  statusColor: 'neutral' | 'positive' | 'negative' | 'loading' | 'pending';
  spamhaus: 'clean' | 'listed' | 'loading' | 'pending' | 'error';
  spamcop: 'clean' | 'listed' | 'loading' | 'pending' | 'error' | 'n/a';
  barracuda: 'clean' | 'listed' | 'loading' | 'pending' | 'error';
}

const DQS_KEY = 'cnrmf6qnuzmpx57lve7mtvhr2q';

const BulkBlacklistTool: React.FC<{ onBack: () => void; theme: 'dark' | 'light' }> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [inputMode, setInputMode] = useState<'ip' | 'domain'>('ip');
  const [inputText, setInputText] = useState('');
  const [results, setResults] = useState<MatrixEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const queryDns = async (name: string, type: string = 'A'): Promise<DnsResponse> => {
    const res = await fetch(`https://dns.google/resolve?name=${name}&type=${type}`);
    return await res.json();
  };

  const auditTarget = async (item: MatrixEntry): Promise<Partial<MatrixEntry>> => {
    const update: Partial<MatrixEntry> = {
      spamhaus: 'pending',
      spamcop: 'pending',
      barracuda: 'pending',
    };

    try {
      if (item.type === 'ip') {
        const reversed = item.target.split('.').reverse().join('.');
        const ptr = await lookupPtrRecord(item.target);
        update.statusLabel = ptr || 'No PTR Record';
        update.statusColor = ptr ? 'positive' : 'neutral';
        const shRes = await queryDns(`${reversed}.${DQS_KEY}.zen.dq.spamhaus.net`);
        update.spamhaus = (shRes.Status === 0 && shRes.Answer) ? 'listed' : 'clean';
        const scRes = await queryDns(`${reversed}.bl.spamcop.net`);
        update.spamcop = (scRes.Status === 0 && scRes.Answer) ? 'listed' : 'clean';
        const bcRes = await queryDns(`${reversed}.b.barracudacentral.org`);
        update.barracuda = (bcRes.Status === 0 && bcRes.Answer) ? 'listed' : 'clean';
      } else {
        update.statusLabel = 'Domain Check';
        update.statusColor = 'neutral';
        const shRes = await queryDns(`${item.target}.${DQS_KEY}.dbl.dq.spamhaus.net`);
        update.spamhaus = (shRes.Status === 0 && shRes.Answer) ? 'listed' : 'clean';
        update.spamcop = 'n/a';
        const bcRes = await queryDns(`${item.target}.dbl.barracudacentral.org`);
        update.barracuda = (bcRes.Status === 0 && bcRes.Answer) ? 'listed' : 'clean';
      }
      return update;
    } catch (e) {
      return { spamhaus: 'error', spamcop: 'error', barracuda: 'error', statusLabel: 'Node Error' };
    }
  };

  const handleAudit = async () => {
    const targets = inputText.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0);

    if (targets.length === 0) {
      notify('warning', `Please provide ${inputMode === 'ip' ? 'IPv4 addresses' : 'domain names'} to audit.`);
      return;
    }

    const initialEntries: MatrixEntry[] = targets.map((target, i) => ({
      id: i + 1,
      target: inputMode === 'domain' ? target.toLowerCase() : target,
      type: inputMode,
      statusLabel: 'Waiting...',
      statusColor: 'pending' as const,
      spamhaus: 'pending' as const,
      spamcop: 'pending' as const,
      barracuda: 'pending' as const
    }));

    setResults(initialEntries);
    setIsProcessing(true);

    const BATCH_SIZE = 4;
    for (let i = 0; i < initialEntries.length; i += BATCH_SIZE) {
      const batch = initialEntries.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (entry) => {
        setResults(prev => prev.map(r => r.id === entry.id ? { ...r, spamhaus: 'loading', spamcop: 'loading', barracuda: 'loading' } : r));
        const audit = await auditTarget(entry);
        setResults(prev => prev.map(r => r.id === entry.id ? { ...r, ...audit } as MatrixEntry : r));
      }));
    }
    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return results.filter(r => r.target.includes(q) || r.statusLabel.toLowerCase().includes(q));
  }, [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-xl shadow-orange-600/20">
              <Grid size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-orange-500">Blacklist Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk Node Reputation Audit</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => setResults([])} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="flex flex-col gap-6">
        <div className={`p-8 rounded-[2rem] border flex flex-col gap-6 ${cardClasses}`}>
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Select Audit Mode</label>
                <div className={`flex p-1 rounded-2xl border transition-all ${isDark ? 'bg-[#05080f] border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
                   <button 
                    onClick={() => { setInputMode('ip'); setInputText(''); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'ip' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Wifi size={14} /> IP MODE
                   </button>
                   <button 
                    onClick={() => { setInputMode('domain'); setInputText(''); }} 
                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${inputMode === 'domain' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     <Globe size={14} /> DOMAIN MODE
                   </button>
                </div>
             </div>
             <div className="flex flex-col gap-3">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Terminal size={12} className="text-orange-500" /> {inputMode === 'ip' ? 'IPV4 NODES (One per line)' : 'DOMAIN HOSTS (One per line)'}
                </label>
                <textarea 
                  value={inputText} 
                  onChange={(e) => setInputText(e.target.value)} 
                  placeholder={inputMode === 'ip' ? "8.8.8.8\n1.1.1.1" : "google.com\nmicrosoft.com"} 
                  className={`w-full h-32 p-4 border rounded-[1.5rem] outline-none font-mono text-sm resize-none transition-all ${inputClasses}`} 
                />
             </div>
           </div>
           
           <button onClick={handleAudit} disabled={isProcessing || !inputText.trim()} className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {isProcessing ? <><Loader2 size={18} className="animate-spin" /> AUDITING MATRIX...</> : <><Zap size={18} /> RUN GLOBAL REPUTATION CHECK</>}
           </button>
        </div>

        <div className={`rounded-[2rem] border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col ${cardClasses}`}>
           <div className={`p-6 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                 <Activity size={18} className="text-orange-400" />
                 <h2 className="text-[12px] font-black uppercase tracking-widest">Audit Outcome Matrix</h2>
              </div>
              <div className="relative flex-1 max-w-md w-full ml-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input type="text" placeholder="Search result node..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-sm font-bold transition-all ${inputClasses}`} />
              </div>
           </div>
           <div className="flex-1 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    <th className="px-8 py-5 w-16 text-center">ID</th>
                    <th className="px-8 py-5">Node Identity</th>
                    <th className="px-8 py-5 text-center">Spamhaus (DQS)</th>
                    <th className="px-8 py-5 text-center">SpamCop</th>
                    <th className="px-8 py-5 text-center">Barracuda</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {filteredResults.length > 0 ? filteredResults.map((r) => (
                    <tr key={r.id} className="hover:bg-orange-500/5 transition-all group">
                      <td className="px-8 py-6 text-sm font-mono font-bold text-slate-600 text-center">{r.id}</td>
                      <td className="px-8 py-6">
                         <div className="flex flex-col">
                            <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.target}</span>
                            <span className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{r.statusLabel}</span>
                         </div>
                      </td>
                      <td className="px-8 py-6 text-center"><StatusBadge status={r.spamhaus} /></td>
                      <td className="px-8 py-6 text-center">{r.spamcop === 'n/a' ? '—' : <StatusBadge status={r.spamcop as any} />}</td>
                      <td className="px-8 py-6 text-center"><StatusBadge status={r.barracuda} /></td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">Awaiting Analysis Data</td></tr>
                  )}
                </tbody>
              </table>
           </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: MatrixEntry['spamhaus'] }) => {
  if (status === 'loading') return <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse mx-auto" />;
  if (status === 'pending') return <div className="w-2 h-2 rounded-full bg-slate-800 mx-auto" />;
  const isClean = status === 'clean';
  return (
    <span className={`px-5 py-2 rounded-xl text-[11px] font-black border uppercase tracking-widest transition-all ${isClean ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
      {isClean ? 'CLEAN' : 'LISTED'}
    </span>
  );
};

export default BulkBlacklistTool;