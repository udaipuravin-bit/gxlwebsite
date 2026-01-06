import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Calendar, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Clock,
  ExternalLink,
  Info,
  Globe,
  Download,
  CheckCircle2,
  AlertCircle,
  Zap
} from 'lucide-react';
import { WhoisResult } from '../types';
import { lookupWhoisData } from '../services/dnsService';
import { useNotify } from '../App';

interface WhoisToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

type FilterStatus = 'all' | 'expiring' | 'safe' | 'error';

const WhoisTool: React.FC<WhoisToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<WhoisResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');

  const handleLookup = async () => {
    const domainList: string[] = Array.from(new Set<string>(
      domainsInput
        .split(/[\n,]/)
        .map(d => d.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, ''))
        .filter(d => d.length > 0)
    ));

    if (domainList.length === 0) return;

    const initialResults: WhoisResult[] = domainList.map((domain, index) => ({
      id: index + 1,
      domain,
      registrar: '',
      createdDate: '',
      expiryDate: '',
      daysRemaining: 0,
      status: [],
      loadingStatus: 'pending'
    }));

    setResults(initialResults);
    setIsProcessing(true);
    setFilterStatus('all');
    notify('info', `Starting optimized parallel audit for ${domainList.length} domains...`);

    const CONCURRENCY_LIMIT = 5; // Process 5 domains at a time for speed balance
    const batches = [];
    for (let i = 0; i < initialResults.length; i += CONCURRENCY_LIMIT) {
      batches.push(initialResults.slice(i, i + CONCURRENCY_LIMIT));
    }

    for (const batch of batches) {
      // Mark batch as loading
      setResults(prev => prev.map(r => 
        batch.some(b => b.id === r.id) ? { ...r, loadingStatus: 'loading' } : r
      ));

      // Process batch in parallel
      await Promise.all(batch.map(async (item) => {
        try {
          const data = await lookupWhoisData(item.domain);
          setResults(prev => prev.map(r => r.id === item.id ? { 
            ...r, 
            ...(data || {}), 
            loadingStatus: data ? 'success' : 'not_found' 
          } : r));
        } catch (err) {
          setResults(prev => prev.map(r => r.id === item.id ? { ...r, loadingStatus: 'error' } : r));
        }
      }));
    }

    setIsProcessing(false);
    notify('success', 'Bulk audit finalized.');
  };

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.domain.includes(searchQuery.toLowerCase()) || 
                          r.registrar.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesFilter = true;
      if (filterStatus === 'expiring') matchesFilter = r.daysRemaining < 30;
      if (filterStatus === 'safe') matchesFilter = r.daysRemaining >= 30;
      if (filterStatus === 'error') matchesFilter = r.loadingStatus === 'error' || r.loadingStatus === 'not_found';

      return matchesSearch && matchesFilter;
    });
  }, [results, searchQuery, filterStatus]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2.5 rounded-xl text-white shadow-lg shadow-amber-500/20">
              <Calendar size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase">Bulk Domain Expiry</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Speed RDAP Architecture</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className={`p-6 rounded-2xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Domains List</label>
            <textarea
              value={domainsInput}
              onChange={(e) => setDomainsInput(e.target.value)}
              placeholder="google.com&#10;netflix.com"
              className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none ${inputClasses}`}
            />
            <button
              onClick={handleLookup}
              disabled={isProcessing || !domainsInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl transition-all shadow-lg font-bold uppercase tracking-widest text-xs disabled:opacity-50"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} Run High-Speed Audit
            </button>
          </div>
        </div>

        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex gap-2">
                <button 
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] transition-all min-w-[120px] ${filterStatus === 'all' ? 'bg-white text-slate-950 border-white shadow-md' : 'bg-slate-900 border-[#1e293b] text-slate-400 hover:text-white'}`}
                >
                  ALL
                </button>
                <button 
                  onClick={() => setFilterStatus('expiring')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-[0.1em] border transition-all min-w-[120px] ${filterStatus === 'expiring' ? 'bg-amber-600/20 text-amber-500 border-amber-500 shadow-lg' : 'bg-slate-900 border-amber-500/40 text-amber-500 hover:bg-amber-500/10'}`}
                >
                  EXPIRING
                </button>
              </div>
              
              <div className="relative flex-1 max-w-md ml-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Filter by domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold transition-all ${inputClasses}`}
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b`}>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Domain</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Registrar</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Expiry Date</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Days Remaining</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {filteredResults.map((res) => (
                    <tr key={res.id} className="hover:bg-amber-500/5 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <Globe size={14} className="text-slate-500" />
                           <span className={`text-sm font-bold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{res.domain}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500 font-bold truncate max-w-[150px]">{res.registrar || '—'}</td>
                      <td className="px-6 py-4 text-center">
                         <span className={`text-xs font-mono font-bold ${res.daysRemaining < 0 ? 'text-rose-500' : res.daysRemaining < 30 ? 'text-amber-500' : 'text-slate-500'}`}>
                           {res.expiryDate ? new Date(res.expiryDate).toLocaleDateString() : '—'}
                         </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <div className={`inline-flex flex-col items-center justify-center min-w-[80px] px-3 py-1.5 rounded-lg border font-mono font-black tracking-tight ${
                           res.daysRemaining < 0 
                            ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                            : res.daysRemaining < 30 
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            : 'bg-emerald-500/5 text-emerald-500/70 border-emerald-500/10'
                         }`}>
                           <span className="text-sm">{res.daysRemaining}</span>
                           <span className="text-[8px] uppercase">{res.daysRemaining < 0 ? 'Days Ago' : 'Days Left'}</span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         <LoadingBadge status={res.loadingStatus} days={res.daysRemaining} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {results.length === 0 && !isProcessing && (
              <div className="p-24 text-center">
                 <Calendar size={48} className="mx-auto text-slate-800 mb-4 opacity-20" />
                 <p className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Enter domain list to begin optimized audit</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingBadge: React.FC<{ status: WhoisResult['loadingStatus']; days: number }> = ({ status, days }) => {
  if (status === 'loading') return <Loader2 size={12} className="animate-spin mx-auto text-blue-400" />;
  if (status === 'not_found') return <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">N/A</span>;
  if (status === 'error') return <AlertCircle size={12} className="mx-auto text-rose-500" />;
  if (status === 'success') {
    if (days < 0) return <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Expired</span>;
    if (days < 30) return <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">Critical</span>;
    return <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Active</span>;
  }
  return <Clock size={12} className="mx-auto text-slate-700" />;
};

export default WhoisTool;