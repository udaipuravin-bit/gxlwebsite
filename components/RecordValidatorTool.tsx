
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  KeyRound, 
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  Globe,
  Layers,
  Activity,
  Zap,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
// Changed from RecordValidatorResult to RecordMatchResult as per types.ts
import { RecordMatchResult } from '../types';
import { lookupRecordByType } from '../services/dnsService';
import { useNotify } from '../App';

interface RecordValidatorToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'match' | 'mismatch' | 'missing';

const RecordValidatorTool: React.FC<RecordValidatorToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [domainsInput, setDomainsInput] = useState('');
  const [prefixInput, setPrefixInput] = useState('_dmarc');
  const [expectedValue, setExpectedValue] = useState('');
  const [isSecret, setIsSecret] = useState(false);
  // Using RecordMatchResult instead of non-existent RecordValidatorResult
  const [results, setResults] = useState<RecordMatchResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleProcess = async () => {
    if (!domainsInput.trim()) {
      notify('warning', 'Please provide target domains.');
      return;
    }
    if (!expectedValue.trim()) {
      notify('warning', 'Please provide an expected value to match.');
      return;
    }

    // Fix: Explicitly type domainList and use Set<string> to prevent 'unknown' type inference
    const domainList: string[] = Array.from(new Set<string>(
      domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    ));

    // Using RecordMatchResult
    const initialResults: RecordMatchResult[] = domainList.map((domain, index) => {
      const hostname = prefixInput.trim() ? `${prefixInput.trim()}.${domain}` : domain;
      return {
        id: index + 1,
        domain,
        hostname,
        expected: expectedValue.trim(),
        found: '',
        status: 'pending'
      };
    });

    setResults(initialResults);
    setFilterStatus('all');
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'loading' } : r));
      
      try {
        const records = await lookupRecordByType(current.hostname, 'TXT');
        const found = records.map(r => r.value.replace(/"/g, '')).join(' ');
        
        let status: RecordMatchResult['status'] = 'missing';
        if (found) {
          status = found.includes(current.expected) ? 'match' : 'mismatch';
        }

        setResults(prev => prev.map(r => r.id === current.id ? { ...r, found, status } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    
    setIsProcessing(false);
    const matchCount = initialResults.filter(r => r.status === 'match').length;
    notify(matchCount > 0 ? 'success' : 'info', `Audit finished. ${matchCount} matches found.`);
  };

  const stats = useMemo(() => {
    return {
      total: results.length,
      match: results.filter(r => r.status === 'match').length,
      mismatch: results.filter(r => r.status === 'mismatch').length,
      missing: results.filter(r => r.status === 'missing').length,
      progress: results.length > 0 ? Math.round((results.filter(r => !['pending', 'loading'].includes(r.status)).length / results.length) * 100) : 0
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.toLowerCase().includes(q) || r.found.toLowerCase().includes(q);
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-fuchsia-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-fuchsia-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-fuchsia-600 p-2.5 rounded-2xl text-white shadow-xl shadow-fuchsia-600/20">
              <KeyRound size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Bulk Record Matcher</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Fidelity DNS Verification Engine</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Audit Progress</span>
               <span className="text-xs font-black text-fuchsia-500">{stats.progress}%</span>
            </div>
            <button onClick={() => { setResults([]); notify('info', 'Matrix cleared.'); }} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl text-sm font-bold transition-all border border-rose-500/20">
              <Trash2 size={18} />
            </button>
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <Globe size={12} className="text-fuchsia-400" /> Target Domains
          </label>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="example.com&#10;google.com"
            className={`w-full h-48 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
        </div>

        <div className={`lg:col-span-4 p-6 rounded-3xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <Layers size={12} className="text-fuchsia-400" /> Hostname Prefix
              </label>
              <input
                type="text"
                value={prefixInput}
                onChange={(e) => setPrefixInput(e.target.value)}
                placeholder="_dmarc or s1._domainkey"
                className={`w-full p-4 border rounded-2xl outline-none font-mono text-xs transition-all ${inputClasses}`}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                <KeyRound size={12} className="text-fuchsia-400" /> Expected Value
              </label>
              <div className="relative">
                <input
                  type={isSecret ? "password" : "text"}
                  value={expectedValue}
                  onChange={(e) => setExpectedValue(e.target.value)}
                  placeholder="v=DMARC1; p=none..."
                  className={`w-full p-4 pr-12 border rounded-2xl outline-none font-mono text-xs transition-all ${inputClasses}`}
                />
                <button 
                  onClick={() => setIsSecret(!isSecret)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-fuchsia-500 transition-colors"
                >
                  {isSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput.trim() || !expectedValue.trim()}
            className="w-full mt-4 py-4 bg-fuchsia-600 hover:bg-fuchsia-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-fuchsia-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Matching Records...</> : <><Zap size={16} /> Run Matcher</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-5 border-b flex flex-col md:flex-row gap-4 items-center ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="TOTAL" count={stats.total} isDark={isDark} />
              <FilterTab active={filterStatus === 'match'} onClick={() => setFilterStatus('match')} label="MATCH" count={stats.match} color="emerald" isDark={isDark} />
              <FilterTab active={filterStatus === 'mismatch'} onClick={() => setFilterStatus('mismatch')} label="DIFF" count={stats.mismatch} color="amber" isDark={isDark} />
              <FilterTab active={filterStatus === 'missing'} onClick={() => setFilterStatus('missing')} label="MISSING" count={stats.missing} color="rose" isDark={isDark} />
            </div>
            
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search result matrix..."
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
                  <th className="px-6 py-4 text-center">MATCH STATUS</th>
                  <th className="px-6 py-4">DNS RECORD OUTPUT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-fuchsia-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.domain}</span>
                         <span className="text-[10px] text-fuchsia-400 font-black uppercase tracking-widest mt-0.5">{r.hostname}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                       {r.found ? (
                         <div className="flex items-center gap-2 max-w-lg">
                           <code className={`text-[10px] font-mono p-2.5 rounded-xl truncate flex-1 border ${isDark ? 'bg-slate-950 border-[#1e293b] text-fuchsia-400' : 'bg-slate-50 border-slate-200 text-fuchsia-700'}`}>
                             {r.found}
                           </code>
                           <button 
                             onClick={() => { navigator.clipboard.writeText(r.found); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); notify('success', 'Record copied.'); }}
                             className={`p-2 rounded-lg transition-all ${isDark ? 'bg-slate-800 text-slate-500 hover:text-white' : 'bg-white border border-slate-100 text-slate-400 hover:text-fuchsia-600'}`}
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
      if (color === 'amber') return 'bg-amber-600 text-white border-amber-500 shadow-lg shadow-amber-500/20';
      if (color === 'rose') return 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-500/20';
      return isDark ? 'bg-white text-slate-950 border-white shadow-lg' : 'bg-slate-900 text-white border-slate-900 shadow-lg';
    }
    return isDark ? 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600';
  };
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all min-w-[80px] flex items-center justify-between gap-3 ${getColors()}`}>
      {label} <span className="opacity-60">{count}</span>
    </button>
  );
};

const StatusBadge: React.FC<{ status: RecordMatchResult['status'] }> = ({ status }) => {
  const styles = {
    match: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    mismatch: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    missing: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-800 text-slate-600 border-slate-700'
  };
  const labels = {
    match: 'MATCH',
    mismatch: 'DIFF',
    loading: 'AUDITING',
    missing: 'MISSING',
    error: 'ERROR',
    pending: 'QUEUED'
  };
  const Icon = status === 'match' ? CheckCircle2 : status === 'missing' ? XCircle : AlertTriangle;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default RecordValidatorTool;
