
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Download, 
  BarChart3, 
  ExternalLink,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft
} from 'lucide-react';
import { DmarcResult } from '../types';
import { lookupDmarcRecord } from '../services/dnsService';

interface DmarcToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'valid' | 'missing' | 'invalid' | 'error';

const DmarcTool: React.FC<DmarcToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<DmarcResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const parseDmarc = (record: string | null): Partial<DmarcResult> => {
    if (!record) return { status: 'missing' };
    
    const rec = record.trim().toUpperCase();
    if (!rec.startsWith('V=DMARC1')) return { status: 'invalid', record };

    const parts = record.split(';').map(p => p.trim());
    const policy = parts.find(p => p.toLowerCase().startsWith('p='))?.split('=')[1];
    const adkim = parts.find(p => p.toLowerCase().startsWith('adkim='))?.split('=')[1];
    const aspf = parts.find(p => p.toLowerCase().startsWith('aspf='))?.split('=')[1];

    return {
      status: 'valid',
      record,
      policy: policy?.toLowerCase(),
      adkim: adkim?.toLowerCase(),
      aspf: aspf?.toLowerCase()
    };
  };

  const handleProcess = async () => {
    if (!domainsInput.trim()) return;

    const domainList = Array.from(new Set(
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
        const parsed = parseDmarc(record);
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, ...parsed } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    setIsProcessing(false);
  };

  const handleExport = () => {
    const csvContent = [
      ['S.No', 'Domain', 'Status', 'Policy', 'ADKIM', 'ASPF', 'Record'],
      ...results.map(r => [r.id, r.domain, r.status, r.policy || '-', r.adkim || '-', r.aspf || '-', r.record])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dmarc_results_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          r.record.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const stats = useMemo(() => {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'valid').length,
      missing: results.filter(r => r.status === 'missing').length,
      processed: results.filter(r => !['pending', 'loading'].includes(r.status)).length
    };
  }, [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">DMARC Analyzer</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk Policy Forensic Tool</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-bold text-xs border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
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
            placeholder="example.com&#10;google.com"
            className={`w-full h-48 p-4 rounded-xl outline-none font-mono text-xs resize-none ${inputClasses}`}
          />
        </div>

        <div className={`p-6 rounded-2xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className={`${isDark ? 'bg-[#05080f]' : 'bg-slate-50'} rounded-2xl p-6 border border-slate-800/50 text-center`}>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-2">Audit Progress</p>
             <div className={`text-4xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
               {stats.processed} <span className="text-slate-700">/</span> {stats.total}
             </div>
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput.trim()}
            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {isProcessing ? 'Analyzing Matrix...' : 'Start Bulk Audit'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
                TOTAL ({stats.total})
              </button>
              <button onClick={() => setFilterStatus('valid')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === 'valid' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-slate-900 border-emerald-500/20 text-emerald-500'}`}>
                VALID ({stats.valid})
              </button>
              <button onClick={() => setFilterStatus('missing')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${filterStatus === 'missing' ? 'bg-rose-600 text-white border-rose-500' : 'bg-slate-900 border-rose-500/20 text-rose-500'}`}>
                MISSING ({stats.missing})
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
                  <th className="px-6 py-4">POLICY</th>
                  <th className="px-6 py-4">DMARC RECORD</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((result, index) => (
                  <tr key={result.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.domain}</span>
                        <DmarcStatusBadge status={result.status} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {result.policy && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${
                          result.policy === 'reject' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                          result.policy === 'quarantine' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                          (isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200')
                        }`}>
                          {result.policy}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {result.record ? (
                        <code className={`block text-[10px] font-mono p-2 rounded border truncate max-w-sm ${isDark ? 'bg-slate-950 border-slate-800 text-emerald-400/80' : 'bg-slate-50 border-slate-200 text-emerald-700'}`}>
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

const DmarcStatusBadge: React.FC<{ status: DmarcResult['status'] }> = ({ status }) => {
  const styles = {
    valid: 'text-emerald-500',
    loading: 'text-blue-400 animate-pulse',
    invalid: 'text-amber-500',
    missing: 'text-rose-500',
    error: 'text-rose-500',
    pending: 'text-slate-700'
  };
  return <span className={`text-[9px] font-black uppercase tracking-widest ${styles[status]}`}>{status}</span>;
};

export default DmarcTool;
