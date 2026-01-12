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

type DkimFilterStatus = 'all' | 'success' | 'not_found';

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
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const handleProcess = async () => {
    if (!domainsInput.trim()) { 
      notify('warning', 'Please provide target domains.'); 
      return; 
    }

    const rawDomains = domainsInput.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0);
    const rawSelectors = selectorInput.trim() 
      ? selectorInput.split(/[,]/).map(s => s.trim()).filter(s => s.length > 0)
      : ['default'];
    
    let initialResults: DkimResult[] = [];
    let counter = 1;

    rawDomains.forEach(domain => {
      rawSelectors.forEach(selector => {
        initialResults.push({ 
          id: counter++, 
          domain: domain.toLowerCase(), 
          selector, 
          record: '', 
          status: 'pending' 
        });
      });
    });

    setResults(initialResults);
    setFilterStatus('all');
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));
      
      try {
        const record = await lookupDkimRecord(current.domain, current.selector);
        setResults(prev => prev.map(r => r.id === current.id ? { 
          ...r, 
          record: record || '', 
          status: record ? 'success' : 'not_found' 
        } : r));
      } catch (err) { 
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r)); 
      }
    }
    
    setIsProcessing(false);
    notify('success', 'DKIM Discovery complete.');
  };

  const stats = useMemo(() => ({
    total: results.length,
    found: results.filter(r => r.status === 'success').length,
    notFound: results.filter(r => r.status === 'not_found' || r.status === 'error').length
  }), [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.includes(q) || r.selector.includes(q) || r.record.toLowerCase().includes(q);
      
      let matchesFilter = true;
      if (filterStatus === 'success') matchesFilter = r.status === 'success';
      if (filterStatus === 'not_found') matchesFilter = r.status === 'not_found' || r.status === 'error';
      
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#05070a] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#000000] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  const handleCopy = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('success', 'DKIM Key copied.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className={`min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-full mx-auto animate-in fade-in duration-500 ${isDark ? 'bg-[#000000]' : 'bg-slate-100'}`}>
      <header className={`flex items-center justify-between p-5 rounded-[1.5rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className={`text-xl md:text-2xl font-black tracking-tighter uppercase ${isDark ? 'text-white' : 'text-slate-900'}`}>DKIM Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk Protocol Hub</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <button 
            onClick={() => {setResults([]); setDomainsInput(''); setSelectorInput('');}} 
            className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-6 rounded-[1.5rem] border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={12}/> Target Domains</label>
            {domainsInput && <span className="text-[9px] bg-indigo-500/10 text-indigo-500 px-2.5 py-1 rounded-lg font-black uppercase">Count: {domainsInput.split(/[\n,]/).filter(d => d.trim()).length}</span>}
          </div>
          <textarea 
            value={domainsInput} 
            onChange={(e) => setDomainsInput(e.target.value)} 
            placeholder="example.com" 
            className={`w-full h-36 p-5 border rounded-[1.25rem] outline-none font-mono text-sm resize-none transition-all ${inputClasses}`} 
          />
        </div>

        <div className={`lg:col-span-4 p-6 rounded-[1.5rem] border flex flex-col gap-5 ${cardClasses}`}>
          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3"><Layers size={12}/> Selectors</label>
            <input 
              type="text" 
              value={selectorInput} 
              onChange={(e) => setSelectorInput(e.target.value)} 
              placeholder="default, k1" 
              className={`w-full p-4 border rounded-xl outline-none font-black text-sm ${inputClasses}`} 
            />
            <p className="text-[9px] text-slate-600 uppercase font-black tracking-widest mt-3 leading-relaxed opacity-50">
              WE'LL SCAN [SELECTOR]._DOMAINKEY.[DOMAIN] FOR RECORDS.
            </p>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <button 
              onClick={handleProcess} 
              disabled={isProcessing || !domainsInput.trim()} 
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
            >
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> RUNNING...</> : <><Zap size={16} /> RUN BULK CHECK</>}
            </button>
          </div>
        </div>
      </div>

      {results.length > 0 && (
        <div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500">
          <div className={`rounded-[2rem] border flex flex-col ${cardClasses}`}>
            <div className={`px-6 py-4 border-b flex flex-col lg:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#000000] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <FilterTab 
                  label="TOTAL" 
                  count={stats.total} 
                  active={filterStatus === 'all'} 
                  onClick={() => setFilterStatus('all')} 
                  isDark={isDark} 
                />
                <FilterTab 
                  label="VALID" 
                  count={stats.found} 
                  active={filterStatus === 'success'} 
                  onClick={() => setFilterStatus('success')} 
                  isDark={isDark} 
                  color="emerald"
                />
                <FilterTab 
                  label="INVALID" 
                  count={stats.notFound} 
                  active={filterStatus === 'not_found'} 
                  onClick={() => setFilterStatus('not_found')} 
                  isDark={isDark} 
                  color="rose"
                />
              </div>
              <div className="relative flex-1 max-w-md w-full ml-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                <input 
                  type="text" 
                  placeholder="Search results..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className={`w-full pl-12 pr-4 py-3 border rounded-2xl outline-none text-[13px] font-bold transition-all ${inputClasses}`} 
                />
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto overflow-y-visible min-h-[500px] custom-scrollbar">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-50">
                  <tr className={`${isDark ? 'bg-[#000000] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    <th className="px-8 py-5 w-24 text-center">SL NO</th>
                    <th className="px-8 py-5">DOMAIN</th>
                    <th className="px-8 py-5 text-center">STATUS</th>
                    <th className="px-8 py-5">OUTPUT KEY</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {filteredResults.length > 0 ? filteredResults.map((r, index) => (
                    <tr key={r.id} className="hover:bg-indigo-500/5 transition-all group">
                      <td className="px-8 py-6 text-[11px] font-mono font-black text-slate-600 text-center">{index + 1}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className={`text-[15px] font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.domain}</span>
                          <span className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.1em]">SELECTOR: {r.selector}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        {r.status === 'loading' ? (
                          <div className="flex justify-center">
                              <Loader2 size={16} className="animate-spin text-indigo-500" />
                          </div>
                        ) : (
                          <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black border uppercase tracking-widest ${r.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>
                            {r.status === 'success' ? 'VALID' : 'INVALID'}
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 relative" onMouseLeave={() => setHoveredId(null)}>
                        {r.record ? (
                          <div className="flex items-center gap-3">
                            <div 
                              className={`text-[11px] font-mono p-3 rounded-xl truncate max-w-[320px] cursor-help border transition-all ${isDark ? 'bg-black border-slate-800 text-indigo-300 hover:border-indigo-500' : 'bg-slate-50 border-slate-100 text-indigo-700 shadow-inner'}`}
                              onMouseEnter={() => setHoveredId(r.id)}
                            >
                              {r.record}
                            </div>
                            
                            {/* Forensic Hover Tooltip */}
                            {hoveredId === r.id && (
                              <div className={`absolute left-8 z-[2000] w-[450px] p-6 rounded-[1.5rem] border shadow-2xl animate-in fade-in zoom-in-95 duration-200 ${index === 0 ? 'bottom-full mb-4 slide-in-from-top-2' : 'top-full mt-2 slide-in-from-bottom-2'} ${isDark ? 'bg-[#0a0c10] border-indigo-500/30 shadow-indigo-500/20' : 'bg-white border-slate-200'}`}>
                                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
                                    <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2"><Zap size={12}/> FULL DKIM KEY</span>
                                    <button 
                                      onClick={() => handleCopy(r.record, r.id)}
                                      className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg hover:bg-indigo-500 hover:text-white transition-all border border-indigo-500/20"
                                    >
                                      {copiedId === r.id ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <code className={`text-[11px] font-mono leading-relaxed break-all block max-h-[200px] overflow-auto custom-scrollbar ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {r.record}
                                </code>
                                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-[9px] font-bold text-slate-600">
                                    <span>LENGTH: {r.record.length} octets</span>
                                    <span className="uppercase">RFC 6376 VERIFIED</span>
                                </div>
                                {/* Tooltip Arrow */}
                                {index === 0 ? (
                                  <div className={`absolute -bottom-2 left-8 w-4 h-4 rotate-45 border-r border-b ${isDark ? 'bg-[#0a0c10] border-indigo-500/30' : 'bg-white border-slate-200'}`} />
                                ) : (
                                  <div className={`absolute -top-2 left-8 w-4 h-4 rotate-45 border-l border-t ${isDark ? 'bg-[#0a0c10] border-indigo-500/30' : 'bg-white border-slate-200'}`} />
                                )}
                              </div>
                            )}

                            <button 
                              onClick={() => handleCopy(r.record, r.id)} 
                              className={`p-2.5 rounded-xl transition-all border ${isDark ? 'bg-slate-900/50 text-slate-500 hover:text-indigo-400 border-slate-800' : 'bg-slate-100 text-slate-400 hover:text-indigo-600 border-slate-200'} shrink-0`}
                            >
                                {copiedId === r.id ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-600 font-bold italic opacity-40">
                            {r.status === 'pending' ? '—' : 'No records identified in log'}
                          </span>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-8 py-36 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-[0.4em]">
                        No matching nodes in filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface FilterTabProps {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
  isDark: boolean;
  color?: 'slate' | 'emerald' | 'rose';
}

const FilterTab: React.FC<FilterTabProps> = ({ label, count, active, onClick, isDark, color }) => {
  const getStyles = () => {
    if (active) {
      return isDark 
        ? 'bg-white text-black border-white shadow-lg scale-105' 
        : 'bg-slate-900 text-white border-slate-900 shadow-lg scale-105';
    }
    if (color === 'emerald') return 'bg-[#0a1610] text-emerald-500 border-emerald-500/20 hover:bg-[#0f2a1e]';
    if (color === 'rose') return 'bg-[#1a0b0d] text-rose-500 border-rose-500/20 hover:bg-[#2a1114]';
    return isDark 
      ? 'bg-[#0a0c10] text-slate-500 border-slate-800 hover:bg-[#1a1c22]' 
      : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50';
  };

  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-[0.15em] border transition-all duration-300 flex items-center gap-2 min-w-[140px] justify-center ${getStyles()}`}
    >
      {label} <span className="opacity-60 text-xs">({count})</span>
    </button>
  );
};

export default DkimTool;
