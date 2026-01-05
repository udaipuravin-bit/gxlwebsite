
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Play, 
  Loader2, 
  Trash2, 
  Globe, 
  Search,
  ExternalLink,
  Navigation
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

  const handleProcess = async () => {
    const list = ipInput.split(/[\n,]/).map(ip => ip.trim()).filter(ip => ip.length > 0);
    if (list.length === 0) return;

    setIsProcessing(true);
    const newResults: IpGeoResult[] = [];

    for (const ip of list.slice(0, 10)) { // Limit free lookups
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

  const cardClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-6 rounded-2xl border shadow-xl ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-cyan-500 p-2.5 rounded-xl text-white shadow-lg shadow-cyan-500/20">
              <MapPin size={28} />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight">IP Geolocation Audit</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className={`p-6 rounded-2xl border shadow-xl flex flex-col gap-4 ${cardClasses}`}>
          <textarea
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="Paste IPs (one per line)..."
            className={`w-full h-64 p-4 border rounded-xl outline-none font-mono text-xs transition-all focus:ring-2 focus:ring-cyan-500/50 ${inputClasses}`}
          />
          <button
            onClick={handleProcess}
            disabled={isProcessing || !ipInput.trim()}
            className="w-full py-4 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-xl font-bold transition-all shadow-lg"
          >
            {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : 'Geolocate Bulk'}
          </button>
        </div>

        <div className="lg:col-span-3">
          <div className={`rounded-2xl border shadow-xl overflow-hidden ${cardClasses}`}>
             <table className="w-full text-left">
               <thead>
                 <tr className={`${isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-slate-100 border-slate-200'} border-b`}>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">IP Address</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">ISP / Org</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Location</th>
                   <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase text-center tracking-widest">Map</th>
                 </tr>
               </thead>
               <tbody className={`divide-y ${isDark ? 'divide-slate-800/30' : 'divide-slate-200'}`}>
                 {results.map((r, i) => (
                   <tr key={i} className={`hover:bg-slate-500/5 transition-colors ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                     <td className="px-6 py-4 font-mono text-sm font-bold">{r.ip}</td>
                     <td className="px-6 py-4 text-xs font-medium">{r.isp || '—'}</td>
                     <td className="px-6 py-4">
                       <div className="flex items-center gap-2">
                         <Globe size={12} className="text-cyan-500" />
                         <span className="text-xs font-bold">{r.country || '—'}</span>
                         <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{r.city || ''}</span>
                       </div>
                     </td>
                     <td className="px-6 py-4 text-center">
                        <a 
                          href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-slate-500 hover:text-cyan-500 transition-colors inline-block"
                        >
                          <Navigation size={14} className="mx-auto" />
                        </a>
                     </td>
                   </tr>
                 ))}
                 {results.length === 0 && (
                   <tr>
                     <td colSpan={4} className="px-6 py-20 text-center text-slate-500 italic">
                        No geolocation data to display. Run an audit to see results.
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

export default IpGeoTool;
