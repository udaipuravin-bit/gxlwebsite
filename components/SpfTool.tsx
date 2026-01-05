
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Download, 
  Globe, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  AlertTriangle
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
    const domainList = Array.from(new Set(
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

  const handleExport = () => {
    const csvContent = [['S.No', 'Domain', 'Status', 'Lookups', 'Mechanism', 'Record'], ...results.map(r => [r.id, r.domain, r.status, r.lookupCount, r.mechanism, r.record])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `spf_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 p-2.5 rounded-xl text-white shadow-lg">
              <Globe size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">SPF Validator</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">DNS Lookup & Logic Audit</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-2xl shadow-xl border ${cardClasses} space-y-4`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Domains List</label>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="example.com&#10;gmail.com"
            className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all font-mono text-xs resize-none ${inputClasses}`}
          />
        </div>

        <div className={`p-6 rounded-2xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className={`${isDark ? 'bg-[#05080f]' : 'bg-slate-50'} rounded-2xl p-6 border border-slate-800/50 text-center`}>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Processed</p>
             <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
               {stats.processed} <span className="text-slate-700">/</span> {stats.total}
             </div>
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput}
            className="w-full mt-6 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {isProcessing ? 'Validating Matrix...' : 'Run SPF Audit'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all min-w-[120px] ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                TOTAL ({stats.total})
              </button>
              <button onClick={() => setFilterStatus('valid')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all min-w-[120px] ${filterStatus === 'valid' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 border-emerald-500/20 text-emerald-500'}`}>
                VALID ({stats.valid})
              </button>
            </div>
            <div className="relative flex-1 max-w-md ml-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search matrix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.2em] text-slate-500`}>
                  <th className="px-6 py-4 w-20">SL NO</th>
                  <th className="px-6 py-4">DOMAIN</th>
                  <th className="px-6 py-4 text-center">LOOKUPS</th>
                  <th className="px-6 py-4">SPF RECORD</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((result, index) => (
                  <tr key={result.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.domain}</span>
                        <SpfStatusBadge status={result.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`text-xs font-black ${result.lookupCount > 10 ? 'text-rose-500' : 'text-slate-500'}`}>
                        {result.lookupCount} <span className="opacity-40">/ 10</span>
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {result.record ? (
                        <code className={`block text-[10px] font-mono p-2 rounded border truncate max-w-sm ${isDark ? 'bg-slate-950 border-slate-800 text-violet-400/80' : 'bg-slate-50 border-slate-200 text-violet-700'}`}>
                          {result.record}
                        </code>
                      ) : (
                        <span className="text-[10px] text-slate-600 italic">No record found</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const SpfStatusBadge: React.FC<{ status: SpfResult['status'] }> = ({ status }) => {
  const styles = {
    valid: 'text-emerald-500',
    warning: 'text-amber-500',
    loading: 'text-blue-400 animate-pulse',
    invalid: 'text-rose-500',
    missing: 'text-rose-500',
    error: 'text-rose-500',
    pending: 'text-slate-700'
  };
  return <span className={`text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

export default SpfTool;
