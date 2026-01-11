import React, { useState } from 'react';
import { 
  Trash2, 
  Hash, 
  ArrowLeft,
  Loader2,
  Zap
} from 'lucide-react';
import { PtrResult } from '../types';
import { lookupPtrRecord } from '../services/dnsService';

interface ReverseDnsToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const ReverseDnsTool: React.FC<ReverseDnsToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [ipInput, setIpInput] = useState('');
  const [results, setResults] = useState<PtrResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const validateIp = (ip: string) => {
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    return ipv4Regex.test(ip) || ip.includes(':');
  };

  const handleLookup = async () => {
    const ipList: string[] = Array.from(new Set<string>(
      ipInput
        .split(/[\n,]/)
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0)
    ));

    if (ipList.length === 0) return;

    const initialResults: PtrResult[] = ipList.map(ip => ({
      ip,
      hostname: '',
      status: validateIp(ip as string) ? 'pending' : 'invalid'
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

  const clear = () => {
    setIpInput('');
    setResults([]);
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-violet-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-violet-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl shadow-xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onBack}
            className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-violet-500 p-2.5 rounded-xl text-white shadow-lg">
              <Hash size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-violet-400 uppercase">PTR Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Host Resolution Matrix</p>
            </div>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={clear} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-sm font-bold transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-6 rounded-3xl shadow-xl border flex flex-col gap-4 ${cardClasses}`}>
            <div>
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 block">Target IP Node List</label>
              <textarea
                value={ipInput}
                onChange={(e) => setIpInput(e.target.value)}
                placeholder="8.8.8.8&#10;1.1.1.1"
                className={`w-full h-48 p-4 rounded-xl focus:ring-2 focus:ring-violet-500 outline-none transition-all font-mono text-sm resize-none ${inputClasses}`}
              />
            </div>
            <button
              onClick={handleLookup}
              disabled={isProcessing || !ipInput.trim()}
              className="w-full flex items-center justify-center gap-3 py-4 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-2xl transition-all shadow-lg font-black uppercase text-[10px] tracking-widest"
            >
              {isProcessing ? <><Loader2 className="animate-spin" size={16} /> Auditing...</> : <><Zap size={16} /> Run Logic Trace</>}
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 flex flex-col gap-4 animate-in slide-in-from-right-4 duration-500">
          <div className={`rounded-3xl border shadow-2xl overflow-hidden min-h-[400px] flex flex-col ${cardClasses}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    <th className="px-6 py-4 w-32">IP Node</th>
                    <th className="px-6 py-4">Resolved Hostname</th>
                    <th className="px-6 py-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                  {results.length > 0 ? results.map((res, idx) => (
                    <tr key={idx} className="hover:bg-violet-500/5 transition-colors group">
                      <td className={`px-6 py-5 font-mono text-xs font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{res.ip}</td>
                      <td className="px-6 py-5">
                        {res.status === 'loading' ? (
                          <span className="flex items-center gap-2 text-xs text-slate-500 animate-pulse font-bold uppercase tracking-widest"><Loader2 size={12} className="animate-spin" /> Resolving Node...</span>
                        ) : (
                          <span className={`text-sm font-black tracking-tight ${res.status === 'success' ? 'text-violet-400' : 'text-slate-500'}`}>{res.hostname || '—'}</span>
                        )}
                      </td>
                      <td className="px-6 py-5 text-center"><StatusBadge status={res.status} /></td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-6 py-24 text-center text-slate-500 uppercase font-black text-xs tracking-widest opacity-20">No Data Analyzed</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatusBadge: React.FC<{ status: PtrResult['status'] }> = ({ status }) => {
  const styles = {
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    not_found: 'bg-slate-800 text-slate-500 border-slate-700',
    invalid: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    error: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-900 text-slate-700 border-slate-800'
  };
  return (
    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${styles[status]}`}>
      {status === 'success' ? 'VALID' : status}
    </span>
  );
};

export default ReverseDnsTool;