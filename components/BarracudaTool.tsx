import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Trash2, 
  Search, 
  Zap, 
  Loader2, 
  Globe, 
  ExternalLink, 
  HelpCircle,
  BookOpen,
  Filter,
  X,
  Fish,
  ShieldCheck,
  AlertTriangle,
  Info,
  Terminal,
  Download,
  Copy,
  Check,
  ShieldAlert,
  Database,
  SearchCheck,
  Wifi,
  Activity,
  Cpu
} from 'lucide-react';
import { BarracudaResult, DnsResponse } from '../types';
import { useNotify } from '../App';

interface BarracudaToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const BARRACUDA_WEB_URL = 'https://www.barracudacentral.org/lookups/lookup-reputation';

const BarracudaTool: React.FC<BarracudaToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [input, setInput] = useState('');
  const [results, setResults] = useState<BarracudaResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [progress, setProgress] = useState(0);

  /**
   * Engine 1: BRBL (IP Reputation Zone)
   * Target: <reversed-ip>.b.barracudacentral.org
   */
  const checkIpViaDnsbl = async (ip: string): Promise<{ listed: boolean; message: string }> => {
    try {
      const reversed = ip.split('.').reverse().join('.');
      const query = `${reversed}.b.barracudacentral.org`;
      const res = await fetch(`https://dns.google/resolve?name=${query}&type=A`);
      const data: DnsResponse = await res.json();
      
      if (data.Status === 0 && data.Answer) {
        return { 
          listed: true, 
          message: 'IP listed as "poor" on Barracuda BRBL.' 
        };
      }
      return { 
        listed: false, 
        message: 'IP is clean. No listing found.' 
      };
    } catch (e) {
      throw new Error('Node Unreachable');
    }
  };

  /**
   * Engine 2: IBL (Domain Intent Zone)
   * Target: <domain>.dbl.barracudacentral.org
   */
  const checkDomainViaDnsbl = async (domain: string): Promise<{ listed: boolean; message: string }> => {
    try {
      const query = `${domain}.dbl.barracudacentral.org`;
      const res = await fetch(`https://dns.google/resolve?name=${query}&type=A`);
      const data: DnsResponse = await res.json();
      
      if (data.Status === 0 && data.Answer) {
        return { 
          listed: true, 
          message: 'Domain listed as "poor" on Barracuda IBL.' 
        };
      }
      return { 
        listed: false, 
        message: 'Domain is clean. No listing found.' 
      };
    } catch (e) {
      throw new Error('Node Unreachable');
    }
  };

  const handleAudit = async () => {
    const rawItems = input.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    const uniqueItems: string[] = Array.from(new Set<string>(rawItems)).slice(0, 100);

    if (uniqueItems.length === 0) {
      notify('warning', 'Input required: Please provide IPs or domains.');
      return;
    }

    setResults(uniqueItems.map((item, i) => ({
      id: i + 1,
      input: item,
      type: /^(\d{1,3}\.){3}\d{1,3}$/.test(item) ? 'ip' : 'domain',
      status: 'pending',
      message: 'Checking...',
      categories: []
    })));

    setIsProcessing(true);
    setProgress(0);
    notify('info', 'Starting Barracuda status check...');

    for (let i = 0; i < uniqueItems.length; i++) {
      const item = uniqueItems[i];
      const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(item);
      
      setResults(prev => prev.map(r => r.input === item ? { ...r, status: 'loading' } : r));

      try {
        const auditResult = isIp ? await checkIpViaDnsbl(item) : await checkDomainViaDnsbl(item);
        
        setResults(prev => prev.map(r => r.input === item ? { 
          ...r, 
          status: auditResult.listed ? 'listed' : 'clean', 
          message: auditResult.message,
          categories: auditResult.listed ? (isIp ? ['spam-source'] : ['intent-block']) : []
        } : r));

      } catch (err) {
        setResults(prev => prev.map(r => r.input === item ? { ...r, status: 'error', message: 'Check Failed' } : r));
      }

      setProgress(Math.round(((i + 1) / uniqueItems.length) * 100));
      // Minimal delay needed for DNS over HTTPS
      await new Promise(resolve => setTimeout(resolve, 30));
    }

    setIsProcessing(false);
    notify('success', 'Check complete.');
  };

  const handleExport = () => {
    if (results.length === 0) return;
    const csv = [
      ['No', 'Identifier', 'Type', 'Status', 'Verdict'],
      ...results.map(r => [r.id, r.input, r.type, r.status, r.message])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barracuda_check_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredResults = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return results.filter(r => 
      r.input.toLowerCase().includes(q) || 
      r.status.includes(q) ||
      r.message.toLowerCase().includes(q)
    );
  }, [results, searchQuery]);

  const stats = useMemo(() => ({
    listed: results.filter(r => r.status === 'listed').length,
    clean: results.filter(r => r.status === 'clean').length
  }), [results]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-blue-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-600';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-[2rem] shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-2xl text-white shadow-xl shadow-blue-600/20">
              <Fish size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-blue-500">Barracuda Checker</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Bulk status check for IPs and Domains</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Panel */}
        <div className={`lg:col-span-8 p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-5 ${cardClasses}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
               <Globe size={14} className="text-blue-400" />
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Input List</h3>
            </div>
          </div>
          
          <div className="relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste IPs or Domains here..."
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
                 <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Type</span>
                 <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>IP or Domain</span>
              </div>
            </div>

            <div className="flex gap-3 w-full sm:w-auto">
              {results.length > 0 && (
                <button onClick={handleExport} className="flex-1 sm:flex-none px-6 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all border border-slate-700 flex items-center justify-center gap-2">
                   <Download size={14} /> CSV
                </button>
              )}
              <button
                onClick={handleAudit}
                disabled={isProcessing || !input.trim()}
                className="flex-[2] sm:flex-none px-12 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
              >
                {isProcessing ? <><Loader2 size={16} className="animate-spin" /> Checking...</> : <><Zap size={16} /> Run Checker</>}
              </button>
            </div>
          </div>

          {isProcessing && (
            <div className="mt-4 space-y-2">
              <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 shadow-[0_0_10px_rgba(37,99,235,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Technical Sidebar */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          <div className={`p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
            <div className="flex items-center gap-3">
               <BookOpen size={18} className="text-blue-500" />
               <h3 className="text-sm font-black uppercase tracking-widest">Info Panel</h3>
            </div>
            
            <div className="space-y-6">
              <EduItem 
                title="What is Barracuda?" 
                text="Barracuda maintains lists of IPs and Domains that are known to send spam. Their data is used by mail servers to block bad emails." 
              />
              <EduItem 
                title="BRBL (IP List)" 
                text="This list targets IP addresses that are verified sources of spam." 
              />
              <EduItem 
                title="IBL (Intent List)" 
                text="This list targets domains found in the bodies of spam messages." 
              />
            </div>
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
               <Filter size={14} className="text-blue-500" />
               <h2 className="text-[10px] font-black uppercase tracking-[0.3em]">Check Results</h2>
            </div>
            
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input
                type="text"
                placeholder="Search results..."
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
                  <th className="px-8 py-5">Identifier</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Verdict</th>
                  <th className="px-8 py-5">Type</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredResults.map((r) => (
                  <tr key={r.id} className="hover:bg-blue-500/5 transition-colors group">
                    <td className="px-8 py-5 text-[10px] font-mono font-bold text-slate-600 text-center">{r.id}</td>
                    <td className={`px-8 py-5 font-mono text-xs font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                       <div className="flex items-center gap-2">
                          {r.input}
                          <a href={`${BARRACUDA_WEB_URL}?lookup_entry=${r.input}`} target="_blank" className="opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity">
                            <ExternalLink size={12} />
                          </a>
                       </div>
                    </td>
                    <td className="px-8 py-5 text-center"><StatusBadge status={r.status} /></td>
                    <td className="px-8 py-5">
                       <span className={`text-[10px] font-black uppercase tracking-widest leading-relaxed ${r.status === 'listed' ? 'text-rose-500/80' : (r.status === 'clean' ? 'text-emerald-500/80' : 'text-slate-500')}`}>
                         {r.message}
                       </span>
                    </td>
                    <td className="px-8 py-5">
                       <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[9px] font-black text-slate-400 uppercase tracking-widest border border-slate-700">
                          {r.type}
                       </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <footer className={`shrink-0 px-6 py-4 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>© {new Date().getFullYear()} Toolbox</p>
      </footer>
    </div>
  );
};

const EduItem = ({ title, text }: { title: string, text: string }) => (
  <div className="flex flex-col gap-1.5">
    <p className="text-[10px] font-black uppercase tracking-widest text-blue-500/70">{title}</p>
    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">{text}</p>
  </div>
);

const StatusBadge: React.FC<{ status: BarracudaResult['status'] }> = ({ status }) => {
  const styles = {
    listed: 'bg-rose-500/10 text-rose-500 border-rose-500/20',
    clean: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    loading: 'bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse',
    error: 'bg-slate-800 text-slate-500 border-slate-700',
    pending: 'bg-slate-950 text-slate-700 border-slate-900'
  };
  const labels = {
    listed: 'LISTED',
    clean: 'CLEAN',
    loading: 'WAIT',
    error: 'ERROR',
    pending: 'WAIT'
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-[0.15em] border ${styles[status]}`}>
      {labels[status]}
    </span>
  );
};

export default BarracudaTool;