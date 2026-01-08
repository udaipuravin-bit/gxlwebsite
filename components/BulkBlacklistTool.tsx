import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Zap, 
  Loader2, 
  Globe, 
  Database,
  Grid,
  ShieldAlert,
  Download,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Wifi,
  Terminal,
  Activity,
  Filter,
  X
} from 'lucide-react';
import { BlacklistAuditEntry, DnsResponse } from '../types';
import { lookupPtrRecord } from '../services/dnsService';
import { useNotify } from '../App';

interface BulkBlacklistToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const DQS_KEY = 'cnrmf6qnuzmpx57lve7mtvhr2q';

const BulkBlacklistTool: React.FC<BulkBlacklistToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [ipInput, setIpInput] = useState('');
  const [domainInput, setDomainInput] = useState('');
  const [results, setResults] = useState<BlacklistAuditEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);

  const queryDnsbl = async (query: string): Promise<boolean> => {
    try {
      const res = await fetch(`https://dns.google/resolve?name=${query}&type=A`);
      const data: DnsResponse = await res.json();
      return !!(data.Status === 0 && data.Answer);
    } catch {
      return false;
    }
  };

  const auditSingleEntry = async (item: string, type: 'ip' | 'domain'): Promise<Partial<BlacklistAuditEntry>> => {
    const res: Partial<BlacklistAuditEntry> = {
      spamhaus: 'pending',
      spamcop: type === 'ip' ? 'pending' : 'n/a',
      barracuda: 'pending',
      ptr: 'Checking...'
    };

    try {
      if (type === 'ip') {
        const reversed = item.split('.').reverse().join('.');
        const [ptr, sh, sc, bc] = await Promise.all([
          lookupPtrRecord(item),
          queryDnsbl(`${reversed}.${DQS_KEY}.zen.dq.spamhaus.net`),
          queryDnsbl(`${reversed}.bl.spamcop.net`),
          queryDnsbl(`${reversed}.b.barracudacentral.org`)
        ]);

        res.ptr = ptr || 'No PTR Record';
        res.spamhaus = sh ? 'listed' : 'clean';
        res.spamcop = sc ? 'listed' : 'clean';
        res.barracuda = bc ? 'listed' : 'clean';
      } else {
        const [sh, bc] = await Promise.all([
          queryDnsbl(`${item}.${DQS_KEY}.dbl.dq.spamhaus.net`),
          queryDnsbl(`${item}.dbl.barracudacentral.org`)
        ]);

        res.ptr = 'Domain status check';
        res.spamhaus = sh ? 'listed' : 'clean';
        res.barracuda = bc ? 'listed' : 'clean';
        res.spamcop = 'n/a';
      }
      return res;
    } catch (e) {
      return { ...res, status: 'error' };
    }
  };

  const handleAudit = async () => {
    const rawIps = ipInput.split(/[\n,]/).map(i => i.trim()).filter(i => i.length > 0);
    const rawDomains = domainInput.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0);

    const initialEntries: BlacklistAuditEntry[] = [
      ...rawIps.map((ip, i) => ({ id: i + 1, input: ip, type: 'ip' as const, ptr: '...', spamhaus: 'pending' as const, spamcop: 'pending' as const, barracuda: 'pending' as const, status: 'pending' as const })),
      ...rawDomains.map((dom, i) => ({ id: rawIps.length + i + 1, input: dom, type: 'domain' as const, ptr: '...', spamhaus: 'pending' as const, spamcop: 'n/a' as const, barracuda: 'pending' as const, status: 'pending' as const }))
    ];

    if (initialEntries.length === 0) {
      notify('warning', 'Please provide IPs or Domains to check.');
      return;
    }

    setResults(initialEntries);
    setIsProcessing(true);
    setProgress(0);
    notify('info', `Checking ${initialEntries.length} targets...`);

    const BATCH_SIZE = 5;
    for (let i = 0; i < initialEntries.length; i += BATCH_SIZE) {
      const batch = initialEntries.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (entry) => {
        setResults(prev => prev.map(r => r.id === entry.id ? { ...r, status: 'loading' } : r));
        const audit = await auditSingleEntry(entry.input, entry.type);
        setResults(prev => prev.map(r => r.id === entry.id ? { ...r, ...audit, status: 'complete' } : r));
      }));

      setProgress(Math.round(((i + batch.length) / initialEntries.length) * 100));
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setIsProcessing(false);
    notify('success', 'Blacklist check complete.');
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return results.filter(r => r.input.toLowerCase().includes(q) || r.ptr.toLowerCase().includes(q));
  }, [results, searchQuery]);

  const stats = useMemo(() => ({
    listed: results.filter(r => r.spamhaus === 'listed' || r.spamcop === 'listed' || r.barracuda === 'listed').length,
    clean: results.filter(r => r.status === 'complete' && r.spamhaus === 'clean' && (r.spamcop === 'clean' || r.spamcop === 'n/a') && r.barracuda === 'clean').length
  }), [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-[2rem] shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl">
              <Grid size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-indigo-500">Blacklist Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Check status on multiple blacklists</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Wifi size={14} className="text-indigo-400" /> IP List
              </span>
           </div>
           <textarea
             value={ipInput}
             onChange={(e) => setIpInput(e.target.value)}
             placeholder="8.8.8.8, 1.1.1.1"
             className={`w-full h-40 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
           />
        </div>

        <div className={`p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Globe size={14} className="text-indigo-400" /> Domain List
              </span>
           </div>
           <textarea
             value={domainInput}
             onChange={(e) => setDomainInput(e.target.value)}
             placeholder="google.com, apple.com"
             className={`w-full h-40 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
           />
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="flex gap-4">
            <div className={`px-4 py-2 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
               <span className="text-[8px] font-black text-slate-500 uppercase block tracking-widest">Protocol</span>
               <span className="text-[10px] font-bold text-indigo-400">DNS Check</span>
            </div>
         </div>

         <div className="flex gap-3 w-full sm:w-auto">
            {results.length > 0 && (
              <button onClick={() => setResults([])} className="p-4 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-2xl transition-all hover:bg-rose-500/20">
                 <Trash2 size={18} />
              </button>
            )}
            <button
              onClick={handleAudit}
              disabled={isProcessing || (!ipInput.trim() && !domainInput.trim())}
              className="flex-1 sm:flex-none px-12 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Checking...</> : <><Zap size={16} /> Run Checker</>}
            </button>
         </div>
      </div>

      {isProcessing && (
        <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
           <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      )}

      {results.length > 0 && (
        <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
               <Filter size={14} className="text-indigo-500" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Results</h2>
            </div>
            
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>

            <div className="flex gap-4">
               <div className="text-right">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Listed</p>
                  <p className="text-sm font-black text-rose-500">{stats.listed}</p>
               </div>
               <div className="text-right border-l border-slate-800 pl-4">
                  <p className="text-[8px] font-black text-slate-500 uppercase">Clean</p>
                  <p className="text-sm font-black text-emerald-500">{stats.clean}</p>
               </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.25em] text-slate-500`}>
                  <th className="px-8 py-5 w-16 text-center">ID</th>
                  <th className="px-8 py-5">Target</th>
                  <th className="px-8 py-5">Status</th>
                  <th className="px-8 py-5 text-center">Spamhaus</th>
                  <th className="px-8 py-5 text-center">SpamCop</th>
                  <th className="px-8 py-5 text-center">Barracuda</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className="px-8 py-5">
                       <div className="flex flex-col">
                          <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.input}</span>
                          <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest mt-0.5">{r.type} Check</span>
                       </div>
                    </td>
                    <td className="px-8 py-5">
                       <span className="text-[10px] font-bold text-slate-500 italic truncate max-w-[200px] block">{r.ptr}</span>
                    </td>
                    <td className="px-8 py-5 text-center"><ListedBadge status={r.spamhaus} /></td>
                    <td className="px-8 py-5 text-center">
                       {r.type === 'ip' ? <ListedBadge status={r.spamcop} /> : <span className="text-[9px] text-slate-700">—</span>}
                    </td>
                    <td className="px-8 py-5 text-center"><ListedBadge status={r.barracuda} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className={`shrink-0 px-6 py-4 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>© {new Date().getFullYear()} Toolbox</p>
      </footer>
    </div>
  );
};

const ListedBadge = ({ status }: { status: string }) => {
  if (status === 'pending') return <span className="text-[9px] text-slate-700 animate-pulse uppercase font-black">...</span>;
  if (status === 'error') return <span className="text-[9px] text-rose-500 uppercase font-black">Err</span>;
  if (status === 'n/a') return <span className="text-[9px] text-slate-800 uppercase font-black">—</span>;
  
  const isListed = status === 'listed';
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.1em] border transition-all ${
      isListed 
        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
    }`}>
      {isListed ? 'LISTED' : 'CLEAN'}
    </span>
  );
};

export default BulkBlacklistTool;