import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  ShieldCheck, 
  Loader2, 
  ArrowLeft, 
  Copy, 
  Check, 
  Globe, 
  Layers, 
  Zap
} from 'lucide-react';
import { DkimResult } from '../types';
import { lookupDkimRecord } from '../services/dnsService';
import { useNotify } from '../App';

interface DkimToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type DkimFilterStatus = 'all' | 'success' | 'not_found' | 'pending';

const DkimTool: React.FC<DkimToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [domainsInput, setDomainsInput] = useState('');
  const [selectorInput, setSelectorInput] = useState('');
  const [results, setResults] = useState<DkimResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DkimFilterStatus>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleProcess = async () => {
    if (!domainsInput.trim()) { notify('warning', 'Please provide target domains.'); return; }
    const rawDomains = domainsInput.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0);
    const rawSelectors = selectorInput.split(/[,]/).map(s => s.trim()).filter(s => s.length > 0);
    let initialResults: DkimResult[] = [];
    let counter = 1;
    const hasPairs = rawDomains.some(d => d.includes(':'));
    if (hasPairs) {
      rawDomains.forEach(line => {
        if (line.includes(':')) {
          const [domain, selector] = line.split(':').map(s => s.trim());
          if (domain && selector) initialResults.push({ id: counter++, domain: domain.toLowerCase(), selector, record: '', status: 'pending' });
        } else {
          const defaultSelector = rawSelectors[0] || 'default';
          initialResults.push({ id: counter++, domain: line.toLowerCase(), selector: defaultSelector, record: '', status: 'pending' });
        }
      });
    } else {
      const selectors = rawSelectors.length > 0 ? rawSelectors : ['default'];
      rawDomains.forEach(domain => {
        selectors.forEach(selector => {
          initialResults.push({ id: counter++, domain: domain.toLowerCase(), selector: selector, record: '', status: 'pending' });
        });
      });
    }
    setResults(initialResults);
    setFilterStatus('all');
    setIsProcessing(true);
    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));
      try {
        const record = await lookupDkimRecord(current.domain, current.selector);
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, record: record || '', status: record ? 'success' : 'not_found' } : r));
      } catch (err) { setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r)); }
    }
    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filteredResults = useMemo(() => results.filter(r => (r.domain.toLowerCase().includes(searchQuery.toLowerCase()) || r.selector.toLowerCase().includes(searchQuery.toLowerCase()) || r.record.toLowerCase().includes(searchQuery.toLowerCase())) && (filterStatus === 'all' || r.status === filterStatus)), [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-indigo-500">DKIM Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Multi-Selector Key Discovery</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => {setResults([]); setDomainsInput(''); setSelectorInput('');}} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="flex flex-col gap-6">
        <div className={`p-8 rounded-[2rem] border flex flex-col gap-6 ${cardClasses}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Globe size={12}/> Domain Node List</label>
               <textarea value={domainsInput} onChange={(e) => setDomainsInput(e.target.value)} placeholder="example.com&#10;domain:s1" className={`w-full h-32 p-4 border rounded-2xl outline-none font-mono text-sm resize-none transition-all ${inputClasses}`} />
            </div>
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Layers size={12}/> Global Selectors (CSV)</label>
               <input type="text" value={selectorInput} onChange={(e) => setSelectorInput(e.target.value)} placeholder="default, s1, google" className={`w-full p-4 border rounded-2xl outline-none font-bold text-sm ${inputClasses}`} />
               <p className="text-[9px] text-slate-500 mt-4 uppercase font-black tracking-tighter opacity-50">Discovery engine will attempt recursive lookups for all selectors provided.</p>
            </div>
          </div>
          <button onClick={handleProcess} disabled={isProcessing || !domainsInput.trim()} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
            {isProcessing ? <><Loader2 size={18} className="animate-spin" /> DISCOVERING KEYS...</> : <><Zap size={18} /> RUN KEY AUDIT</>}
          </button>
        </div>

        <div className={`rounded-[2rem] border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-6 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Nodes ({results.length})</button>
              <button onClick={() => setFilterStatus('success')} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === 'success' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Valid Keys</button>
            </div>
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input type="text" placeholder="Search result matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-sm font-bold transition-all ${inputClasses}`} />
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-600`}>
                  <th className="px-8 py-5 w-16 text-center">ID</th>
                  <th className="px-8 py-5">Node Context</th>
                  <th className="px-8 py-5 text-center">Protocol Status</th>
                  <th className="px-8 py-5">Forensic Key Output</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-all group">
                    <td className="px-8 py-6 text-sm font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className="px-8 py-6">
                       <div className="flex flex-col">
                          <span className={`text-lg font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.domain}</span>
                          <span className="text-[10px] text-indigo-500 font-black uppercase tracking-widest mt-0.5">SELECTOR: {r.selector}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${r.status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>{r.status === 'loading' ? 'WAIT' : r.status === 'success' ? 'VALID' : 'MISSING'}</span>
                    </td>
                    <td className="px-8 py-6">
                       {r.record ? (
                         <div className="flex items-center gap-3 max-w-lg">
                           <code className={`text-sm font-mono p-4 rounded-xl truncate flex-1 border leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-indigo-400 shadow-inner' : 'bg-slate-100 border-slate-100 text-indigo-700 shadow-inner'}`}>
                             {r.record}
                           </code>
                           <button onClick={() => { navigator.clipboard.writeText(r.record); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); }} className="p-3 bg-slate-900/50 rounded-xl hover:text-indigo-400 transition-all border border-slate-800">
                              {copiedId === r.id ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                           </button>
                         </div>
                       ) : <span className="text-sm text-slate-700 italic opacity-40 font-bold">—</span>}
                    </td>
                  </tr>
                )) : <tr><td colSpan={4} className="px-8 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">Matrix Idle - Input Target Domains</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DkimTool;