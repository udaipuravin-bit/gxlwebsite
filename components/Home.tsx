import React from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Zap, 
  BarChart3, 
  ChevronRight, 
  Network, 
  Mail, 
  Calendar, 
  Hash, 
  FileCheck, 
  FileText, 
  MapPin, 
  Code2, 
  Activity,
  SearchCode,
  Shield,
  Type,
  Sparkles,
  AlertOctagon
} from 'lucide-react';

interface HomeProps {
  theme: 'dark' | 'light';
  onLaunchDkim: () => void;
  onLaunchDmarc: () => void;
  onLaunchSpf: () => void;
  onLaunchDns: () => void;
  onLaunchMx: () => void;
  onLaunchWhois: () => void;
  onLaunchReverseDns: () => void;
  onLaunchCaa: () => void;
  onLaunchHeaderAnalyzer: () => void;
  onLaunchIpGeo: () => void;
  onLaunchMimeEncoder: () => void;
  onLaunchSubjectEncoder: () => void;
  onLaunchEmailMaster: () => void;
  onLaunchSpamhaus: () => void;
}

const Home: React.FC<HomeProps> = (props) => {
  const isDark = props.theme === 'dark';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20 animate-in fade-in duration-700">
      {/* Hero Section */}
      <header className="text-center mb-20 space-y-6 relative">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] blur-[120px] rounded-full -z-10 transition-colors ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-200/20'}`} />
        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] mb-4 ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
          <Zap size={12} className="fill-current" /> Intelligence Control Plane
        </div>
        <h1 className={`text-5xl md:text-7xl font-black tracking-tight leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Bulk Security <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-teal-400">& Intelligence</span>
        </h1>
        <p className={`text-lg md:text-xl max-w-3xl mx-auto font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Professional toolsuite for bulk reputation auditing, protocol verification, and forensic domain analysis.
        </p>
      </header>

      {/* Category 1: Global Reputation & Authentication */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}>
            <Shield size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Reputation & Auth</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSpamhaus} 
            icon={<AlertOctagon size={32} />} 
            title="Spamhaus DQS" 
            desc="Bulk IP & Domain reputation check via Datafeed Query Service." 
            colorClass="text-rose-500"
            glowClass="bg-rose-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDkim} 
            icon={<ShieldCheck size={32} />} 
            title="Bulk DKIM" 
            desc="Verify keys across domains with custom selector matrix." 
            colorClass="text-emerald-400"
            glowClass="bg-emerald-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSpf} 
            icon={<Globe size={32} />} 
            title="SPF Validator" 
            desc="Audit DNS lookup limits and bulk protocol compliance." 
            colorClass="text-amber-400"
            glowClass="bg-amber-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDmarc} 
            icon={<BarChart3 size={32} />} 
            title="DMARC Audit" 
            desc="Analyze policy alignment and global reporting endpoints." 
            colorClass="text-sky-400"
            glowClass="bg-sky-500/10"
          />
        </div>
      </section>

      {/* Category 2: Infrastructure Intelligence */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
            <Network size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Infrastructure</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchMx} 
            icon={<Mail size={32} />} 
            title="MX Intelligence" 
            desc="Identify bulk email providers and architecture maps." 
            colorClass="text-rose-400"
            glowClass="bg-rose-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDns} 
            icon={<SearchCode size={32} />} 
            title="Deep DNS" 
            desc="Global recursive lookup for all major record types." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchReverseDns} 
            icon={<Hash size={32} />} 
            title="Reverse DNS" 
            desc="Map IPv4/v6 addresses to parent host identities." 
            colorClass="text-blue-400"
            glowClass="bg-blue-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchCaa} 
            icon={<FileCheck size={32} />} 
            title="CAA Policy" 
            desc="Audit certificate authority restriction policies." 
            colorClass="text-teal-400"
            glowClass="bg-teal-500/10"
          />
        </div>
      </section>

      {/* Category 3: Forensic Studio */}
      <section className="mb-24">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <Activity size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Forensic Studio</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchEmailMaster} 
            icon={<Sparkles size={28} />} 
            title="Email Master" 
            desc="Professional HTML/MIME editor." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchWhois} 
            icon={<Calendar size={28} />} 
            title="Expiry Check" 
            desc="Global WHOIS audit." 
            colorClass="text-lime-400"
            glowClass="bg-lime-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchHeaderAnalyzer} 
            icon={<FileText size={28} />} 
            title="Path Audit" 
            desc="Trace mail risk headers." 
            colorClass="text-orange-400"
            glowClass="bg-orange-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchIpGeo} 
            icon={<MapPin size={28} />} 
            title="IP Geo" 
            desc="Locate network origins." 
            colorClass="text-cyan-400"
            glowClass="bg-cyan-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSubjectEncoder} 
            icon={<Type size={28} />} 
            title="Subject Studio" 
            desc="RFC 2047 variant engine." 
            colorClass="text-fuchsia-400"
            glowClass="bg-fuchsia-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchMimeEncoder} 
            icon={<Code2 size={28} />} 
            title="MIME Sandbox" 
            desc="Base64/QP analyzer." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
        </div>
      </section>

      {/* Footer Branding */}
      <footer className={`text-center pb-12 border-t pt-16 ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Authenticator Pro • Automated Domain Intelligence v3.0.5
        </p>
      </footer>
    </div>
  );
};

interface ToolCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  title: string;
  desc: string;
  theme: string;
  colorClass: string;
  glowClass: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ onClick, icon, title, desc, theme, colorClass, glowClass }) => {
  const isDark = theme === 'dark';
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col p-6 rounded-2xl border transition-all text-left shadow-lg overflow-hidden h-full ${
        isDark 
          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-2xl' 
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl'
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isDark ? glowClass : 'bg-indigo-500/5'}`} />
      <div className={`mb-4 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${isDark ? colorClass : 'text-indigo-600'}`}>
        {icon}
      </div>
      <h3 className={`text-xs font-black mb-2 uppercase tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`text-[10px] font-medium leading-relaxed transition-colors ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        {desc}
      </p>
    </button>
  );
};

export default Home;