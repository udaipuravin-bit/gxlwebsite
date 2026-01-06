
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  ShieldCheck, 
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Globe,
  Layers,
  Activity,
  Info,
  Settings2,
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
    if (!domainsInput.trim()) {
      notify('warning', 'Please provide target domains.');
      return;
    }

    const rawDomains = domainsInput.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0);
    const rawSelectors = selectorInput.split(/[,]/).map(s => s.trim()).filter(s => s.length > 0);

    let initialResults: DkimResult[] = [];
    let counter = 1;

    // Detect if user is providing pairs (domain:selector)
    const hasPairs = rawDomains.some(d => d.includes(':'));

    if (hasPairs) {
      notify('info', 'Pair Mode detected (domain:selector).');
      rawDomains.forEach(line => {
        if (line.includes(':')) {
          const [domain, selector] = line.split(':').map(s => s.trim());
          if (domain && selector) {
            initialResults.push({ id: counter++, domain: domain.toLowerCase(), selector, record: '', status: 'pending' });
          }
        } else {
          // If a line doesn't have a colon, use the first selector from the selector input if available
          const defaultSelector = rawSelectors[0] || 'default';
          initialResults.push({ id: counter++, domain: line.toLowerCase(), selector: defaultSelector, record: '', status: 'pending' });
        }
      });
    } else {
      // Matrix Mode: All domains x All selectors
      const selectors = rawSelectors.length > 0 ? rawSelectors : ['default'];
      rawDomains.forEach(domain => {
        selectors.forEach(selector => {
          initialResults.push({ id: counter++, domain: domain.toLowerCase(), selector, record: '', status: 'pending' });
        });
      });
      notify('info', `Matrix Mode: Checking ${rawDomains.length} domains against ${selectors.length} selectors.`);
    }

    if (initialResults.length === 0) {
      notify('error', 'No valid domain/selector combinations found.');
      return;
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
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    
    setIsProcessing(false);
    const validCount = initialResults.filter(r => r.status === 'success').length;
    notify(validCount > 0 ? 'success' : 'info', `Audit finished. ${validCount} valid records found.`);
  };

  const stats = useMemo(() => {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'success').length,
      invalid: results.filter(r => r.status === 'not_found' || r.status === 'error').length,
      progress: results.length > 0 ? Math.round((results.filter(r => r.status !== 'pending' && r.status !== 'loading').length / results.length) * 100) : 0
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.toLowerCase().includes(q) || r.selector.toLowerCase().includes(q) || r.record.toLowerCase().includes(q);
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl shadow-indigo-600/20">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Bulk DKIM Intelligence</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Multi-Selector Matrix Engine</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Progress</span>
               <span className="text-xs font-black text-indigo-500">{stats.progress}%</span>
            </div>
            <button onClick={() => { setResults([]); notify('info', 'Matrix cleared.'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-sm font-bold transition-all border border-rose-500/20">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Globe size={12} className="text-indigo-400" /> Target Domains
            </label>
            <span className="text-[9px] font-bold text-slate-500 italic">Supports "domain.com:selector" for specific matching</span>
          </div>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="example.com&#10;google.com&#10;microsoft.com:s1"
            className={`w-full h-48 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
        </div>

        <div className={`lg:col-span-4 p-6 rounded-3xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers size={12} className="text-indigo-400" /> Selectors (Comma Separated)
            </label>
            <input
              type="text"
              value={selectorInput}
              onChange={(e) => setSelectorInput(e.target.value)}
              placeholder="default,s1,s2"
              className={`w-full p-4 border rounded-2xl outline-none font-mono text-xs transition-all ${inputClasses}`}
            />
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput.trim()}
            className="w-full mt-4 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Auditing Matrix...</> : <><Zap size={16} /> Run Matrix Check</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-5 border-b flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="TOTAL" count={stats.total} isDark={isDark} />
              <FilterTab active={filterStatus === 'success'} onClick={() => setFilterStatus('success')} label="VALID" count={stats.valid} color="emerald" isDark={isDark} />
              <FilterTab active={filterStatus === 'not_found'} onClick={() => setFilterStatus('not_found')} label="INVALID" count={stats.invalid} color="rose" isDark={isDark} />
            </div>
            
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search domain or record content..."
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
                  <th className="px-6 py-4">TARGET CONFIG</th>
                  <th className="px-6 py-4 text-center">AUDIT STATUS</th>
                  <th className="px-6 py-4">DKIM RECORD OUTPUT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.domain}</span>
                         <span className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-0.5">SEL: {r.selector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                       {r.record ? (
                         <div className="flex items-center gap-2 max-w-lg">
                           <code className={`text-[10px] font-mono p-2.5 rounded-xl truncate flex-1 border ${isDark ? 'bg-slate-950 border-[#1e293b] text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-700'}`}>
                             {r.record}
                           </code>
                           <button 
                             onClick={() => { navigator.clipboard.writeText(r.record); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); notify('success', 'Record copied.'); }}
                             className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white border border-slate-100 text-slate-400 hover:text-indigo-600'}`}
                           >
                             {copiedId === r.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                           </button>
                         </div>
                       ) : <span className="text-[10px] text-slate-600 font-bold italic tracking-wide opacity-50">Empty response</span>}
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-30">
                          <Activity size={40} />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No matches found in matrix</p>
                       </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const FilterTab: React.FC<{ active: boolean; onClick: () => void; label: string; count: number; color?: string; isDark: boolean }> = ({ active, onClick, label, count, color, isDark }) => {
  const getColors = () => {
    if (active) {
      if (color === 'emerald') return 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20';
      if (color === 'rose') return 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20';
      return isDark ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-white border-slate-900 shadow-lg';
    }
    return isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600';
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all min-w-[100px] flex items-center justify-between gap-3 ${getColors()}`}>
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
};

const StatusBadge: React.FC<{ status: DkimResult['status'] }> = ({ status }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    not_found: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-800 text-slate-600 border-slate-700'
  };
  const labels = {
    success: 'VALID',
    loading: 'AUDITING',
    not_found: 'INVALID',
    error: 'ERROR',
    pending: 'QUEUED'
  };
  return (
    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default DkimTool;
