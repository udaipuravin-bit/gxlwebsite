import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Loader2, 
  Trash2, 
  Zap,
  Search
} from 'lucide-react';
import { IpGeoResult } from '../types';

interface IpGeoToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const IpGeoTool: React.FC<IpGeoToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [ipInput, setIpInput] = useState('');
  const [results, setResults] = useState<IpGeoResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleProcess = async () => {
    const list = ipInput.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    if (list.length === 0) return;

    setIsProcessing(true);
    const newResults: IpGeoResult[] = [];

    for (const ip of list.slice(0, 100)) {
      try {
        const response = await fetch(`https://ipapi.co/${ip}/json/`);
        const data = await response.json();
        newResults.push({
          ip,
          hostname: data.org || null,
          city: data.city || null,
          region: data.region || null,
          country: data.country_name || null,
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          isp: data.org || null,
          timezone: data.timezone || null,
          status: data.error ? 'unknown' : 'valid'
        });
      } catch {
        newResults.push({ ip, hostname: null, city: null, region: null, country: null, latitude: null, longitude: null, isp: null, timezone: null, status: 'unknown' });
      }
    }

    setResults(newResults);
    setIsProcessing(false);
  };

  const filteredResults = results.filter(r => 
    r.ip.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (r.isp && r.isp.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (r.country && r.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-cyan-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-cyan-600';

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl border shadow-xl ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2.5 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <MapPin size={28} />
            </div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-cyan-500">IP Geo Checker</h1>
          </div>
        </div>
        {results.length > 0 && (
          <button onClick={() => { setResults([]); setIpInput(''); }} className="px-4 py-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 rounded-lg text-xs font-black uppercase tracking-widest transition-all border border-rose-500/20 flex items-center gap-2">
            <Trash2 size={16} /> Reset
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 flex flex-col gap-4">
          <div className={`p-6 rounded-3xl border shadow-xl flex flex-col gap-4 ${cardClasses}`}>
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Input IP Matrix</label>
            <textarea
              value={ipInput}
              onChange={(e) => setIpInput(e.target.value)}
              placeholder="8.8.8.8&#10;1.1.1.1"
              className={`w-full h-48 p-4 border rounded-xl outline-none font-mono text-xs transition-all focus:ring-2 focus:ring-cyan-500/50 ${inputClasses}`}
            />
            <button
              onClick={handleProcess}
              disabled={isProcessing || !ipInput.trim()}
              className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {isProcessing ? <Loader2 className="animate-spin" size={16} /> : <Zap size={16} />} 
              Run Trace
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 animate-in slide-in-from-right-4 duration-500">
          <div className={`rounded-3xl border shadow-xl overflow-hidden min-h-[400px] flex flex-col ${cardClasses}`}>
            <div className={`p-4 border-b flex flex-col sm:flex-row gap-4 items-center ${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'}`}>
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Filter location result..." 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className={`w-full pl-9 pr-4 py-2 border rounded-lg outline-none text-xs font-bold ${inputClasses}`} 
                />
              </div>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              <table className="w-full text-left">
                <thead>
                  <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-100 border-slate-200'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                    <th className="px-6 py-4 w-32">IP Address</th>
                    <th className="px-6 py-4">ISP / Organization</th>
                    <th className="px-6 py-4">Geographic Node</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800/50' : 'divide-slate-200'}`}>
                  {isProcessing ? (
                    <tr><td colSpan={3} className="p-24 text-center"><Loader2 className="animate-spin mx-auto text-cyan-500" size={32} /><p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mt-4">Tracing Coordinates...</p></td></tr>
                  ) : filteredResults.length > 0 ? filteredResults.map((r, i) => (
                    <tr key={i} className="hover:bg-cyan-500/5 transition-colors">
                      <td className={`px-6 py-5 font-mono text-xs font-black tracking-tight ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>{r.ip}</td>
                      <td className={`px-6 py-5 text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.isp || '—'}</td>
                      <td className="px-6 py-5 text-xs">
                        <span className={`font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{r.country || '—'}</span>
                        <span className="opacity-50 font-bold ml-1 text-[10px] uppercase">{r.city}</span>
                      </td>
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

export default IpGeoTool;