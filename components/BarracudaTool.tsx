
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Zap, 
  Loader2, 
  Database,
  Terminal,
  Activity
} from 'lucide-react';
import { BarracudaResult, DnsResponse } from '../types';
import { useNotify } from '../App';

const BarracudaTool: React.FC<{ onBack: () => void; theme: 'dark' | 'light' }> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [input, setInput] = useState('');
  const [results, setResults] = useState<BarracudaResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAudit = async () => {
    const rawItems = input.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    // Explicitly type uniqueItems as string[] and add cast to avoid unknown type issues in loop
    // Added 'as string[]' to resolve the 'unknown[]' assignment error
    const uniqueItems: string[] = Array.from(new Set(rawItems)).slice(0, 100) as string[];
    if (uniqueItems.length === 0) { notify('warning', 'Input required.'); return; }
    setResults(uniqueItems.map((item, i) => ({ id: i + 1, input: item, type: /^(\d{1,3}\.){3}\d{1,3}$/.test(item) ? 'ip' : 'domain', status: 'pending', message: 'Waiting...', categories: [] })));
    setIsProcessing(true);
    for (let i = 0; i < uniqueItems.length; i++) {
      const item = uniqueItems[i];
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(item);
      setResults(prev => prev.map(r => r.input === item ? { ...r, status: 'loading' } : r));
      try {
        const query = isIp ? `${item.split('.').reverse().join('.')}.b.barracudacentral.org` : `${item}.dbl.barracudacentral.org`;
        const res = await fetch(`https://dns.google/resolve?name=${query}&type=A`);
        const data: DnsResponse = await res.json();
        const listed = data.Status === 0 && !!data.Answer;
        setResults(prev => prev.map(r => r.input === item ? { ...r, status: listed ? 'listed' : 'clean', message: listed ? 'Node listed as poor reputation.' : 'Node is clean.', categories: listed ? [isIp ? 'brbl' : 'dbl'] : [] } : r));
      } catch (err) { setResults(prev => prev.map(r => r.input === item ? { ...r, status: 'error', message: 'Check failed.' } : r)); }
    }
    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filteredResults = useMemo(() => results.filter(r => r.input.toLowerCase().includes(searchQuery.toLowerCase()) || r.message.toLowerCase().includes(searchQuery.toLowerCase())), [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-600/20">
              <Database size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-blue-500">Barracuda Node</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">BRBL & IBL Status Check</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Terminal size={12} className="text-blue-500" /> Input Node List</label>
            <textarea value={input} onChange={(e) => setInput(e.target.value)} placeholder="8.8.8.8&#10;example.com" className={`w-full h-48 p-4 rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`} />
            <button onClick={handleAudit} disabled={isProcessing || !input.trim()} className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Auditing...</> : <><Zap size={16} /> Run Audit</>}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-8 rounded-3xl shadow-xl border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input type="text" placeholder="Search audit results..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`} />
            </div>
            {results.length > 0 && <button onClick={() => setResults([])} className="p-2 bg-rose-500/10 text-rose-400 rounded-xl border border-rose-500/20 transition-all"><Trash2 size={18} /></button>}
          </div>
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  <th className="px-6 py-4 w-12 text-center">ID</th>
                  <th className="px-6 py-4">Node Target</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Verdict</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-500/5 transition-all group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.input}</span>
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mt-0.5">{r.type} check</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500">{r.message}</td>
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

const StatusBadge = ({ status }: { status: BarracudaResult['status'] }) => {
  const styles = { listed: 'bg-rose-500/10 text-rose-500 border-rose-500/20', clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse', error: 'bg-slate-800 text-slate-500 border-slate-700', pending: 'bg-slate-950 text-slate-700 border-slate-900' };
  const labels = { listed: 'LISTED', clean: 'CLEAN', loading: 'WAIT', error: 'ERR', pending: '...' };
  return <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${styles[status]}`}>{labels[status]}</span>;
};

export default BarracudaTool;
