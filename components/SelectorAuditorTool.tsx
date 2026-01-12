import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Zap, 
  Loader2, 
  Globe, 
  Layers,
  SearchCheck,
  Filter,
  Copy,
  Check,
  Fingerprint,
  Monitor
} from 'lucide-react';
import { DkimResult } from '../types';
import { useNotify } from '../App';
import { lookupDkimRecord } from '../services/dnsService';

interface AuditorEntry extends DkimResult {
  matchStatus: 'match' | 'mismatch' | 'missing' | 'loading' | 'pending' | 'error';
}

interface SelectorAuditorProps {
  onBack: () => void;
  theme: 'dark' | 'light';
  onPushMime?: (payload: string) => void;
}

const SelectorAuditorTool: React.FC<SelectorAuditorProps> = ({ onBack, theme, onPushMime }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [domainsInput, setDomainsInput] = useState('');
  const [selectorInput, setSelectorInput] = useState('');
  const [matchPattern, setMatchPattern] = useState('p=');
  const [results, setResults] = useState<AuditorEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const handleAudit = async () => {
    const domains = domainsInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
    const selectors = selectorInput.split(/[,]/).map(s => s.trim()).filter(s => s.length > 0);

    if (domains.length === 0) { notify('warning', 'Please provide target domains.'); return; }

    const sel = selectors.length > 0 ? selectors : ['default'];
    const initialEntries: AuditorEntry[] = [];
    let id = 1;

    domains.forEach(domain => {
      sel.forEach(selector => {
        initialEntries.push({ id: id++, domain, selector, record: '', status: 'pending', matchStatus: 'pending' });
      });
    });

    setResults(initialEntries);
    setIsProcessing(true);

    const BATCH_SIZE = 3;
    for (let i = 0; i < initialEntries.length; i += BATCH_SIZE) {
      const batch = initialEntries.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (entry) => {
        setResults(prev => prev.map(r => r.id === entry.id ? { ...r, status: 'loading', matchStatus: 'loading' } : r));
        try {
          const record = await lookupDkimRecord(entry.domain, entry.selector);
          let matchStatus: AuditorEntry['matchStatus'] = 'missing';
          if (record) {
            const patternMatch = matchPattern.trim() ? record.toLowerCase().includes(matchPattern.toLowerCase().trim()) : true;
            matchStatus = patternMatch ? 'match' : 'mismatch';
          }
          setResults(prev => prev.map(r => r.id === entry.id ? { ...r, record: record || '', status: record ? 'success' : 'not_found', matchStatus } : r));
        } catch (e) {
          setResults(prev => prev.map(r => r.id === entry.id ? { ...r, status: 'error', matchStatus: 'error' } : r));
        }
      }));
    }
    setIsProcessing(false);
    notify('success', 'Audit complete.');
  };

  const filteredResults = useMemo(() => results.filter(r => r.domain.includes(searchQuery.toLowerCase()) || r.selector.includes(searchQuery.toLowerCase()) || r.record.toLowerCase().includes(searchQuery.toLowerCase())), [results, searchQuery]);

  const stats = useMemo(() => ({
    matches: results.filter(r => r.matchStatus === 'match').length,
    missing: results.filter(r => r.matchStatus === 'missing').length
  }), [results]);

  const cardClasses = isDark ? 'bg-[#0a0f1c] border-[#1e293b] text-slate-100 shadow-2xl' : 'bg-white border-slate-200 text-slate-900 shadow-xl';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-300 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  return (
    <div className="min-h-screen px-4 md:px-8 py-6 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-[2rem] border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-xl">
              <SearchCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-orange-500">Selector Auditor</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Discovery & Logic Matrix</p>
            </div>
          </div>
        </div>
        {results.length > 0 && <button onClick={() => {setResults([]); setDomainsInput(''); setSelectorInput('');}} className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all"><Trash2 size={20} /></button>}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-[2rem] border flex flex-col gap-4 ${cardClasses}`}>
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Globe size={12}/> Target Domains (Matrix)</label>
               <textarea value={domainsInput} onChange={(e) => setDomainsInput(e.target.value)} placeholder="google.com" className={`w-full h-32 p-4 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`} />
            </div>
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Layers size={12}/> Active Selectors (CSV)</label>
               <input type="text" value={selectorInput} onChange={(e) => setSelectorInput(e.target.value)} placeholder="default, google, s1" className={`w-full p-4 border rounded-2xl outline-none font-bold text-xs ${inputClasses}`} />
            </div>
            <div>
               <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2"><Fingerprint size={12}/> Diagnostic Match Pattern</label>
               <input type="text" value={matchPattern} onChange={(e) => setMatchPattern(e.target.value)} placeholder="p=" className={`w-full p-4 border rounded-2xl outline-none font-bold text-xs ${inputClasses}`} />
            </div>
            <button onClick={handleAudit} disabled={isProcessing} className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {isProcessing ? <><Loader2 size={16} className="animate-spin" /> AUDITING...</> : <><Zap size={16} /> RUN LOGIC SCAN</>}
            </button>
          </div>
        </div>

        <div className={`lg:col-span-8 rounded-[2rem] border overflow-hidden animate-in slide-in-from-right-4 duration-500 flex flex-col ${cardClasses}`}>
          <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
             <div className="flex gap-4 px-4 py-1.5 rounded-xl bg-slate-900/50 border border-slate-800">
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-500 uppercase">Matched</p>
                   <p className="text-xs font-black text-emerald-500">{stats.matches}</p>
                </div>
                <div className="w-px h-full bg-slate-800" />
                <div className="text-center">
                   <p className="text-[8px] font-black text-slate-500 uppercase">Missing</p>
                   <p className="text-xs font-black text-rose-500">{stats.missing}</p>
                </div>
             </div>
             <div className="relative flex-1 max-w-md w-full ml-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
              <input type="text" placeholder="Search result matrix..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-2.5 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`} />
            </div>
          </div>
          <div className="flex-1 overflow-auto min-h-[400px]">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-600`}>
                  <th className="px-6 py-4 w-12 text-center">ID</th>
                  <th className="px-6 py-4">Domain Node</th>
                  <th className="px-6 py-4">Selector</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4">Forensic Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-500/5 transition-all group">
                    <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className={`px-6 py-4 text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.domain}</td>
                    <td className="px-6 py-4 text-xs font-black uppercase tracking-widest text-orange-400">{r.selector}</td>
                    <td className="px-6 py-4 text-center">
                       <span className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${r.matchStatus === 'match' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border-rose-500/20'}`}>{r.matchStatus}</span>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                          {r.record && (
                            <code className={`text-[10px] font-mono p-2 rounded-lg truncate max-w-[120px] border ${isDark ? 'bg-slate-950 border-slate-800 text-orange-400/60' : 'bg-slate-100 border-slate-100 text-orange-700/60'}`}>
                              {r.record}
                            </code>
                          )}
                          <button onClick={() => { navigator.clipboard.writeText(r.record); setCopiedId(r.id); setTimeout(() => setCopiedId(null), 2000); }} className="p-2 bg-slate-900/50 rounded-lg transition-colors hover:bg-slate-800" title="Copy Record">
                              {copiedId === r.id ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} className="text-slate-400" />}
                          </button>
                          {r.record && onPushMime && (
                            <button onClick={() => onPushMime(r.record)} className="p-2 bg-orange-600/10 text-orange-500 rounded-lg transition-all hover:bg-orange-600 hover:text-white" title="Analyze in MIME Forensic Studio">
                               <Monitor size={14} />
                            </button>
                          )}
                       </div>
                    </td>
                  </tr>
                )) : <tr><td colSpan={5} className="px-6 py-32 text-center text-slate-600 opacity-20 uppercase font-black text-xs tracking-widest">Awaiting Domain Analysis</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectorAuditorTool;