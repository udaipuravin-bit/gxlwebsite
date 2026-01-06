
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Download, 
  Network, 
  Loader2,
  Clock,
  ArrowLeft,
  Info,
  XCircle,
  Globe,
  Layers,
  Zap,
  Check,
  Plus
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
  
  // Modes: 'single' or 'bulk'
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
        // In single mode, we check ALL standard types by default to be "Deep"
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
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2.5 rounded-2xl text-white shadow-xl shadow-sky-500/20">
              <Network size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Deep DNS Intelligence</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Global Recursive Resolution Matrix</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all font-black text-[10px] border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Download size={16} /> Export CSV
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Configuration Panel */}
        <div className={`lg:col-span-4 p-6 rounded-3xl shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
          
          {/* Mode Switcher */}
          <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
            <button 
              onClick={() => { setMode('single'); setResults([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'single' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Single Domain
            </button>
            <button 
              onClick={() => { setMode('bulk'); setResults([]); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'bulk' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Bulk Domains
            </button>
          </div>

          <div>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
              {mode === 'single' ? <Globe size={12} className="text-sky-400" /> : <Layers size={12} className="text-sky-400" />}
              {mode === 'single' ? 'Target Domain' : 'Domain Matrix'}
            </label>
            {mode === 'single' ? (
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. google.com"
                  className={`w-full pl-10 pr-4 py-3.5 border rounded-2xl outline-none font-bold text-sm transition-all ${inputClasses}`}
                />
              </div>
            ) : (
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="google.com&#10;microsoft.com&#10;apple.com"
                className={`w-full h-40 p-4 border rounded-2xl outline-none font-mono text-xs resize-none transition-all ${inputClasses}`}
              />
            )}
          </div>

          {mode === 'bulk' && (
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-3">
                 <Zap size={12} className="text-sky-400" /> Resolution Types
              </label>
              <div className="grid grid-cols-3 gap-2">
                {RECORD_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => toggleRecordType(type)}
                    className={`px-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter border transition-all ${
                      selectedTypes.includes(type) 
                        ? 'bg-sky-600 border-sky-500 text-white shadow-lg' 
                        : isDark ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-sky-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleLookup}
            disabled={isProcessing || (mode === 'single' ? !domainInput.trim() : !bulkInput.trim())}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-sky-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
          >
            {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Resolving...</> : <><Zap size={16} /> Run Resolution</>}
          </button>

          <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className="text-[9px] uppercase font-black text-slate-500 tracking-[0.2em] mb-3 flex items-center gap-2">
              <Info size={12} className="text-sky-400"/> Operational Mode
            </h4>
            <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
              {mode === 'single' 
                ? 'Resolves all standard record types for a single hostname to provide a comprehensive profile.' 
                : 'Scans multiple domains for specific record types to identify infrastructure patterns.'}
            </p>
          </div>
        </div>

        {/* Results Matrix */}
        <div className={`lg:col-span-8 rounded-3xl shadow-xl border overflow-hidden flex flex-col ${cardClasses}`}>
          <div className={`p-5 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
             <div className="flex items-center gap-3">
               <div className="bg-sky-500/10 p-2 rounded-xl text-sky-500">
                  <Network size={16} />
               </div>
               <h2 className="text-[10px] font-black uppercase tracking-widest">Resolution Results</h2>
             </div>
             
             <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Filter result matrix..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2.5 border rounded-xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  {mode === 'bulk' && <th className="px-6 py-4">Domain</th>}
                  <th className="px-6 py-4 w-24">Type</th>
                  <th className="px-6 py-4">Name / Host</th>
                  <th className="px-6 py-4">Value / Data</th>
                  <th className="px-6 py-4 w-20 text-center">TTL</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.length > 0 ? (
                  filteredResults.map((result, idx) => (
                    <tr key={idx} className="hover:bg-sky-500/5 transition-colors group">
                      {mode === 'bulk' && (
                        <td className="px-6 py-4">
                           <span className={`text-xs font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{result.domain}</span>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isDark ? 'bg-slate-800 text-sky-400 border-sky-500/20' : 'bg-slate-100 text-sky-600 border-slate-200'}`}>
                          {result.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                         <span className="text-[10px] font-bold text-slate-500 font-mono break-all">{result.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <code className={`text-[10px] font-mono p-2 rounded-xl border block break-all whitespace-pre-wrap ${isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                          {result.value}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-600 flex items-center justify-center gap-1.5"><Clock size={10}/> {result.ttl}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={mode === 'bulk' ? 5 : 4} className="px-6 py-32 text-center">
                      {isProcessing ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 className="animate-spin text-sky-500" size={32} />
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 animate-pulse">Scanning Global DNS Matrix...</p>
                        </div>
                      ) : error ? (
                        <div className="text-rose-500 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-3">
                           <XCircle size={40} className="opacity-50" />
                           {error}
                        </div>
                      ) : (
                        <div className="text-slate-700 font-black uppercase tracking-widest text-[10px] opacity-40 flex flex-col items-center gap-4">
                           <Network size={64} strokeWidth={1} />
                           Resolution Matrix Awaiting Configuration
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <footer className={`mt-auto pt-8 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro Lab • DNS Cluster v4.2</p>
        <div className="flex gap-4">
          <a href="https://dns.google/" target="_blank" className="hover:text-sky-400">Recursive Engine</a>
          <span className="opacity-30">|</span>
          <a href="#" className="hover:text-sky-400">API Documentation</a>
        </div>
      </footer>
    </div>
  );
};

export default DnsLookupTool;
