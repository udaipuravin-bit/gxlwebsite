
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Mail, 
  ExternalLink,
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  AlertTriangle,
  Server,
  Cloud,
  FileText,
  CheckCircle2,
  Filter,
  X
} from 'lucide-react';
import { MxRecord } from '../types';
import { lookupMxRecords } from '../services/dnsService';

// Added theme to MxToolProps interface
interface MxToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface BulkMxResult {
  domain: string;
  records: MxRecord[];
  status: 'pending' | 'loading' | 'success' | 'not_found' | 'error';
}

// Updated component to accept theme and handle conditional styles
const MxTool: React.FC<MxToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<BulkMxResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProvider, setFilterProvider] = useState<string | null>(null);

  const handleLookup = async () => {
    const domainList = Array.from(new Set(
      domainsInput
        .split(/[\n,]/)
        .map(d => d.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, ''))
        .filter(d => d.length > 0)
    ));

    if (domainList.length === 0) return;

    const initialResults: BulkMxResult[] = domainList.map(domain => ({
      domain,
      records: [],
      status: 'pending'
    }));

    setResults(initialResults);
    setFilterProvider(null);
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'loading' } : r));

      try {
        const records = await lookupMxRecords(current.domain);
        setResults(prev => prev.map((r, idx) => idx === i ? { 
          ...r, 
          records, 
          status: records.length > 0 ? 'success' : 'not_found' 
        } : r));
      } catch (err) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
    }

    setIsProcessing(false);
  };

  const copyToClipboard = (domainResults: BulkMxResult, index: number) => {
    if (domainResults.records.length === 0) return;
    const text = domainResults.records
      .map(r => `Priority: ${r.priority} | Server: ${r.exchange} | Provider: ${r.provider}`)
      .join('\n');
    navigator.clipboard.writeText(`MX Records for ${domainResults.domain}:\n${text}`);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const stats = useMemo(() => {
    const providers = results.flatMap(r => r.records.map(rec => rec.provider));
    const providerCounts = providers.reduce((acc, curr) => {
      acc[curr] = (acc[curr] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const providerList = Object.entries(providerCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    return {
      total: results.length,
      processed: results.filter(r => r.status !== 'pending' && r.status !== 'loading').length,
      found: results.filter(r => r.status === 'success').length,
      notFound: results.filter(r => r.status === 'not_found').length,
      providers: providerList
    };
  }, [results]);

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.domain.includes(searchQuery.toLowerCase()) || 
                          r.records.some(rec => rec.exchange.includes(searchQuery.toLowerCase()) || rec.provider.includes(searchQuery.toLowerCase()));
      
      const matchesProvider = !filterProvider || r.records.some(rec => rec.provider === filterProvider);
      
      return matchesSearch && matchesProvider;
    });
  }, [results, searchQuery, filterProvider]);

  const clear = () => {
    setDomainsInput('');
    setResults([]);
    setSearchQuery('');
    setFilterProvider(null);
  };

  const toggleProviderFilter = (providerName: string) => {
    if (filterProvider === providerName) {
      setFilterProvider(null);
    } else {
      setFilterProvider(providerName);
    }
  };

  const cardClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      {/* Header */}
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-lg shadow-rose-500/20">
              <Mail size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Bulk MX & Provider Audit</h1>
              <p className="text-slate-400 text-xs md:text-sm">Identify Email Hosting & Mail Architecture</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={clear} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-bold transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Pane */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className={`p-6 rounded-2xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <div>
              <label className="block text-sm font-semibold mb-2">Domains to Analyze</label>
              <textarea
                value={domainsInput}
                onChange={(e) => setDomainsInput(e.target.value)}
                placeholder="apple.com&#10;microsoft.com, google.com"
                className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none placeholder:text-slate-400 ${inputClasses}`}
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isProcessing || !domainsInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-rose-500/10 font-bold"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin" size={20} /> Auditing...</>
              ) : (
                <><Play size={20} /> Run Audit</>
              )}
            </button>
          </div>

          {results.length > 0 && (
            <div className={`p-6 rounded-2xl shadow-xl border space-y-6 ${cardClasses}`}>
              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2 mb-4">
                  <FileText size={12}/> Analysis Stats
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className={`${isDark ? 'bg-slate-950' : 'bg-slate-50'} p-3 rounded-xl border border-slate-800`}>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Total</p>
                    <p className="text-xl font-black">{stats.total}</p>
                  </div>
                  <div className={`${isDark ? 'bg-slate-950' : 'bg-slate-50'} p-3 rounded-xl border border-slate-800`}>
                    <p className="text-[9px] text-slate-500 uppercase font-bold">Processed</p>
                    <p className="text-xl font-black text-emerald-400">{stats.processed}</p>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest flex items-center gap-2 mb-3">
                  <Cloud size={12}/> Provider Intelligence
                </h4>
                <div className="space-y-2">
                  {stats.providers.map((p) => (
                    <button
                      key={p.name}
                      onClick={() => toggleProviderFilter(p.name)}
                      className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        filterProvider === p.name 
                          ? 'bg-rose-500/20 border-rose-500/40 ring-1 ring-rose-500/20' 
                          : `${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'} hover:border-slate-700`
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${filterProvider === p.name ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]' : 'bg-slate-700'}`} />
                        <p className={`text-xs font-bold truncate ${filterProvider === p.name ? 'text-rose-400' : (isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-600 group-hover:text-slate-900')}`}>
                          {p.name}
                        </p>
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${
                        filterProvider === p.name ? 'bg-rose-500 text-white' : (isDark ? 'bg-slate-800 text-slate-500 group-hover:text-slate-400' : 'bg-slate-100 text-slate-500 group-hover:text-slate-700')
                      }`}>
                        {p.count}
                      </span>
                    </button>
                  ))}
                  {stats.providers.length === 0 && (
                    <p className="text-[10px] text-slate-600 italic">No providers detected yet.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Pane */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                type="text"
                placeholder="Filter results by domain or server name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none text-sm transition-all ${inputClasses}`}
              />
            </div>
            {filterProvider && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl animate-in zoom-in-95 duration-200">
                <Filter size={14} className="text-rose-400" />
                <span className="text-xs font-bold text-rose-400">Provider: {filterProvider}</span>
                <button 
                  onClick={() => setFilterProvider(null)}
                  className="p-0.5 hover:bg-rose-500/20 rounded text-rose-400 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredResults.map((res, idx) => (
              <div key={idx} className={`rounded-2xl border overflow-hidden shadow-lg transition-all hover:border-slate-700 animate-in slide-in-from-bottom-2 duration-300 ${cardClasses}`}>
                <div className={`${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'} p-4 border-b flex items-center justify-between`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${
                      res.status === 'success' ? 'bg-emerald-500 animate-pulse' : 
                      res.status === 'not_found' ? 'bg-rose-500' : 'bg-slate-700'
                    }`} />
                    <h3 className="font-bold">{res.domain}</h3>
                    {res.records.length > 0 && (
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${isDark ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {res.records[0].provider}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => copyToClipboard(res, idx)}
                      className="p-1.5 text-slate-500 hover:text-white transition-colors"
                      title="Copy Records"
                    >
                      {copiedIndex === idx ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                    </button>
                    <a 
                      href={`https://mxtoolbox.com/SuperTool.aspx?action=mx%3a${res.domain}`}
                      target="_blank"
                      className="p-1.5 text-slate-500 hover:text-white transition-colors"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
                <div className="p-0">
                  {res.status === 'loading' && (
                    <div className="p-12 flex flex-col items-center justify-center gap-3">
                      <Loader2 className="animate-spin text-rose-500" size={32} />
                      <p className="text-xs text-slate-500 font-bold uppercase">Querying DNS...</p>
                    </div>
                  )}
                  {res.status === 'not_found' && (
                    <div className="p-8 flex items-center gap-4 bg-rose-500/5">
                      <AlertTriangle className="text-rose-400" size={24} />
                      <div>
                        <p className="text-sm font-bold text-rose-400">No MX Records Found</p>
                        <p className="text-xs text-slate-500">Domain may not be configured to receive emails.</p>
                      </div>
                    </div>
                  )}
                  {res.status === 'success' && (
                    <table className="w-full text-left">
                      <thead className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-100'}`}>
                        <tr>
                          <th className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest w-20 text-center">Priority</th>
                          <th className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Mail Server</th>
                          <th className="px-6 py-2 text-[10px] font-black text-slate-600 uppercase tracking-widest">Provider</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                        {res.records.map((rec, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-500/5 transition-colors">
                            <td className="px-6 py-3 text-center">
                              <span className={`text-xs font-black font-mono ${
                                rec.priority === 0 ? 'text-emerald-400' : 
                                rec.priority < 10 ? 'text-sky-400' : 'text-slate-500'
                              }`}>
                                {rec.priority}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <code className={`text-[11px] font-mono ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{rec.exchange}</code>
                            </td>
                            <td className="px-6 py-3">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-tighter ${
                                rec.provider !== 'Custom / Private' 
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                                : (isDark ? 'bg-slate-800/50 text-slate-600 border-slate-800' : 'bg-slate-100 text-slate-400 border-slate-200')
                              }`}>
                                {rec.provider}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            ))}

            {filteredResults.length === 0 && results.length > 0 && !isProcessing && (
              <div className={`flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed text-slate-600 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Filter size={48} strokeWidth={1} className="mb-4" />
                <p className="text-sm font-medium">No results matching active filters</p>
                <button 
                  onClick={() => {setSearchQuery(''); setFilterProvider(null);}}
                  className="mt-4 text-xs font-bold text-rose-400 uppercase tracking-widest hover:text-rose-300 transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {results.length === 0 && !isProcessing && (
              <div className={`flex flex-col items-center justify-center py-24 rounded-3xl border border-dashed text-slate-600 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <Mail size={48} strokeWidth={1} className="mb-4" />
                <p className="text-sm font-medium">Analysis results will appear here</p>
                <p className="text-[10px] uppercase font-black mt-2 tracking-widest opacity-50">Enter domain list to begin</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className={`mt-auto pt-8 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro • MX Engine v2.0</p>
        <div className="flex gap-4">
          <a href="#" className="hover:text-slate-400">Security Audit</a>
          <a href="#" className="hover:text-slate-400">API Docs</a>
        </div>
      </footer>
    </div>
  );
};

export default MxTool;
