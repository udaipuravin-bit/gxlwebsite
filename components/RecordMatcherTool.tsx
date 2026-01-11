import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Globe, 
  Layers, 
  Zap, 
  Search, 
  Copy, 
  Check, 
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Download
} from 'lucide-react';
import { RecordMatchResult } from '../types';
import { lookupRecordByType } from '../services/dnsService';
import { useNotify } from '../App';

interface RecordMatcherToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const RecordMatcherTool: React.FC<RecordMatcherToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [domainsInput, setDomainsInput] = useState('');
  const [selector, setSelector] = useState('');
  const [matchValue, setMatchValue] = useState('');
  const [results, setResults] = useState<RecordMatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'match' | 'mismatch' | 'missing'>('all');

  const handleAudit = async () => {
    const domainList = domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
    if (domainList.length === 0) {
      notify('warning', 'Please provide a list of domains.');
      return;
    }

    const initial: RecordMatchResult[] = domainList.map((d, i) => ({
      id: i + 1,
      domain: d,
      hostname: selector ? `${selector}.${d}` : d,
      found: '',
      expected: matchValue,
      status: 'pending'
    }));

    setResults(initial);
    setIsProcessing(true);

    for (let i = 0; i < initial.length; i++) {
      const current = initial[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));

      try {
        const records = await lookupRecordByType(current.hostname, 'TXT');
        const found = records.map(r => r.value.replace(/"/g, '')).join(' ');
        
        let status: RecordMatchResult['status'] = 'missing';
        if (found) {
          status = found.includes(matchValue) ? 'match' : 'mismatch';
        }

        setResults(prev => prev.map(r => r.id === current.id ? { ...r, found, status } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }

    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filtered = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.includes(q) || r.found.toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || r.status === filter;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filter]);

  const stats = useMemo(() => ({
    total: results.length,
    match: results.filter(r => r.status === 'match').length,
    mismatch: results.filter(r => r.status === 'mismatch').length,
    missing: results.filter(r => r.status === 'missing').length
  }), [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl">
              <Layers size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-indigo-400">Record Matcher</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Precision Value Mapping Hub</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Globe size={12} className="text-indigo-400" /> Target Domains
          </label>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="google.com&#10;microsoft.com&#10;apple.com"
            className={`w-full h-56 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
        </div>

        <div className={`lg:col-span-4 p-6 rounded-3xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className="flex flex-col gap-5">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                 <Activity size={12} className="text-indigo-400" /> Hostname Prefix
              </label>
              <input 
                value={selector}
                onChange={(e) => setSelector(e.target.value)}
                placeholder="_dmarc or s1._domainkey"
                className={`w-full p-4 border rounded-2xl outline-none text-xs font-bold ${inputClasses}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                 <CheckCircle2 size={12} className="text-indigo-400" /> Expected Result
              </label>
              <input 
                value={matchValue}
                onChange={(e) => setMatchValue(e.target.value)}
                placeholder="e.g. v=DMARC1; p=reject"
                className={`w-full p-4 border rounded-2xl outline-none text-xs font-bold ${inputClasses}`}
              />
            </div>
          </div>
          <button
            onClick={handleAudit}
            disabled={isProcessing || !domainsInput.trim()}
            className="w-full mt-auto py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
          >
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Processing...</> : <><Zap size={16} /> Run Forensic Match</>}
          </button>
        </div>
      </div>

      <div className={`rounded-3xl shadow-2xl border overflow-hidden animate-in slide-in-from-bottom-4 duration-500 ${cardClasses}`}>
        <div className={`p-5 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex gap-2">
            <FilterBtn active={filter === 'all'} onClick={() => setFilter('all')} label="TOTAL" count={stats.total} isDark={isDark} />
            <FilterBtn active={filter === 'match'} onClick={() => setFilter('match')} label="MATCH" count={stats.match} color="emerald" isDark={isDark} />
          </div>
          <div className="relative flex-1 max-w-md w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
            <input
              type="text"
              placeholder="Filter results..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                <th className="px-6 py-4 w-16">ID</th>
                <th className="px-6 py-4">Domain</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Record Found</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
              {filtered.length > 0 ? filtered.map(r => (
                <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                  <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{r.id}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                       <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.domain}</span>
                       <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">{r.hostname}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                     <StatusBadge status={r.status} />
                  </td>
                  <td className="px-6 py-4">
                     <code className={`text-[10px] font-mono p-2.5 rounded-xl truncate block border ${isDark ? 'bg-slate-950 border-[#1e293b] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                        {r.found || 'NULL'}
                     </code>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-20 text-center text-slate-500 uppercase font-black text-xs tracking-widest opacity-30">No Data Analyzed</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const FilterBtn = ({ active, onClick, label, count, color, isDark }: any) => {
  const getStyles = () => {
    if (!active) return isDark ? 'bg-slate-900 text-slate-500 border-slate-800' : 'bg-white text-slate-400 border-slate-100';
    if (color === 'emerald') return 'bg-emerald-600 text-white border-emerald-500 shadow-lg';
    return isDark ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 text-white border-slate-900';
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center gap-3 ${getStyles()}`}>
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
};

const StatusBadge = ({ status }: any) => {
  const styles: any = {
    match: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    mismatch: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    missing: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-800 text-slate-600 border-slate-700'
  };
  const labels: any = {
    match: 'MATCH',
    mismatch: 'DIFF',
    loading: 'AUDIT',
    missing: 'MISSING',
    error: 'ERROR',
    pending: 'WAIT'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default RecordMatcherTool;