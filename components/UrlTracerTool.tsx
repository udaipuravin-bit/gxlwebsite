import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Link2, 
  Zap, 
  Loader2, 
  Copy, 
  Check, 
  Info, 
  ChevronDown, 
  ChevronUp,
  Table,
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { UrlTraceHop, UrlTraceResult } from '../types';
import { traceUrlRedirects } from '../services/traceService';
import { useNotify } from '../App';

interface UrlTracerToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const CHEAT_SHEET_DATA = [
  {
    range: "1xx",
    title: "1XX Informational",
    desc: "The request was received, continuing process.",
    codes: [
      { code: 100, title: "Continue", text: "The server has received the request headers and the client should proceed to send the request body.", useCase: "Large file uploads." },
      { code: 101, title: "Switching Protocols", text: "The requester has asked the server to switch protocols.", useCase: "Upgrading to WebSockets." },
    ]
  },
  {
    range: "2xx",
    title: "2XX Successful",
    desc: "The action was successfully received, understood, and accepted.",
    codes: [
      { code: 200, title: "OK", text: "Standard response for successful HTTP requests.", useCase: "Standard page loads." },
      { code: 201, title: "Created", text: "The request has been fulfilled, resulting in the creation of a new resource.", useCase: "Successful POST request creating a user." },
    ]
  },
  {
    range: "3xx",
    title: "3XX Redirection",
    desc: "Further action must be taken in order to complete the request.",
    codes: [
      { code: 301, title: "Moved Permanently", text: "This and all future requests should be directed to the given URI.", useCase: "Changing a website's domain." },
      { code: 302, title: "Found (Temporary)", text: "The resource resides temporarily under a different URI.", useCase: "Short-term maintenance redirects." },
    ]
  },
  {
    range: "4xx",
    title: "4XX Client Errors",
    desc: "The request contains bad syntax or cannot be fulfilled.",
    codes: [
      { code: 400, title: "Bad Request", text: "The server cannot or will not process the request due to something that is perceived to be a client error.", useCase: "Malformed request syntax." },
      { code: 403, title: "Forbidden", text: "The server understood the request but refuses to authorize it.", useCase: "Accessing restricted system files." },
      { code: 404, title: "Not Found", text: "The server cannot find the requested resource.", useCase: "Broken links or deleted pages." },
    ]
  },
  {
    range: "5xx",
    title: "5XX Server Errors",
    desc: "The server failed to fulfill an apparently valid request.",
    codes: [
      { code: 500, title: "Internal Server Error", text: "A generic error message, given when an unexpected condition was encountered.", useCase: "Code crashes." },
      { code: 502, title: "Bad Gateway", text: "The server, while acting as a gateway or proxy, received an invalid response from the upstream server.", useCase: "Backend connection failure." },
    ]
  }
];

const UrlTracerTool: React.FC<UrlTracerToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  const [urlInput, setUrlInput] = useState('');
  const [result, setResult] = useState<UrlTraceResult | null>(null);
  const [isTracing, setIsTracing] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>("2xx");

  const handleTrace = async () => {
    let cleanUrl = urlInput.trim();
    if (!cleanUrl) return;
    if (!/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    try {
      new URL(cleanUrl);
    } catch (e) {
      notify('error', 'Invalid URL format.');
      return;
    }

    setIsTracing(true);
    setResult(null);
    notify('info', 'Engaging Forensic Trace Matrix...');

    const traceResult = await traceUrlRedirects(cleanUrl);
    setResult(traceResult);
    setIsTracing(false);
    
    if (traceResult.error) {
      notify('error', `Trace Aborted: ${traceResult.error}`);
    } else {
      notify('success', `Resolution complete.`);
    }
  };

  const copyResults = () => {
    if (!result) return;
    const text = result.hops.map(h => `${h.id}. [${h.statusCode}] ${h.url}`).join('\n');
    navigator.clipboard.writeText(text);
    notify('success', 'Trace results copied.');
  };

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-600';

  const getStatusColor = (statusClass: UrlTraceHop['statusClass']) => {
    switch (statusClass) {
      case '1xx': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case '2xx': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case '3xx': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case '4xx': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case '5xx': return 'bg-red-900/20 text-red-500 border-red-900/30';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-xl">
              <Link2 size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-indigo-500">URL Tracer</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">High-Fidelity HTTP Forensic Engine</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className={`lg:col-span-12 p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Zap size={12} className="text-indigo-400" /> Resolution Target
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleTrace()}
                placeholder="https://example.com"
                className={`flex-1 p-4 rounded-2xl border outline-none font-mono text-sm transition-all ${inputClasses}`}
              />
              <button 
                onClick={handleTrace}
                disabled={isTracing || !urlInput.trim()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl disabled:opacity-50 flex items-center justify-center gap-3 transition-all shrink-0"
              >
                {isTracing ? <Loader2 size={16} className="animate-spin" /> : <Zap size={16} />} 
                {isTracing ? 'RESOLVING PATH...' : 'TRACE PATH'}
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Table size={14} className="text-indigo-400" /> Network Hops Identified
                </h3>
              </div>
              <div className="overflow-x-auto rounded-3xl border border-slate-800/50">
                <table className="w-full text-left">
                  <thead className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'} border-b border-slate-800/50`}>
                    <tr className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-4 w-16 text-center">Hop</th>
                      <th className="px-6 py-4">URL Path</th>
                      <th className="px-6 py-4 w-32 text-center">Status</th>
                      <th className="px-6 py-4">Forensic Label</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
                    {result.hops.map((hop) => (
                      <tr key={hop.id} className="hover:bg-indigo-500/5 transition-colors">
                        <td className="px-6 py-4 text-[10px] font-mono font-bold text-slate-600 text-center">{hop.id}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold font-mono tracking-tight break-all ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {hop.url}
                            </span>
                            <a href={hop.url} target="_blank" className="text-slate-600 hover:text-indigo-400">
                              <ExternalLink size={12} />
                            </a>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-widest ${getStatusColor(hop.statusClass)}`}>
                            {hop.statusCode}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                            {hop.meaning}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UrlTracerTool;