import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Mail, 
  Loader2,
  ArrowLeft,
  Copy,
  Check,
  Zap
} from 'lucide-react';
import { MxRecord } from '../types';
import { lookupMxRecords } from '../services/dnsService';

interface MxToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface BulkMxResult {
  domain: string;
  records: MxRecord[];
  status: 'pending' | 'loading' | 'success' | 'not_found' | 'error';
}

const MxTool: React.FC<MxToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainsInput, setDomainsInput] = useState('');
  const [results, setResults] = useState<BulkMxResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const handleLookup = async () => {
    const domainList: string[] = Array.from(new Set<string>(
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

  const filteredResults = useMemo(() => {
    return results.filter(r => {
      const matchesSearch = r.domain.includes(searchQuery.toLowerCase()) || 
                          r.records.some(rec => rec.exchange.includes(searchQuery.toLowerCase()) || rec.provider.includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });
  }, [results, searchQuery]);

  const clear = () => {
    setDomainsInput('');
    setResults([]);
    setSearchQuery('');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-rose-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-rose-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-rose-500 p-2.5 rounded-xl text-white shadow-lg">
              <Mail size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-rose-500 uppercase">MX Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Identify Mail Infrastructure Architecture</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={clear} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Target Domains Matrix</label>
              <textarea
                value={domainsInput}
                onChange={(e) => setDomainsInput(e.target.value)}
                placeholder="apple.com&#10;google.com"
                className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none transition-all font-mono text-sm resize-none ${inputClasses}`}
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isProcessing || !domainsInput.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg font-black uppercase text-[10px] tracking-widest"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Auditing...</> : <><Zap size={16} /> Run Audit</>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden min-h-[400px] flex flex-col ${cardClasses}`}>
            <div className={`p-5 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
               <div className="relative flex-1 max-w-md w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input type="text" placeholder="Filter audit matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold ${inputClasses}`} />
               </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              {results.length > 0 ? (
                <div className="divide-y divide-slate-800/50">
                  {filteredResults.map((res, idx) => (
                    <div key={idx} className="group">
                      <div className={`${isDark ? 'bg-slate-950/20' : 'bg-slate-50/50'} p-4 flex items-center justify-between border-b border-slate-800/30`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${res.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <h3 className={`font-black tracking-tight text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{res.domain}</h3>
                        </div>
                        <button onClick={() => copyToClipboard(res, idx)} className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors">
                          {copiedIndex === idx ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                        </button>
                      </div>
                      {res.status === 'loading' ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-500" /></div>
                      ) : res.status === 'success' ? (
                        <table className="w-full text-left">
                          <thead className={`${isDark ? 'bg-slate-950/50' : 'bg-slate-100/50'}`}>
                            <tr className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                              <th className="px-6 py-2 w-20 text-center">Priority</th>
                              <th className="px-6 py-2">MX Exchange Server</th>
                              <th className="px-6 py-2">Provider Node</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-slate-800/30' : 'divide-slate-100'}`}>
                            {res.records.map((rec, rIdx) => (
                              <tr key={rIdx} className="hover:bg-rose-500/5 transition-colors">
                                <td className={`px-6 py-3 text-center text-xs font-mono font-black ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{rec.priority}</td>
                                <td className={`px-6 py-3 text-[11px] font-mono font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{rec.exchange}</td>
                                <td className="px-6 py-3">
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border uppercase tracking-widest ${isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                                    {rec.provider}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        <div className="p-6 text-xs text-slate-600 font-bold italic tracking-wide opacity-50">No identified hosting infrastructure.</div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center text-slate-500 uppercase font-black text-xs tracking-widest opacity-20">No Data Analyzed</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MxTool;