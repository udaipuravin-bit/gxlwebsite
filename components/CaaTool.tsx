
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
  ExternalLink
} from 'lucide-react';
import { CaaResult } from '../types';
import { lookupCaaRecords } from '../services/dnsService';

// Added theme to CaaToolProps interface
interface CaaToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

// Updated component to accept theme and handle conditional styles
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
      setError('Unable to fetch CAA records. Please verify the domain and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clear = () => {
    setDomainInput('');
    setResult(null);
    setError(null);
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
            <div className="bg-teal-500 p-2.5 rounded-xl text-white shadow-lg shadow-teal-500/20">
              <FileCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">CAA Record Checker</h1>
              <p className="text-slate-400 text-xs md:text-sm">Certificate Authority Authorization Policy</p>
            </div>
          </div>
        </div>
        {result && (
          <button onClick={clear} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-bold transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Input Card */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className={`p-6 rounded-2xl shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
            <div>
              <label className="block text-sm font-semibold mb-2">Check Domain</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-700" size={16} />
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                  placeholder="e.g. apple.com"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all font-medium placeholder:text-slate-400 ${inputClasses}`}
                />
              </div>
            </div>

            <button
              onClick={handleLookup}
              disabled={isLoading || !domainInput}
              className="w-full flex items-center justify-center gap-2 py-4 bg-teal-600 hover:bg-teal-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-teal-500/10 font-bold"
            >
              {isLoading ? (
                <><Loader2 className="animate-spin" size={20} /> Querying DNS...</>
              ) : (
                <><Play size={20} /> Run Audit</>
              )}
            </button>

            <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
              <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 flex items-center gap-1.5">
                <Info size={12}/> Security Note
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                If no CAA records exist, any Certificate Authority is technically allowed to issue a certificate for your domain.
              </p>
            </div>
          </div>
        </div>

        {/* Results Area */}
        <div className="lg:col-span-3">
          {isLoading ? (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-dashed ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
               <Loader2 className="animate-spin text-teal-500 mb-4" size={48} />
               <p className="text-slate-400 font-medium animate-pulse">Scanning DNS for CAA records...</p>
            </div>
          ) : error ? (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border px-8 text-center ${isDark ? 'bg-slate-900/50 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
               <AlertTriangle className="text-rose-500 mb-4" size={48} />
               <h3 className="text-xl font-bold mb-2">Lookup Failed</h3>
               <p className="text-slate-500 text-sm max-w-sm">{error}</p>
            </div>
          ) : result ? (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
              {/* Posture Card */}
              <div className={`p-6 rounded-3xl border flex items-center justify-between shadow-xl ${
                result.status === 'secure' 
                  ? 'bg-teal-500/10 border-teal-500/20' 
                  : 'bg-amber-500/10 border-amber-500/20'
              }`}>
                <div className="flex items-center gap-4">
                   <div className={`p-3 rounded-2xl ${
                     result.status === 'secure' ? 'bg-teal-500/20 text-teal-400' : 'bg-amber-500/20 text-amber-400'
                   }`}>
                     {result.status === 'secure' ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                   </div>
                   <div>
                     <h2 className="text-xl font-bold">
                       {result.status === 'secure' ? 'Policy Restricted' : 'Global Access'}
                     </h2>
                     <p className="text-slate-400 text-sm">
                       {result.status === 'secure' 
                         ? `Only specific authorities can issue certificates for ${result.domain}.` 
                         : `All certificate authorities are allowed to issue for ${result.domain}.`}
                     </p>
                   </div>
                </div>
                <div className="hidden md:block">
                   <span className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest ${
                     result.status === 'secure' ? 'bg-teal-500 text-white' : 'bg-amber-500 text-white'
                   }`}>
                     {result.status === 'secure' ? 'Controlled' : 'Standard'}
                   </span>
                </div>
              </div>

              {/* Table Card */}
              <div className={`rounded-3xl border shadow-xl overflow-hidden ${cardClasses}`}>
                <table className="w-full text-left">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'} border-b`}>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest w-20 text-center">Flag</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest w-32">Tag</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Authorized CA / Value</th>
                      <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-widest">Impact</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {result.records.length > 0 ? (
                      result.records.map((rec, idx) => (
                        <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                          <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded font-mono text-xs ${
                              rec.flag === 128 ? 'bg-rose-500/10 text-rose-500 font-bold' : 'bg-slate-800 text-slate-400'
                            }`} title={rec.flag === 128 ? 'Critical: CAs must understand this tag to issue' : 'Standard'}>
                              {rec.flag}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm font-bold uppercase tracking-tighter">
                              {rec.tag}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <code className="text-[11px] font-mono text-teal-400 font-bold">
                              {rec.value}
                            </code>
                          </td>
                          <td className="px-6 py-4">
                            <p className="text-xs text-slate-400">
                              {rec.description}
                            </p>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                           <div className="flex flex-col items-center gap-2 text-slate-600">
                             <HelpCircle size={32} strokeWidth={1} />
                             <p className="text-sm font-medium italic">No CAA records found for {result.domain}.</p>
                             <p className="text-[10px] uppercase font-black tracking-widest opacity-50">RFC 6844 behavior: Implicit allow all</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tag Glossary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { tag: 'issue', desc: 'Grants authority to issue any type of certificate.' },
                  { tag: 'issuewild', desc: 'Specific authority for wildcard (*.domain) certs.' },
                  { tag: 'iodef', desc: 'Incident reporting URI for CA policy violations.' }
                ].map((item) => (
                  <div key={item.tag} className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{item.tag}</p>
                    <p className="text-xs text-slate-400 leading-snug">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className={`h-full min-h-[400px] flex flex-col items-center justify-center rounded-3xl border border-dashed text-slate-700 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
               <FileCheck size={64} strokeWidth={1} className="mb-4" />
               <p className="text-sm font-medium">Analyze domain certificate authority policy</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-auto pt-8 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro • CAA Audit Engine</p>
        <div className="flex gap-4">
          <a href="https://dns.google/" target="_blank" className="hover:text-slate-400 inline-flex items-center gap-1">Google DNS API <ExternalLink size={10}/></a>
          <a href="#" className="hover:text-slate-400">Policy Guide</a>
        </div>
      </footer>
    </div>
  );
};

export default CaaTool;
