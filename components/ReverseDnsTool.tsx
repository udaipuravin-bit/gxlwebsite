
import React, { useState } from 'react';
import { 
  Search, 
  Trash2, 
  Play, 
  Hash, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Server,
  Info,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { PtrResult } from '../types';
import { lookupPtrRecord } from '../services/dnsService';

// Added theme to ReverseDnsToolProps interface
interface ReverseDnsToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

// Updated component to accept theme and handle conditional styles
const ReverseDnsTool: React.FC<ReverseDnsToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [ipInput, setIpInput] = useState('');
  const [results, setResults] = useState<PtrResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const validateIp = (ip: string) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i; // Basic IPv6 regex
    return ipv4Regex.test(ip) || ip.includes(':'); // Broad IPv6 check for the tool
  };

  const handleLookup = async () => {
    const ipList = Array.from(new Set(
      ipInput
        .split(/[\n,]/)
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0)
    ));

    if (ipList.length === 0) return;

    const initialResults: PtrResult[] = ipList.map(ip => ({
      ip,
      hostname: '',
      status: validateIp(ip) ? 'pending' : 'invalid'
    }));

    setResults(initialResults);
    setIsProcessing(true);

    for (let i = 0; i < initialResults.length; i++) {
      const current = initialResults[i];
      if (current.status === 'invalid') continue;

      setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'loading' } : r));

      try {
        const hostname = await lookupPtrRecord(current.ip);
        setResults(prev => prev.map((r, idx) => idx === i ? { 
          ...r, 
          hostname: hostname || 'No PTR record found', 
          status: hostname ? 'success' : 'not_found' 
        } : r));
      } catch (err) {
        setResults(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'error' } : r));
      }
    }

    setIsProcessing(false);
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const clear = () => {
    setIpInput('');
    setResults([]);
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
            <div className="bg-blue-500 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/20">
              <Hash size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight">Reverse DNS (PTR) Lookup</h1>
              <p className="text-slate-400 text-xs md:text-sm">Identify Hostnames from IP Addresses</p>
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
              <label className="block text-sm font-semibold mb-2">IP Addresses</label>
              <textarea
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="8.8.8.8&#10;1.1.1.1, 2001:4860:4860::8888"
                className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm resize-none placeholder:text-slate-400 ${inputClasses}`}
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isProcessing || !ipInput.trim()}
              className="w-full flex items-center justify-center gap-2 py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-lg shadow-blue-500/10 font-bold"
            >
              {isProcessing ? (
                <><Loader2 className="animate-spin" size={20} /> Resolving...</>
              ) : (
                <><Play size={20} /> Run Lookup</>
              )}
            </button>
          </div>

          <div className={`p-4 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800/50' : 'bg-slate-50 border-slate-100'}`}>
            <h4 className="text-[10px] uppercase font-black text-slate-500 tracking-widest mb-3 flex items-center gap-1.5">
              <Info size={12}/> PTR Resolution
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Reverse DNS lookup is used to determine the domain name associated with an IP address. It's often required for SMTP servers to prevent spam.
            </p>
          </div>
        </div>

        {/* Results Pane */}
        <div className="lg:col-span-3 flex flex-col gap-4">
          <div className={`rounded-2xl shadow-xl border overflow-hidden ${cardClasses}`}>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'} border-b`}>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">IP Address</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Resolved Hostname</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest w-16 text-center">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {results.length > 0 ? (
                  results.map((res, idx) => (
                    <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                      <td className="px-6 py-4">
                        <code className="text-sm font-bold font-mono">{res.ip}</code>
                      </td>
                      <td className="px-6 py-4">
                        {res.status === 'success' ? (
                          <span className="text-sm font-semibold text-blue-400 break-all">{res.hostname}</span>
                        ) : res.status === 'not_found' ? (
                          <span className="text-sm text-slate-600 italic">No PTR record found</span>
                        ) : res.status === 'invalid' ? (
                          <span className="text-sm text-rose-500/70 font-bold">Invalid IP Format</span>
                        ) : res.status === 'loading' ? (
                          <span className="flex items-center gap-2 text-xs text-slate-500 italic">
                            <Loader2 className="animate-spin" size={12} /> Resolving...
                          </span>
                        ) : (
                          <span className="text-sm text-slate-700">Ready</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={res.status} />
                      </td>
                      <td className="px-6 py-4 text-center">
                        {res.status === 'success' && (
                          <button 
                            onClick={() => copyToClipboard(res.hostname, idx)}
                            className="p-1.5 text-slate-500 hover:text-white transition-colors"
                            title="Copy Hostname"
                          >
                            {copiedIndex === idx ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} />}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-4 text-slate-700">
                        <Server size={48} strokeWidth={1} />
                        <p className="text-sm font-medium">Enter IP addresses to begin resolution</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className={`mt-auto pt-8 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>&copy; {new Date().getFullYear()} Authenticator Pro • Reverse DNS Engine</p>
        <div className="flex gap-4">
          <a href="https://dns.google/" target="_blank" className="hover:text-slate-400">Google DNS</a>
          <a href="#" className="hover:text-slate-400">Terms of Use</a>
        </div>
      </footer>
    </div>
  );
};

const StatusBadge: React.FC<{ status: PtrResult['status'] }> = ({ status }) => {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={10} /> Success
        </span>
      );
    case 'loading':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <Loader2 size={10} className="animate-spin" /> Query
        </span>
      );
    case 'not_found':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-800 text-slate-500 border border-slate-700">
          <XCircle size={10} /> None
        </span>
      );
    case 'invalid':
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-rose-500/10 text-rose-500 border border-rose-500/20">
          <AlertTriangle size={10} /> Invalid
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-slate-900 text-slate-700 border border-slate-800">
          <Clock size={10} /> Wait
        </span>
      );
  }
};

export default ReverseDnsTool;
