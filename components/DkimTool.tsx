
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
  Info
} from 'lucide-react';
import { DkimResult } from '../types';
import { lookupDkimRecord } from '../services/dnsService';

interface DkimToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type DkimFilterStatus = 'all' | 'success' | 'not_found' | 'pending';

const DkimTool: React.FC<DkimToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [selectorInput, setSelectorInput] = useState('');
  const [results, setResults] = useState<DkimResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<DkimFilterStatus>('all');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleProcess = async () => {
    if (!domainsInput.trim() || !selectorInput.trim()) return;

    const domainList = Array.from(new Set(
      domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0)
    ));

    const selectors = Array.from(new Set(
      selectorInput.split(',').map(s => s.trim()).filter(s => s.length > 0)
    ));

    const initialResults: DkimResult[] = [];
    let counter = 1;
    domainList.forEach(domain => {
      selectors.forEach(selector => {
        initialResults.push({ id: counter++, domain, selector, record: '', status: 'pending' });
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
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, record: record || '', status: record ? 'success' : 'not_found' } : r));
      } catch (err) {
        setResults(prev => prev.map(r => r.id === current.id ? { ...r, status: 'error' } : r));
      }
    }
    setIsProcessing(false);
  };

  const stats = useMemo(() => {
    return {
      total: results.length,
      valid: results.filter(r => r.status === 'success').length,
      invalid: results.filter(r => r.status === 'not_found' || r.status === 'error').length,
    };
  }, [results]);

  const currentInputCount = useMemo(() => {
    return domainsInput.split(/[\n,]/).map(d => d.trim()).filter(d => d.length > 0).length;
  }, [domainsInput]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = r.domain.toLowerCase().includes(q) || r.selector.toLowerCase().includes(q) || r.record.toLowerCase().includes(q);
      const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-lg">
              <ShieldCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Bulk DKIM Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Verification Matrix Tool</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={() => { setResults([]); setFilterStatus('all'); }} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-bold transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-8 p-6 rounded-2xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
               <Globe size={12} className="text-indigo-400" /> Target Domains
            </label>
            <div className="text-[10px] font-black text-indigo-400 uppercase bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
              Domains: {currentInputCount}
            </div>
          </div>
          <textarea
            value={domainsInput}
            onChange={(e) => setDomainsInput(e.target.value)}
            placeholder="example.com&#10;google.com"
            className={`w-full h-44 p-4 border rounded-xl outline-none font-mono text-xs resize-none ${inputClasses}`}
          />
        </div>

        <div className={`lg:col-span-4 p-6 rounded-2xl shadow-xl border flex flex-col justify-between ${cardClasses}`}>
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Layers size={12} className="text-indigo-400" /> Selectors
            </label>
            <input
              type="text"
              value={selectorInput}
              onChange={(e) => setSelectorInput(e.target.value)}
              placeholder="e.g. google, default, s1"
              className={`w-full p-3 border rounded-lg outline-none font-mono text-xs ${inputClasses}`}
            />
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
              We'll check [selector]._domainkey.[domain] for a TXT record.
            </p>
          </div>
          <button
            onClick={handleProcess}
            disabled={isProcessing || !domainsInput.trim() || !selectorInput.trim()}
            className="w-full mt-6 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {isProcessing ? 'Validating Matrix...' : 'Run Bulk Check'}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex gap-2">
              <button 
                onClick={() => setFilterStatus('all')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all min-w-[120px] ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              >
                TOTAL ({stats.total})
              </button>
              <button 
                onClick={() => setFilterStatus('success')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all min-w-[120px] ${filterStatus === 'success' ? 'bg-emerald-600/20 text-emerald-400 border-emerald-500 shadow-lg' : 'bg-slate-900 border-emerald-500/20 text-emerald-500'}`}
              >
                VALID ({stats.valid})
              </button>
              <button 
                onClick={() => setFilterStatus('not_found')}
                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all min-w-[120px] ${filterStatus === 'not_found' ? 'bg-rose-600/20 text-rose-400 border-rose-500 shadow-lg' : 'bg-slate-900 border-rose-500/20 text-rose-500'}`}
              >
                INVALID ({stats.invalid})
              </button>
            </div>
            
            <div className="relative flex-1 max-w-md w-full ml-auto">
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
                  <th className="px-6 py-4 text-center">STATUS</th>
                  <th className="px-6 py-4">OUTPUT KEY</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r, index) => (
                  <tr key={r.id} className="hover:bg-indigo-500/5 transition-colors group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                         <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{r.domain}</span>
                         <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Selector: {r.selector}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4">
                       {r.record ? (
                         <div className="flex items-center gap-2">
                           <code className={`text-[10px] font-mono p-2 rounded truncate max-w-[400px] border ${isDark ? 'bg-slate-950 border-[#1e293b] text-indigo-400' : 'bg-slate-50 border-slate-200 text-indigo-700'}`}>
                             {r.record}
                           </code>
                           <button 
                             onClick={() => { navigator.clipboard.writeText(r.record); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); }}
                             className="p-1.5 text-slate-600 hover:text-indigo-400 transition-colors"
                           >
                             {copiedId === r.id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                           </button>
                         </div>
                       ) : <span className="text-[10px] text-slate-700 italic font-medium">No records found</span>}
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
    loading: 'LOADING',
    not_found: 'INVALID',
    error: 'INVALID',
    pending: 'QUEUED'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default DkimTool;
