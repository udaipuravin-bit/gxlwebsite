import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Download, 
  Network, 
  Loader2, 
  Clock, 
  ArrowLeft, 
  XCircle, 
  Globe, 
  Layers, 
  Zap 
} from 'lucide-react';
import { DnsLookupEntry } from '../types';
import { lookupRecordByType } from '../services/dnsService';
import { useNotify } from '../App';

interface DnsLookupToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface BulkDnsEntry extends DnsLookupEntry {
  domain: string;
}

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA', 'CAA', 'PTR'];

const DnsLookupTool: React.FC<DnsLookupToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [domainInput, setDomainInput] = useState('');
  const [bulkInput, setBulkInput] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['A', 'MX', 'TXT']);
  
  const [results, setResults] = useState<BulkDnsEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleRecordType = (type: string) => {
    setSelectedTypes(prev => 
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const handleLookup = async () => {
    setError(null);
    setResults([]);
    
    if (mode === 'single') {
      const cleanDomain = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
      if (!cleanDomain) return;
      
      setIsProcessing(true);
      try {
        const promises = RECORD_TYPES.map(type => lookupRecordByType(cleanDomain, type));
        const allResults = await Promise.all(promises);
        const flattened = allResults.flat().map(r => ({ ...r, domain: cleanDomain }));
        
        if (flattened.length === 0) setError('No records found for this domain.');
        setResults(flattened);
      } catch (err) {
        setError('An error occurred during lookup. Please check the domain.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      const domainList = bulkInput.split(/[\n,]/).map(d => d.trim().toLowerCase()).filter(d => d.length > 0);
      if (domainList.length === 0) {
        notify('warning', 'Please provide at least one domain.');
        return;
      }
      if (selectedTypes.length === 0) {
        notify('warning', 'Please select at least one record type.');
        return;
      }

      setIsProcessing(true);
      notify('info', `Starting bulk resolution for ${domainList.length} domains...`);
      
      const bulkResults: BulkDnsEntry[] = [];
      
      for (const domain of domainList) {
        try {
          const typePromises = selectedTypes.map(type => lookupRecordByType(domain, type));
          const typeResults = await Promise.all(typePromises);
          const domainRecords = typeResults.flat().map(r => ({ ...r, domain }));
          bulkResults.push(...domainRecords);
        } catch (e) {
          console.error(`Failed to resolve ${domain}`, e);
        }
      }

      if (bulkResults.length === 0) setError('No records found for the provided domains and types.');
      setResults(bulkResults);
      setIsProcessing(false);
      notify('success', `Resolution finished. ${bulkResults.length} records identified.`);
    }
  };

  const handleExport = () => {
    const csvContent = [['Domain', 'Type', 'Name', 'Value', 'TTL'].join(','), ...results.map(r => [r.domain, r.type, r.name, r.value, r.ttl].join(','))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dns_lookup_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      r.domain.toLowerCase().includes(q) || 
      r.type.toLowerCase().includes(q) || 
      r.value.toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-sky-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-sky-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2.5 rounded-2xl text-white shadow-xl shadow-sky-500/20">
              <Network size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-sky-500">DNS Lookup</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Global Recursive Resolution Matrix</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] border uppercase tracking-[0.1em] ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </header>

      <div className="flex flex-col gap-6">
        <div className={`p-8 rounded-3xl shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Resolution Mode</label>
              <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button 
                  onClick={() => { setMode('single'); setResults([]); setError(null); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Single Domain
                </button>
                <button 
                  onClick={() => { setMode('bulk'); setResults([]); setError(null); }}
                  className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  Bulk Nodes
                </button>
              </div>
              <div className="mt-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                  {mode === 'single' ? <Globe size={12} className="text-sky-400" /> : <Layers size={12} className="text-sky-400" />}
                  Target Domain(s)
                </label>
                {mode === 'single' ? (
                  <input
                    type="text"
                    value={domainInput}
                    onChange={(e) => setDomainInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                    placeholder="e.g. google.com"
                    className={`w-full px-5 py-4 border rounded-2xl outline-none font-bold text-sm transition-all ${inputClasses}`}
                  />
                ) : (
                  <textarea
                    value={bulkInput}
                    onChange={(e) => setBulkInput(e.target.value)}
                    placeholder="google.com&#10;microsoft.com"
                    className={`w-full h-32 p-5 border rounded-2xl outline-none font-mono text-sm resize-none transition-all ${inputClasses}`}
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                 <Zap size={12} className="text-sky-400" /> Record Type Matrix
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RECORD_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleRecordType(type)}
                    className={`px-3 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-tighter border transition-all ${
                      selectedTypes.includes(type) 
                        ? 'bg-sky-600 border-sky-500 text-white shadow-lg' 
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-sky-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <p className="mt-auto text-[9px] font-black text-slate-500 uppercase tracking-widest opacity-50">Select one or more record types for recursive identification.</p>
            </div>
          </div>

          <button
            onClick={handleLookup}
            disabled={isProcessing || (mode === 'single' ? !domainInput.trim() : !bulkInput.trim())}
            className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
          >
            {isProcessing ? <><Loader2 size={18} className="animate-spin" /> RESOLVING DNS NODES...</> : <><Zap size={18} /> RUN GLOBAL RESOLUTION</>}
          </button>
        </div>

        <div className={`rounded-3xl shadow-xl border overflow-hidden flex flex-col animate-in slide-in-from-bottom-4 duration-500 ${cardClasses}`}>
          <div className={`p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
             <div className="flex items-center gap-3">
               <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
                  <Network size={18} />
               </div>
               <h2 className="text-[12px] font-black uppercase tracking-widest">Resolution Data Matrix</h2>
             </div>
             
             <div className="relative flex-1 max-w-md w-full ml-auto">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  placeholder="Filter record results..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-sm font-bold transition-all ${inputClasses}`}
                />
              </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar min-h-[400px]">
            {isProcessing ? (
              <div className="flex flex-col items-center justify-center py-32 gap-4">
                <Loader2 className="animate-spin text-sky-500" size={40} />
                <p className="text-[12px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Engaging Global DNS Matrix...</p>
              </div>
            ) : error ? (
              <div className="py-32 flex flex-col items-center justify-center gap-3">
                 <XCircle size={48} className="text-rose-500 opacity-50" />
                 <p className="text-rose-500 font-black uppercase tracking-widest text-sm">{error}</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    {mode === 'bulk' && <th className="px-8 py-5">Domain Node</th>}
                    <th className="px-8 py-5 w-24">Type</th>
                    <th className="px-8 py-5">Host Identity</th>
                    <th className="px-8 py-5">Resolved Payload</th>
                    <th className="px-8 py-5 w-24 text-center">TTL</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {filteredResults.length > 0 ? filteredResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-sky-500/5 transition-colors group">
                      {mode === 'bulk' && (
                        <td className="px-8 py-6">
                           <span className={`text-base font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{result.domain}</span>
                        </td>
                      )}
                      <td className="px-8 py-6">
                        <span className={`text-[10px] font-black px-3 py-1 rounded-xl border uppercase tracking-widest ${isDark ? 'bg-slate-800 text-sky-400 border-sky-500/20' : 'bg-slate-100 text-sky-600 border-slate-200'}`}>
                          {result.type}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                         <span className="text-[11px] font-bold text-slate-500 font-mono break-all">{result.name}</span>
                      </td>
                      <td className="px-8 py-6">
                        <code className={`text-sm font-mono p-4 rounded-xl border block break-all whitespace-pre-wrap leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-800 shadow-inner'}`}>
                          {result.value}
                        </code>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="text-[11px] font-black text-slate-600 flex items-center justify-center gap-1.5"><Clock size={12}/> {result.ttl}</span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-8 py-32 text-center text-slate-500 uppercase font-black text-xs tracking-widest opacity-20">Awaiting Search Query</td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsLookupTool;