import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Loader2, 
  Trash2, 
  Zap, 
  Search, 
  Activity,
  Globe
} from 'lucide-react';
import { SpamCopResult, DnsResponse } from '../types';
import { useNotify } from '../App';

interface SpamCopToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const SpamCopTool: React.FC<SpamCopToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<SpamCopResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProcess = async () => {
    const rawIps = input.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    const uniqueIps: string[] = Array.from(new Set<string>(rawIps)).slice(0, 500);

    if (uniqueIps.length === 0) { notify('warning', 'Please provide IPv4 addresses.'); return; }

    setResults(uniqueIps.map((ip, i) => ({ id: i + 1, ip, dnsbl: 'bl.spamcop.net', status: 'pending', returnCode: '—', meaning: 'Waiting...', ttl: 0 })));
    setIsProcessing(true);

    for (let i = 0; i < uniqueIps.length; i++) {
      const ip = uniqueIps[i];
      setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'loading' } : r));
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(ip)) {
        setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'invalid', meaning: 'Invalid Format' } : r));
        continue;
      }
      try {
        const reversed = ip.split('.').reverse().join('.');
        const res = await fetch(`https://dns.google/resolve?name=${reversed}.bl.spamcop.net&type=A`);
        const data: DnsResponse = await res.json();
        if (data.Status === 0 && data.Answer) {
          setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'listed', returnCode: data.Answer![0].data, meaning: 'Listed (Spam Source)', ttl: data.Answer![0].TTL } : r));
        } else if (data.Status === 3) {
          setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'clean', returnCode: 'NX', meaning: 'Not Listed' } : r));
        } else {
          setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'error', meaning: 'Resolve Failure' } : r));
        }
      } catch (err) {
        setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'error', meaning: 'Connection Failure' } : r));
      }
    }
    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filteredResults = useMemo(() => results.filter(r => r.ip.includes(searchQuery) || r.meaning.toLowerCase().includes(searchQuery.toLowerCase())), [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-xl shadow-orange-600/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-orange-500">SpamCop Node</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">IPv4 Reputation Checker</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12} className="text-orange-500" /> IP Matrix</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="1.2.3.4" className={`w-full h-48 p-4 rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`} />
            <button onClick={handleProcess} disabled={isProcessing || !input.trim()} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Auditing...</> : <><Zap size={16} /> Run Checker</>}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-8 rounded-3xl shadow-xl border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input type="text" placeholder="Search audit node..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`} />
            </div>
            {results.length > 0 && <button onClick={() => setResults([])} className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 transition-all"><Trash2 size={18} /></button>}
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  <th className="px-6 py-4 w-12 text-center">ID</th>
                  <th className="px-6 py-4">IP Node</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Forensic Logic</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-500/5 transition-all">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className={`px-6 py-4 font-mono text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.ip}</td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{r.meaning}</td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-6 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">No Data Analyzed</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge = ({ status }: { status: SpamCopResult['status'] }) => {
  const styles = { listed: 'bg-rose-500/10 text-rose-500 border-rose-500/20', clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse', error: 'bg-slate-800 text-slate-500 border-slate-700', invalid: 'bg-rose-500/10 text-rose-500 border-rose-500/20', pending: 'bg-slate-950 text-slate-700 border-slate-900' };
  const labels = { listed: 'LISTED', clean: 'CLEAN', loading: 'WAIT', error: 'ERR', invalid: 'INV', pending: '...' };
  return <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${styles[status]}`}>{labels[status]}</span>;
};

export default SpamCopTool;