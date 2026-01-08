import React, { useState, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  ShieldAlert, 
  Loader2, 
  Trash2, 
  Zap, 
  Search, 
  Copy, 
  Check, 
  Download, 
  Info, 
  Globe, 
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
  Filter,
  X
} from 'lucide-react';
import { SpamCopResult, DnsResponse } from '../types';
import { useNotify } from '../App';

interface SpamCopToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const SpamCopTool: React.FC<SpamCopToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<SpamCopResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [resolver, setResolver] = useState<'google' | 'cloudflare'>('google');
  const [progress, setProgress] = useState(0);

  const handleProcess = async () => {
    const rawIps = input.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    const uniqueIps: string[] = Array.from(new Set<string>(rawIps)).slice(0, 500);

    if (uniqueIps.length === 0) {
      notify('warning', 'Please provide at least one valid IPv4 address.');
      return;
    }

    setResults(uniqueIps.map((ip, i) => ({
      id: i + 1,
      ip,
      dnsbl: 'bl.spamcop.net',
      status: 'pending',
      returnCode: '—',
      meaning: 'Waiting...',
      ttl: 0
    })));

    setIsProcessing(true);
    setProgress(0);
    notify('info', `Engaging SpamCop check for ${uniqueIps.length} IPs...`);

    const resolverUrl = resolver === 'google' ? 'https://dns.google/resolve' : 'https://cloudflare-dns.com/dns-query';

    for (let i = 0; i < uniqueIps.length; i++) {
      const ip = uniqueIps[i];
      
      setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'loading' } : r));

      // IPv4 Reversal logic
      const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
      if (!ipv4Regex.test(ip)) {
        setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'invalid', meaning: 'Invalid IPv4 Format' } : r));
        setProgress(Math.round(((i + 1) / uniqueIps.length) * 100));
        continue;
      }

      const reversed = ip.split('.').reverse().join('.');
      const queryName = `${reversed}.bl.spamcop.net`;

      try {
        const url = `${resolverUrl}?name=${queryName}&type=A`;
        const res = await fetch(url, {
          headers: resolver === 'cloudflare' ? { 'accept': 'application/dns-json' } : {}
        });
        const data: DnsResponse = await res.json();

        if (data.Status === 0 && data.Answer) {
          const answer = data.Answer[0];
          const code = answer.data;
          setResults(prev => prev.map(r => r.ip === ip ? { 
            ...r, 
            status: 'listed', 
            returnCode: code, 
            meaning: code === '127.0.0.2' ? 'Spam source detected' : 'Listed (Other)',
            ttl: answer.TTL
          } : r));
        } else if (data.Status === 3) {
          // NXDOMAIN means clean
          setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'clean', returnCode: 'NX', meaning: 'Not Listed' } : r));
        } else {
          setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'error', meaning: 'DNS Resolver Error' } : r));
        }
      } catch (err) {
        setResults(prev => prev.map(r => r.ip === ip ? { ...r, status: 'error', meaning: 'Connection Failure' } : r));
      }

      setProgress(Math.round(((i + 1) / uniqueIps.length) * 100));
      // Respect public DNS rate limits
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setIsProcessing(false);
    notify('success', 'SpamCop check complete.');
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csv = [
      ['No', 'IP Address', 'DNSBL', 'Status', 'Code', 'Meaning', 'TTL'],
      ...results.map(r => [r.id, r.ip, r.dnsbl, r.status, r.returnCode, r.meaning, r.ttl])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spamcop_audit_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    notify('success', 'Results exported to CSV.');
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      r.ip.includes(q) || 
      r.status.includes(q) ||
      r.returnCode.includes(q) ||
      r.meaning.toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  const stats = useMemo(() => ({
    listed: results.filter(r => r.status === 'listed').length,
    clean: results.filter(r => r.status === 'clean').length
  }), [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-[2rem] shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-xl shadow-orange-600/20">
              <ShieldAlert size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-orange-500">SpamCop Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk IPv4 reputation checker</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className={`lg:col-span-8 p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-5 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Globe size={14} className="text-orange-400" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Target IP List</h3>
            </div>
            <div className="flex p-1 rounded-xl bg-slate-950/50 border border-slate-800">
               <button onClick={() => setResolver('google')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${resolver === 'google' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}>Google</button>
               <button onClick={() => setResolver('cloudflare')} className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${resolver === 'cloudflare' ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'text-slate-500 hover:text-slate-300'}`}>Cloudflare</button>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="8.8.8.8&#10;1.2.3.4, 10.20.30.40"
              className={`w-full h-56 p-6 border rounded-[2rem] outline-none font-mono text-sm resize-none transition-all custom-scrollbar ${inputClasses}`}
            />
            {input.length > 0 && (
              <button onClick={() => setInput('')} className="absolute top-4 right-4 p-2 bg-slate-950/50 text-slate-500 hover:text-rose-400 rounded-xl transition-colors">
                <Trash2 size={14} />
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
            <div className="flex gap-4">
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Speed</span>
                 <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Fast sequential check</span>
              </div>
              <div className="flex flex-col">
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Protocol</span>
                 <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>DNS Search</span>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {results.length > 0 && (
                <button onClick={handleExport} className="flex-1 sm:flex-none px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-slate-700 flex items-center justify-center gap-2">
                   <Download size={14} /> CSV
                </button>
              )}
              <button
                onClick={handleProcess}
                disabled={isProcessing || !input.trim()}
                className="flex-[2] sm:flex-none px-12 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
              >
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Checking...</> : <><Zap size={16} /> Run Checker</>}
              </button>
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-end">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-widest">Progress {progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-orange-600 transition-all duration-300 shadow-[0_0_10px_rgba(234,88,12,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Learning Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
            <div className="flex items-center gap-3">
               <BookOpen size={18} className="text-orange-500" />
               <h3 className="text-sm font-black uppercase tracking-widest">Info Panel</h3>
            </div>
            
            <div className="space-y-6">
              <EduItem 
                title="What is SpamCop?" 
                text="SpamCop is a service used to identify and report spam. Their blacklist (DNSBL) helps mail servers filter out bad mail." 
              />
              <EduItem 
                title="127.0.0.2 Meaning" 
                text="If this code appears, it means the IP is currently listed as a source of spam." 
              />
              <EduItem 
                title="Auto Delisting" 
                text="Most SpamCop listings expire within 24-48 hours if the spam stops." 
              />
            </div>

            <a 
              href="https://www.spamcop.net/fsl.shtml" 
              target="_blank" 
              className="mt-4 group flex items-center justify-between p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 hover:bg-orange-500/10 transition-all"
            >
              <div className="flex flex-col gap-1">
                 <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Delisting Help</span>
                 <span className="text-[8px] font-bold text-slate-500 uppercase">External Site</span>
              </div>
              <ExternalLink size={14} className="text-orange-500 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>

          {results.length > 0 && !isProcessing && (
            <div className={`p-8 rounded-[2.5rem] shadow-xl border grid grid-cols-2 gap-4 ${cardClasses}`}>
               <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Listed</span>
                  <span className="text-2xl font-black text-rose-500">{stats.listed}</span>
               </div>
               <div className="flex flex-col gap-1 text-right">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Clean</span>
                  <span className="text-2xl font-black text-emerald-500">{stats.clean}</span>
               </div>
            </div>
          )}
        </div>
      </div>

      {results.length > 0 && (
        <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden ${cardClasses}`}>
          <div className={`p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
            <div className="flex items-center gap-3">
               <Filter size={14} className="text-orange-500" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Check Results</h2>
            </div>
            
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search IPs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-xs font-bold transition-all ${inputClasses}`}
              />
            </div>
            
            <button onClick={() => setResults([])} className="p-3 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-2xl border border-rose-500/20 transition-all">
              <X size={18}/>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-[0.25em] text-slate-500`}>
                  <th className="px-8 py-5 w-16 text-center">No</th>
                  <th className="px-8 py-5">IP Address</th>
                  <th className="px-8 py-5">Node</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5 text-center">Code</th>
                  <th className="px-8 py-5">Meaning</th>
                  <th className="px-8 py-5 text-center">TTL</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-orange-500/5 transition-colors group">
                    <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className={`px-8 py-5 font-mono text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.ip}</td>
                    <td className="px-8 py-5 text-[10px] text-slate-500 font-black uppercase tracking-widest">{r.dnsbl}</td>
                    <td className="px-8 py-5 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-8 py-5 text-center font-mono text-[10px] font-black text-slate-500">{r.returnCode}</td>
                    <td className="px-8 py-5">
                       <span className={`text-[10px] font-black uppercase tracking-widest ${r.status === 'listed' ? 'text-rose-500/80' : 'text-slate-500'}`}>
                         {r.meaning}
                       </span>
                    </td>
                    <td className="px-8 py-5 text-center text-[10px] font-mono font-bold text-slate-600">{r.ttl > 0 ? r.ttl : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredResults.length === 0 && results.length > 0 && (
            <div className="py-20 text-center flex flex-col items-center gap-3 opacity-30">
               <HelpCircle size={40} />
               <p className="text-[10px] font-black uppercase tracking-[0.2em]">No matches found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const EduItem = ({ title, text }: { title: string, text: string }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500/70">{title}</p>
    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{text}</p>
  </div>
);

const StatusBadge: React.FC<{ status: SpamCopResult['status'] }> = ({ status }) => {
  const styles = {
    listed: 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-[0_0_8px_rgba(244,63,94,0.1)]',
    clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    error: 'bg-slate-800 text-slate-500 border-slate-700',
    invalid: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    pending: 'bg-slate-950 text-slate-700 border-slate-900'
  };
  const labels = {
    listed: 'LISTED',
    clean: 'CLEAN',
    loading: 'WAIT',
    error: 'ERROR',
    invalid: 'INVALID',
    pending: 'QUEUED'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default SpamCopTool;