import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  BarChart3, 
  Loader2,
  ArrowLeft,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { DmarcResult } from '../types';
import { lookupDmarcRecord } from '../services/dnsService';
import { useNotify } from '../App';

interface DmarcToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'valid' | 'missing' | 'invalid' | 'error';

const DmarcTool: React.FC<DmarcToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<DmarcResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const parseDmarcRecord = (record: string | null): Partial<DmarcResult> => {
    if (!record) return { status: 'missing', record: '' };
    
    const rec = record.trim();
    // Case-insensitive check for v=DMARC1
    if (!/^v=DMARC1/i.test(rec)) {
      return { status: 'invalid', record: rec };
    }

    // Extract policy
    const pMatch = rec.match(/p=([^;]+)/i);
    // Extract adkim
    const adkimMatch = rec.match(/adkim=([^;]+)/i);
    // Extract aspf
    const aspfMatch = rec.match(/aspf=([^;]+)/i);

    return {
      status: 'valid',
      record: rec,
      policy: pMatch ? pMatch[1].trim().toLowerCase() : 'none',
      adkim: adkimMatch ? adkimMatch[1].trim().toLowerCase() : 'r',
      aspf: aspfMatch ? aspfMatch[1].trim().toLowerCase() : 'r'
    };
  };

  const handleProcess = async () => {
    if (!domainsInput.trim()) {
      notify('warning', 'Please provide domains to audit.');
      return;
    }

    const domainList: string[] = Array.from(new Set<string>(
      domainsInput
        .split(/[\n,]/)
        .map(d => d.trim().toLowerCase())
        .filter(d => d.length > 0)
    ));

    const initialResults: DmarcResult[] = domainList.map((domain, index) => ({
      id: index + 1,
      domain,
      record: '',
      status: 'pending'
    }));

    setResults(initialResults);
    setFilterStatus('all');
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));

      try {
        const record = await lookupDmarcRecord(current.domain);
        const parsed = parseDmarcRecord(record);
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, ...parsed } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    
    setIsProcessing(false);
    notify('success', 'DMARC Matrix audit finalized.');
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (r.record && r.record.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      missing: results.filter(r => r.status === 'missing').length,
      invalid: results.filter(r => r.status === 'invalid').length
    };
  }, [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-600';

  const getRowHighlightClass = (status: DmarcResult['status']) => {
    if (status === 'valid') return isDark ? 'bg-emerald-500/5 hover:bg-emerald-500/10' : 'bg-emerald-50 hover:bg-emerald-100/50';
    if (status === 'missing') return isDark ? 'bg-rose-500/5 hover:bg-rose-500/10' : 'bg-rose-50 hover:bg-rose-100/50';
    if (status === 'invalid') return isDark ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-amber-50 hover:bg-amber-100/50';
    return 'hover:bg-slate-500/5';
  };

  const getStatusBadge = (status: DmarcResult['status']) => {
    const commonClasses = "px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border";
    switch (status) {
      case 'valid': return <span className={`${commonClasses} bg-emerald-500/10 text-emerald-500 border-emerald-500/20`}>VALID</span>;
      case 'missing': return <span className={`${commonClasses} bg-rose-500/10 text-rose-500 border-rose-500/20`}>MISSING</span>;
      case 'invalid': return <span className={`${commonClasses} bg-amber-500/10 text-amber-500 border-amber-500/20`}>INVALID</span>;
      case 'loading': return <span className={`${commonClasses} bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse`}>WAIT</span>;
      case 'error': return <span className={`${commonClasses} bg-rose-500/10 text-rose-500 border-rose-500/20`}>ERROR</span>;
      default: return <span className={`${commonClasses} bg-slate-800 text-slate-500 border-slate-700`}>QUEUED</span>;
    }
  };

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-full mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2.5 rounded-2xl text-white shadow-xl">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-sky-500">DMARC Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Global Policy Audit Matrix</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => {setResults([]); setDomainsInput('');}} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Shortened Width Domain Input Column (3/12) */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileText size={12}/> Target Matrix</label>
            <textarea
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="google.com&#10;apple.com"
              className={`w-full h-80 p-4 rounded-xl outline-none transition-all font-mono text-xs resize-none leading-relaxed ${inputClasses}`}
            />
            <button
              onClick={handleProcess}
              disabled={isProcessing || !domainsInput.trim()}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={16} /> AUDITING...</> : <><Zap size={16} /> CHECK DMARC</>}
            </button>
          </div>
        </div>

        {/* Expanded Width Table Column (9/12) to avoid horizontal scroll */}
        <div className={`lg:col-span-9 rounded-[2.5rem] border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2 shrink-0">
              <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="TOTAL" count={stats.total} isDark={isDark} />
              <FilterTab active={filterStatus === 'valid'} onClick={() => setFilterStatus('valid')} label="VALID" count={stats.valid} isDark={isDark} color="emerald" />
              <FilterTab active={filterStatus === 'invalid'} onClick={() => setFilterStatus('invalid')} label="INVALID" count={stats.invalid} isDark={isDark} color="amber" />
              <FilterTab active={filterStatus === 'missing'} onClick={() => setFilterStatus('missing')} label="MISSING" count={stats.missing} isDark={isDark} color="rose" />
            </div>
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search policy results..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-x-auto no-scrollbar custom-scrollbar min-h-[400px]">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-600`}>
                  <th className="px-4 py-4 w-12 text-center">SL</th>
                  <th className="px-6 py-4 min-w-[120px]">Domain</th>
                  <th className="px-6 py-4">DMARC Record Output</th>
                  <th className="px-4 py-4 text-center w-24">Status</th>
                  <th className="px-4 py-4 text-center w-20">Policy</th>
                  <th className="px-4 py-4 text-center w-24">Alignment</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r, index) => (
                  <tr key={r.id} className={`transition-colors group ${getRowHighlightClass(r.status)}`}>
                    <td className="px-4 py-5 text-[10px] font-mono font-bold text-slate-600 text-center">{index + 1}</td>
                    <td className="px-6 py-5">
                      <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.domain}</span>
                    </td>
                    <td className="px-6 py-5">
                      {r.record ? (
                        <code className={`block text-[10px] font-mono p-2 rounded-xl border truncate max-w-[300px] xl:max-w-md ${isDark ? 'bg-slate-950 border-slate-800 text-sky-400 shadow-inner' : 'bg-white border-slate-100 text-sky-700 shadow-sm'}`}>
                          {r.record}
                        </code>
                      ) : <span className="text-[10px] text-slate-700 font-bold italic opacity-40">Not Found</span>}
                    </td>
                    <td className="px-4 py-5 text-center">
                       {getStatusBadge(r.status)}
                    </td>
                    <td className="px-4 py-5 text-center">
                       <span className={`text-[10px] font-black uppercase ${r.status === 'valid' ? 'text-sky-400' : 'text-slate-500'}`}>{r.policy || '—'}</span>
                    </td>
                    <td className="px-4 py-5 text-center">
                       <div className="flex flex-col gap-0.5">
                          <span className="text-[8px] font-black text-slate-500 uppercase whitespace-nowrap">dkim: {r.adkim || '—'}</span>
                          <span className="text-[8px] font-black text-slate-500 uppercase whitespace-nowrap">spf: {r.aspf || '—'}</span>
                       </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-[0.3em]">No Data Matrix Analyzed</td>
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

const FilterTab: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; color?: string; isDark: boolean }> = ({ active, onClick, label, count, color, isDark }) => {
  const getColors = () => {
    if (active) {
      if (color === 'emerald') return 'bg-emerald-600 text-white border-emerald-500';
      if (color === 'rose') return 'bg-rose-600 text-white border-rose-500';
      if (color === 'amber') return 'bg-amber-600 text-white border-amber-500';
      return isDark ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 text-white border-slate-900';
    }
    return isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300' : 'bg-white border-slate-100 text-slate-500 hover:text-slate-700';
  };

  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getColors()}`}>
      {label} <span className="opacity-50">{count}</span>
    </button>
  );
};

export default DmarcTool;