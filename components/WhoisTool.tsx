import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Calendar, 
  ArrowLeft,
  Loader2,
  Zap,
  Clock
} from 'lucide-react';
import { WhoisResult } from '../types';
import { lookupWhoisData } from '../services/dnsService';
import { useNotify } from '../App';

interface WhoisToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'expiring' | 'safe' | 'error';

const WhoisTool: React.FC<WhoisToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<WhoisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const handleLookup = async () => {
    const domainList: string[] = Array.from(new Set(domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0)));
    if (domainList.length === 0) {
      notify('warning', 'Please provide a domain matrix.');
      return;
    }
    
    const initialResults: WhoisResult[] = domainList.map((domain, index) => ({ 
      id: index + 1, 
      domain, 
      registrar: '', 
      createdDate: '', 
      expiryDate: '', 
      daysRemaining: 0, 
      status: [] as string[], 
      loadingStatus: 'pending' 
    }));

    setResults(initialResults);
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const item = initialResults[i];
      setResults(prev => prev.map(r => r.id === item.id ? { ...r, loadingStatus: 'loading' } : r));
      try {
        const data = await lookupWhoisData(item.domain);
        setResults(prev => prev.map(r => r.id === item.id ? { 
          ...r, 
          ...(data || {}), 
          loadingStatus: data ? 'success' : 'not_found' 
        } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === item.id ? { ...r, loadingStatus: 'error' } : r));
      }
    }
    setIsProcessing(false);
    notify('success', 'Domain audit matrix updated.');
  };

  const filteredResults = useMemo(() => results.filter(r => 
    (r.domain.includes(searchQuery.toLowerCase()) || r.registrar.toLowerCase().includes(searchQuery.toLowerCase())) && 
    (filterStatus === 'all' || (filterStatus === 'expiring' ? r.daysRemaining < 30 : r.daysRemaining >= 30))
  ), [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-lime-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-lime-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-6">
          <button onClick={onBack} className={`p-2.5 rounded-2xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="bg-lime-500 p-2.5 rounded-2xl text-white shadow-xl shadow-lime-500/20">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase text-lime-500">Expiry Date Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Domain Lifecycle Node</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => setResults([])} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Domains Matrix</label>
            <textarea 
              value={domainsInput} 
              onChange={(e) => setDomainsInput(e.target.value)} 
              placeholder="google.com" 
              className={`w-full h-56 p-4 rounded-[1.5rem] border outline-none font-mono text-sm resize-none transition-all ${inputClasses}`} 
            />
            <button 
              onClick={handleLookup} 
              disabled={isProcessing || !domainsInput.trim()} 
              className="w-full py-4 bg-lime-600 hover:bg-lime-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Auditing...</> : <><Zap size={16} /> Run Checker</>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col animate-in slide-in-from-right-4 duration-500">
          <div className={`rounded-[2rem] shadow-xl border overflow-hidden flex flex-col ${cardClasses}`}>
            <div className={`p-5 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex gap-2">
                <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="All" isDark={isDark} />
                <FilterTab active={filterStatus === 'expiring'} onClick={() => setFilterStatus('expiring')} label="Expiring" isDark={isDark} color="rose" />
              </div>
              <div className="relative flex-1 max-w-md w-full ml-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                <input type="text" placeholder="Filter result matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`} />
              </div>
            </div>
            <div className="flex-1 overflow-x-auto min-h-[400px]">
              <table className="w-full text-left">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    <th className="px-8 py-5">Domain</th>
                    <th className="px-8 py-5">Registrar</th>
                    <th className="px-8 py-5">Expiry Date</th>
                    <th className="px-8 py-5 text-center">Remaining</th>
                    <th className="px-8 py-5 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {filteredResults.length > 0 ? filteredResults.map((res) => (
                    <tr key={res.id} className="hover:bg-lime-500/5 transition-all group">
                      <td className="px-8 py-5">
                         <div className="flex flex-col">
                            <span className={`text-xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{res.domain}</span>
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">Node Verified</span>
                         </div>
                      </td>
                      <td className="px-8 py-5 text-sm text-slate-500 font-bold">{res.registrar || '—'}</td>
                      <td className="px-8 py-5">
                        <span className={`text-[13px] font-mono font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {res.expiryDate ? new Date(res.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—'}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`text-sm font-black uppercase tracking-tight ${res.daysRemaining < 0 ? 'text-rose-500' : res.daysRemaining < 30 ? 'text-amber-500' : 'text-emerald-500'}`}>
                          {res.daysRemaining} <span className="text-[10px] opacity-40">DAYS</span>
                        </span>
                      </td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${res.loadingStatus === 'loading' ? 'bg-blue-500/10 text-blue-400' : res.daysRemaining < 0 ? 'bg-rose-600 text-white border-rose-500' : res.daysRemaining < 30 ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'}`}>
                           {res.loadingStatus === 'loading' ? 'WAIT' : (res.daysRemaining < 0 ? 'EXPIRED' : res.daysRemaining < 30 ? 'CRITICAL' : 'SAFE')}
                        </span>
                      </td>
                    </tr>
                  )) : <tr><td colSpan={5} className="py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">No Data Analyzed</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean; onClick: () => void; label: string; color?: string; isDark: boolean }> = ({ active, onClick, label, color, isDark }) => (
  <button onClick={onClick} className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${active ? (color === 'rose' ? 'bg-rose-600 text-white border-rose-500' : 'bg-white text-black border-white') : 'text-slate-500 border-slate-800'}`}>
    {label}
  </button>
);

export default WhoisTool;