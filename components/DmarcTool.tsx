
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Download, 
  BarChart3, 
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ArrowLeft,
  FileText,
  ShieldCheck,
  ShieldAlert,
  Zap
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
    if (!domainsInput.trim()) {
      notify('warning', 'Please provide domains to audit.');
      return;
    }

    // Fix: Explicitly type domainList and use Set<string> to prevent 'unknown' type inference in bulk processing
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
    notify('info', `Starting bulk audit for ${domainList.length} domains.`);

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
    const validCount = initialResults.filter(r => r.status === 'valid').length;
    notify(validCount > 0 ? 'success' : 'info', `Audit complete. Found ${validCount} valid DMARC policies.`);
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csvContent = [
      ['ID', 'Domain', 'Status', 'Policy', 'ADKIM', 'ASPF', 'Record'],
      ...results.map(r => [r.id, r.domain, r.status, r.policy || '-', r.adkim || '-', r.aspf || '-', r.record])
    ].map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dmarc_audit_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    notify('success', 'CSV export complete.');
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
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-xl shadow-emerald-600/20">
              <BarChart3 size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">DMARC Intelligence</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk Policy Compliance Audit</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] border uppercase tracking-[0.1em] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`lg:col-span-2 p-6 rounded-3xl shadow-xl border ${cardClasses} space-y-4`}>
          <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
             <FileText size={12} /> Target Domains
          </label>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="example.com&#10;google.com"
            className={`w-full h-48 p-5 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
          />
        </div>

        <div className={`p-6 rounded-3xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className="space-y-6">
             <div className={`${isDark ? 'bg-slate-950/50' : 'bg-slate-50'} rounded-2xl p-6 border border-slate-800/50 text-center`}>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-3">Audit Progress</p>
                <div className={`text-5xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {stats.processed} <span className="text-slate-800 text-2xl">/</span> {stats.total}
                </div>
             </div>
             <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-emerald-500/10 bg-emerald-500/5 text-center">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Valid</p>
                   <p className="text-lg font-black text-emerald-500">{stats.valid}</p>
                </div>
                <div className="p-3 rounded-xl border border-rose-500/10 bg-rose-500/5 text-center">
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Missing</p>
                   <p className="text-lg font-black text-rose-500">{stats.missing}</p>
                </div>
             </div>
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput.trim()}
            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Analyzing...</> : <><Zap size={16} /> Run Bulk Audit</>}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-3xl shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <FilterTab active={filterStatus === 'all'} onClick={() => setFilterStatus('all')} label="TOTAL" count={stats.total} isDark={isDark} />
              <FilterTab active={filterStatus === 'valid'} onClick={() => setFilterStatus('valid')} label="VALID" count={stats.valid} color="emerald" isDark={isDark} />
              <FilterTab active={filterStatus === 'missing'} onClick={() => setFilterStatus('missing')} label="MISSING" count={stats.missing} color="rose" isDark={isDark} />
            </div>
            <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search domain or policy..."
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
                  <th className="px-6 py-4">DOMAIN</th>
                  <th className="px-6 py-4">POLICY / ALIGNMENT</th>
                  <th className="px-6 py-4">DMARC RECORD OUTPUT</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{r.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className={`p-2 rounded-xl ${r.status === 'valid' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {r.status === 'valid' ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                         </div>
                         <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.domain}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       {r.status === 'valid' ? (
                         <div className="flex gap-2">
                           <span className="px-2 py-0.5 rounded text-[9px] font-black bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-widest">P={r.policy}</span>
                           <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">K={r.adkim || 'r'}</span>
                           <span className="px-2 py-0.5 rounded text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700 uppercase tracking-widest">S={r.aspf || 'r'}</span>
                         </div>
                       ) : <span className={`text-[9px] font-black uppercase tracking-widest ${r.status === 'missing' ? 'text-rose-500' : 'text-slate-600'}`}>{r.status}</span>}
                    </td>
                    <td className="px-6 py-4">
                      {r.record ? (
                        <code className={`block text-[10px] font-mono p-2.5 rounded-xl border truncate max-w-sm ${isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-50 border-slate-200 text-emerald-700'}`}>
                          {r.record}
                        </code>
                      ) : <span className="text-[10px] text-slate-700 italic font-medium">Record not found</span>}
                    </td>
                  </tr>
                ))}
                {filteredResults.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                       <div className="flex flex-col items-center gap-3 opacity-30">
                          <AlertCircle size={40} />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em]">No records in matrix matches search</p>
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

export default DmarcTool;
