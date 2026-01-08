import React from 'react';
import { 
  ShieldCheck, 
  Globe, 
  BarChart3, 
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
  FileCode2,
  ShieldAlert,
  Link2,
  Scissors,
  Layout,
  Box,
  Layers,
  SearchCheck,
  Zap,
  KeyRound,
  Fish,
  Grid
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
  onLaunchSpamCop: () => void;
  onLaunchBarracuda: () => void;
  onLaunchUrlTracer: () => void;
  onLaunchHtmlCleaner: () => void;
  onLaunchEmailBuilder: () => void;
  onLaunchGrapesBuilder: () => void;
  onLaunchRecordMatcher: () => void;
  onLaunchBulkBlacklist: () => void;
}

const Home: React.FC<HomeProps> = (props) => {
  const isDark = props.theme === 'dark';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-in fade-in duration-700">
      {/* Hero Section */}
      <header className="text-center mb-16 relative">
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] blur-[120px] rounded-full -z-10 transition-colors ${isDark ? 'bg-indigo-600/10' : 'bg-indigo-200/20'}`} />
        <h1 className={`text-4xl md:text-6xl font-black tracking-tighter mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Email <span className="text-indigo-500 text-glow-indigo">Toolbox</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs">Simple tools for email deliverability & security</p>
      </header>

      {/* Category 1: Security & Reputation */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-rose-500/10 text-rose-400' : 'bg-rose-100 text-rose-600'}`}>
            <Shield size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Security & Reputation</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchBulkBlacklist} 
            icon={<Grid size={32} />} 
            title="Blacklist Checker" 
            desc="Check if IPs or domains are blacklisted." 
            colorClass="text-indigo-500"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSpamhaus} 
            icon={<ShieldAlert size={32} />} 
            title="Spamhaus Checker" 
            desc="Check status on Spamhaus lists." 
            colorClass="text-rose-500"
            glowClass="bg-rose-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchBarracuda} 
            icon={<Fish size={32} />} 
            title="Barracuda Checker" 
            desc="Check status on Barracuda lists." 
            colorClass="text-blue-500"
            glowClass="bg-blue-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSpamCop} 
            icon={<SearchCheck size={32} />} 
            title="SpamCop Checker" 
            desc="Check status on SpamCop lists." 
            colorClass="text-orange-500"
            glowClass="bg-orange-500/10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDkim} 
            icon={<ShieldCheck size={32} />} 
            title="DKIM Checker" 
            desc="Lookup and verify DKIM records." 
            colorClass="text-emerald-400"
            glowClass="bg-emerald-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDmarc} 
            icon={<BarChart3 size={32} />} 
            title="DMARC Checker" 
            desc="Check DMARC policy status." 
            colorClass="text-sky-400"
            glowClass="bg-sky-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSpf} 
            icon={<Globe size={32} />} 
            title="SPF Checker" 
            desc="Check SPF record validity." 
            colorClass="text-amber-400"
            glowClass="bg-amber-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchRecordMatcher} 
            icon={<KeyRound size={32} />} 
            title="Record Matcher" 
            desc="Compare DNS records for matches." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
        </div>
      </section>

      {/* Category 2: Infrastructure & Forensic */}
      <section className="mb-20">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-sky-500/10 text-sky-400' : 'bg-sky-100 text-sky-600'}`}>
            <Network size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Infrastructure & Network</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchUrlTracer} 
            icon={<Link2 size={32} />} 
            title="URL Tracer" 
            desc="Trace link redirects and codes." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchMx} 
            icon={<Mail size={32} />} 
            title="MX Checker" 
            desc="Lookup mail servers and hosting." 
            colorClass="text-rose-400"
            glowClass="bg-rose-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchDns} 
            icon={<SearchCode size={32} />} 
            title="DNS Lookup" 
            desc="Lookup any type of DNS record." 
            colorClass="text-sky-400"
            glowClass="bg-sky-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchReverseDns} 
            icon={<Hash size={32} />} 
            title="PTR Checker" 
            desc="Lookup hostnames from IP addresses." 
            colorClass="text-blue-400"
            glowClass="bg-blue-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchIpGeo} 
            icon={<MapPin size={32} />} 
            title="IP Geo Checker" 
            desc="Find the location of any IP address." 
            colorClass="text-cyan-400"
            glowClass="bg-cyan-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchWhois} 
            icon={<Calendar size={32} />} 
            title="WHOIS Checker" 
            desc="Check domain expiry and ownership." 
            colorClass="text-lime-400"
            glowClass="bg-lime-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchHeaderAnalyzer} 
            icon={<FileText size={32} />} 
            title="Header Analyzer" 
            desc="Analyze email message headers." 
            colorClass="text-orange-400"
            glowClass="bg-orange-500/10"
          />
        </div>
      </section>

      {/* Category 3: Creative & Design */}
      <section className="mb-24">
        <div className="flex items-center gap-3 mb-10">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600'}`}>
            <Activity size={20} />
          </div>
          <h2 className={`text-2xl font-black tracking-tight uppercase ${isDark ? 'text-white' : 'text-slate-800'}`}>Design & Content</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchEmailBuilder} 
            icon={<Layout size={28} />} 
            title="Email Builder" 
            desc="Drag and drop email designer." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchGrapesBuilder} 
            icon={<Box size={28} />} 
            title="HTML Designer" 
            desc="Visual HTML template designer." 
            colorClass="text-emerald-500"
            glowClass="bg-emerald-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchEmailMaster} 
            icon={<FileCode2 size={28} />} 
            title="HTML Editor" 
            desc="Code-based HTML/MIME editor." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchHtmlCleaner} 
            icon={<Scissors size={28} />} 
            title="HTML Cleaner" 
            desc="Clean and sanitize HTML code." 
            colorClass="text-emerald-400"
            glowClass="bg-emerald-500/10"
          />
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchSubjectEncoder} 
            icon={<Type size={28} />} 
            title="Subject Encoder" 
            desc="Encode email subject lines." 
            colorClass="text-fuchsia-400"
            glowClass="bg-fuchsia-500/10"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <ToolCard 
            theme={props.theme}
            onClick={props.onLaunchMimeEncoder} 
            icon={<Code2 size={28} />} 
            title="MIME Tool" 
            desc="Convert Base64 and Quoted-Printable." 
            colorClass="text-indigo-400"
            glowClass="bg-indigo-500/10"
          />
        </div>
      </section>

      {/* Footer */}
      <footer className={`text-center pb-12 border-t pt-16 ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest">
          © {new Date().getFullYear()} Toolbox • v4.8.0
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
      className={`group relative flex flex-col p-6 rounded-3xl border transition-all text-left shadow-lg overflow-hidden h-full ${
        isDark 
          ? 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:shadow-2xl' 
          : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow-xl'
      }`}
    >
      <div className={`absolute top-0 right-0 w-32 h-32 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 transition-opacity duration-500 opacity-0 group-hover:opacity-100 ${isDark ? glowClass : 'bg-indigo-500/5'}`} />
      <div className={`mb-5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3 ${colorClass}`}>
        {icon}
      </div>
      <h3 className={`text-sm font-black mb-2 uppercase tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`text-[10px] font-medium leading-relaxed transition-colors ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
        {desc}
      </p>
      <div className="mt-auto pt-4 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
         <div className={`p-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-indigo-50'}`}>
           <Zap size={14} className="text-indigo-500" />
         </div>
      </div>
    </button>
  );
};

export default Home;