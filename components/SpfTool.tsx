import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Globe, 
  Loader2, 
  ArrowLeft, 
  Zap 
} from 'lucide-react';
import { SpfResult } from '../types';
import { lookupSpfRecord } from '../services/dnsService';

interface SpfToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'valid' | 'missing' | 'warning' | 'invalid' | 'error';

const SpfTool: React.FC<SpfToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<SpfResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const parseSpf = (record: string | null): Partial<SpfResult> => {
    if (!record) return { status: 'missing', lookupCount: 0, mechanism: '' };
    const rec = record.trim().toLowerCase();
    if (!rec.startsWith('v=spf1')) return { status: 'invalid', record, lookupCount: 0, mechanism: '' };
    const lookups = (record.match(/include:|a:|a |mx:|mx |ptr|exists:/gi) || []).length;
    const parts = record.split(/\s+/);
    const mechanism = parts.find(p => p.endsWith('all')) || '';
    let status: SpfResult['status'] = 'valid';
    if (lookups > 10) status = 'warning';
    return { status, record, lookupCount: lookups, mechanism };
  };

  const handleProcess = async () => {
    if (!domainsInput.trim()) return;
    
    const domainList: string[] = Array.from(new Set<string>(
      domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    ));
    
    const initialResults: SpfResult[] = domainList.map((domain, index) => ({
      id: index + 1, domain, record: '', status: 'pending', lookupCount: 0, mechanism: ''
    }));
    setResults(initialResults);
    setFilterStatus('all');
    setIsProcessing(true);
    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));
      try {
        const record = await lookupSpfRecord(current.domain);
        const parsed = parseSpf(record);
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, ...parsed } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    setIsProcessing(false);
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.includes(q) || r.record.includes(q);
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      processed: results.filter(r => !['pending', 'loading'].includes(r.status)).length
    };
  }, [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-amber-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-amber-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg">
              <Globe size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-amber-500">SPF Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Recursive Logic Matrix</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => {setResults([]); setDomainsInput('');}} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Target Domains Matrix</label>
            <textarea
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="example.com&#10;gmail.com"
              className={`w-full h-56 p-4 rounded-xl outline-none transition-all font-mono text-xs resize-none ${inputClasses}`}
            />
            <button
              onClick={handleProcess}
              disabled={isProcessing || !domainsInput.trim()}
              className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Auditing...</> : <><Zap size={16} /> Run Logic Audit</>}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-8 rounded-[2rem] border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Total ({stats.total})</button>
              <button onClick={() => setFilterStatus('valid')} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${filterStatus === 'valid' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>Valid ({stats.valid})</button>
            </div>
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Filter results matrix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-600`}>
                  <th className="px-6 py-4 w-12 text-center">ID</th>
                  <th className="px-6 py-4">Domain</th>
                  <th className="px-6 py-4 text-center">Lookups</th>
                  <th className="px-6 py-4">SPF Record Output</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((result, index) => (
                  <tr key={result.id} className="hover:bg-amber-500/5 transition-all group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.domain}</span>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${result.status === 'valid' ? 'text-emerald-500' : 'text-rose-500'}`}>{result.status}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black ${result.lookupCount > 10 ? 'text-rose-500' : 'text-slate-500'}`}>{result.lookupCount} <span className="opacity-40">/ 10</span></span>
                    </td>
                    <td className="px-6 py-4">
                      {result.record ? (
                        <code className={`block text-[10px] font-mono p-2.5 rounded-xl border truncate max-w-sm ${isDark ? 'bg-slate-950 border-slate-800 text-amber-400' : 'bg-slate-50 border-slate-100 text-amber-700'}`}>
                          {result.record}
                        </code>
                      ) : <span className="text-[10px] text-slate-600 font-bold italic tracking-wide opacity-40">Empty response</span>}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">No Data Analyzed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpfTool;