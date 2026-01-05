
import React, { useState } from 'react';
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
  XCircle
} from 'lucide-react';
import { DnsLookupEntry } from '../types';
import { lookupRecordByType } from '../services/dnsService';

interface DnsLookupToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const RECORD_TYPES = ['A', 'AAAA', 'MX', 'TXT', 'NS', 'CNAME', 'SOA'];

const DnsLookupTool: React.FC<DnsLookupToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainInput, setDomainInput] = useState('');
  const [results, setResults] = useState<DnsLookupEntry[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const cleanDomain = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    if (!cleanDomain) return;
    setIsProcessing(true);
    setError(null);
    setResults([]);
    try {
      const promises = RECORD_TYPES.map(type => lookupRecordByType(cleanDomain, type));
      const allResults = await Promise.all(promises);
      const flattened = allResults.flat();
      if (flattened.length === 0) setError('No records found for this domain.');
      setResults(flattened);
    } catch (err) {
      setError('An error occurred during lookup. Please check the domain.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const csvContent = [['Record Type', 'Name', 'Value', 'TTL'], ...results.map(r => [r.type, r.name, r.value, r.ttl])].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `dns_lookup_${domainInput}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-2xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-sky-500 p-2.5 rounded-xl text-white shadow-lg">
              <Network size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase">Deep DNS Lookup</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Global Recursive Resolution</p>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {results.length > 0 && (
            <button onClick={handleExport} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-xs border uppercase tracking-widest ${isDark ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>
              <Download size={16} /> Export
            </button>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`lg:col-span-1 p-6 rounded-2xl shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Target Domain</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="e.g. google.com"
                className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-sky-500 outline-none transition-all font-bold text-sm ${inputClasses}`}
              />
            </div>
          </div>
          <button
            onClick={handleLookup}
            disabled={isProcessing || !domainInput.trim()}
            className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg"
          >
            {isProcessing ? 'Resolving...' : 'Check All Records'}
          </button>
          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 flex items-center gap-1.5"><Info size={12}/> Supported Records</h4>
            <div className="flex flex-wrap gap-2">
              {RECORD_TYPES.map(t => <span key={t} className="px-2 py-1 rounded text-[9px] font-black bg-slate-800 text-slate-400 border border-slate-700">{t}</span>)}
            </div>
          </div>
        </div>

        <div className={`lg:col-span-3 rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  <th className="px-6 py-4 w-24">Type</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Value / Data</th>
                  <th className="px-6 py-4 w-20 text-center">TTL</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {results.length > 0 ? (
                  results.map((result, idx) => (
                    <tr key={idx} className="hover:bg-sky-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <span className={`text-[9px] font-black px-2 py-1 rounded border uppercase tracking-widest ${isDark ? 'bg-slate-800 text-sky-400 border-sky-500/20' : 'bg-slate-100 text-sky-600 border-slate-200'}`}>
                          {result.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500 font-mono">{result.name}</td>
                      <td className="px-6 py-4">
                        <code className={`text-[10px] font-mono p-2 rounded border block break-all whitespace-pre-wrap ${isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-100 text-slate-800'}`}>
                          {result.value}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-[10px] font-black text-slate-600 flex items-center justify-center gap-1"><Clock size={10}/> {result.ttl}</span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      {isProcessing ? <Loader2 className="animate-spin text-sky-500 mx-auto" /> : 
                      error ? <div className="text-rose-500 font-black uppercase tracking-widest text-xs flex flex-col items-center gap-2"><XCircle size={32}/> {error}</div> :
                      <div className="text-slate-700 font-black uppercase tracking-widest text-[10px] opacity-40 flex flex-col items-center gap-2"><Network size={48} strokeWidth={1}/> Resolution Matrix Awaiting Input</div>}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsLookupTool;
