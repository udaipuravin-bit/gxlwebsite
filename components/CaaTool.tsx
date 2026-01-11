import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  FileCheck, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Info,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
  ExternalLink,
  Zap,
  // Added Globe import to fix "Cannot find name 'Globe'" error on line 164
  Globe
} from 'lucide-react';
import { CaaResult } from '../types';
import { lookupCaaRecords } from '../services/dnsService';

interface CaaToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const CaaTool: React.FC<CaaToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [domainInput, setDomainInput] = useState('');
  const [result, setResult] = useState<CaaResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLookup = async () => {
    const cleanDomain = domainInput.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
    if (!cleanDomain) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const records = await lookupCaaRecords(cleanDomain);
      setResult({
        domain: cleanDomain,
        records,
        status: records.length > 0 ? 'secure' : 'open'
      });
    } catch (err) {
      setError('Unable to fetch records. Please verify the domain.');
    } finally {
      setIsLoading(false);
    }
  };

  const cardClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-slate-950 border-slate-800 text-slate-200 focus:border-teal-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-teal-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-all ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg">
              <FileCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-teal-400 uppercase">CAA Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Certificate Authority Logic Node</p>
            </div>
          </div>
        </div>
        {result && (
          <button onClick={() => { setResult(null); setDomainInput(''); }} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={14} /> Clear Result
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
            <div>
              <label className={`block text-[10px] font-black uppercase tracking-widest mb-3 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>Check Domain</label>
              <input
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="e.g. apple.com"
                className={`w-full p-4 rounded-2xl outline-none font-bold text-sm transition-all border ${inputClasses}`}
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isLoading || !domainInput.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg font-black uppercase text-[10px] tracking-widest"
            >
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} 
              {isLoading ? 'Scanning Matrix...' : 'Run Audit'}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
          <div className={`rounded-[2rem] border shadow-2xl overflow-hidden min-h-[400px] flex flex-col ${cardClasses}`}>
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex items-center gap-3">
                 <ShieldCheck size={16} className="text-teal-400" />
                 <h2 className="text-[10px] font-black uppercase tracking-widest">Authorized Issuers Matrix</h2>
              </div>
              {result && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${result.records.length > 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
                  {result.records.length > 0 ? 'RESTRICTED' : 'OPEN'}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-auto custom-scrollbar">
              {isLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-24">
                  <Loader2 className="animate-spin text-teal-500" size={32} />
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 animate-pulse">Querying DNS Records...</p>
                </div>
              ) : result && result.records.length > 0 ? (
                <table className="w-full text-left">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-950/80 text-slate-400' : 'bg-slate-100 text-slate-500'} border-b border-slate-800/50 text-[10px] font-black uppercase tracking-widest`}>
                      <th className="px-8 py-4 w-24">Flag</th>
                      <th className="px-8 py-4 w-32">Tag</th>
                      <th className="px-8 py-4">Authorized CA</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                    {result.records.map((rec, idx) => (
                      <tr key={idx} className="hover:bg-teal-500/5 transition-colors">
                        <td className="px-8 py-5">
                          <code className={`px-2 py-1 rounded bg-slate-950/50 border border-slate-800 text-[10px] font-mono font-bold ${isDark ? 'text-teal-400' : 'text-teal-700'}`}>
                            {rec.flag}
                          </code>
                        </td>
                        <td className="px-8 py-5">
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{rec.tag}</span>
                        </td>
                        <td className="px-8 py-5">
                          <span className={`text-sm font-black tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{rec.value}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : result && result.records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-24 px-12 text-center gap-4 opacity-50">
                  <ShieldAlert size={48} className="text-amber-500" />
                  <div className="space-y-1">
                    <p className="text-xs font-black uppercase tracking-widest text-white">No CAA Records Identified</p>
                    <p className="text-[10px] font-bold text-slate-500 max-w-sm">Any Certificate Authority is currently allowed to issue certificates for this domain.</p>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center py-24 opacity-20">
                  <Globe size={64} strokeWidth={1} />
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mt-4">Awaiting Domain Analysis</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className={`shrink-0 pt-6 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Email Sparks Intelligence Node</p>
      </footer>
    </div>
  );
};

export default CaaTool;