import React from 'react';
import { 
  ShieldCheck, 
  Globe, 
  Network, 
  Mail, 
  Shield,
  ShieldAlert,
  Zap,
  Grid,
  SearchCheck,
  LayoutGrid,
  FileSearch,
  Hash,
  MapPin,
  Calendar,
  Code2,
  FileCode2,
  Type,
  Languages,
  Layout,
  Box,
  FileText,
  Scissors,
  Activity,
  CloudDownload,
  Link2,
  Database,
  FileCheck,
  Layers,
  Palette,
  Target,
  FlaskConical,
  Code
} from 'lucide-react';
import { View } from '../App';

interface HomeProps {
  theme: 'dark' | 'light';
  onNavigate: (view: View) => void;
}

const Home: React.FC<HomeProps> = ({ theme, onNavigate }) => {
  const isDark = theme === 'dark';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-700">
      <header className="text-left mb-12 relative">
        <div className={`absolute top-0 left-0 w-[500px] h-[200px] blur-[120px] rounded-full -z-10 transition-colors ${isDark ? 'bg-orange-600/10' : 'bg-orange-200/10'}`} />
        <h1 className={`flex items-center gap-4 text-5xl md:text-6xl font-black tracking-tighter mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <Zap size={54} className="text-orange-600" fill="currentColor" />
          Email <span className="text-orange-500 text-glow">Sparks</span>
        </h1>
        <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px] md:text-[12px]">Professional Intelligence Hub & Deliverability Diagnostic Matrix</p>
      </header>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' : 'bg-orange-100 text-orange-600'}`}>
            <Shield size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Reputation & Security</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">DNSBL & Node Reputation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard theme={theme} onClick={() => onNavigate('bulk-blacklist')} icon={<LayoutGrid size={32} />} title="Blacklist Checker" desc="Comprehensive multi-mode DNSBL audit engine for bulk IPs and Domains." colorClass="text-indigo-500" />
          <ToolCard theme={theme} onClick={() => onNavigate('spamhaus-checker')} icon={<ShieldAlert size={32} />} title="Spamhaus Checker" desc="Direct DQS zone reputation audit with forensic data datasets." colorClass="text-rose-500" />
          <ToolCard theme={theme} onClick={() => onNavigate('selector-auditor')} icon={<SearchCheck size={32} />} title="Selector Auditor" desc="Cross-reference domains against specific selectors with deep MIME integration." colorClass="text-orange-500" />
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-600'}`}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Authentication Matrix</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Global Protocol Validation</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard theme={theme} onClick={() => onNavigate('dkim-checker')} icon={<ShieldCheck size={32} />} title="DKIM Checker" desc="Recursive multi-selector key search and discovery for any hostname." colorClass="text-emerald-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('spf-validator')} icon={<Globe size={32} />} title="SPF Checker" desc="Detailed logic validation and recursive include depth lookup count." colorClass="text-amber-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('dmarc-checker')} icon={<FileText size={32} />} title="DMARC Checker" desc="Domain policy compliance, alignment audit, and reporting syntax." colorClass="text-sky-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('caa-checker')} icon={<FileCheck size={32} />} title="CAA Checker" desc="Certificate authority authorization policy and security lookup." colorClass="text-teal-400" />
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' : 'bg-sky-100 text-sky-600'}`}>
            <Network size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Network Intelligence</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Infrastructure Reconnaissance</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard theme={theme} onClick={() => onNavigate('dns-lookup')} icon={<Globe size={32} />} title="DNS Lookup" desc="Global recursive DNS record identification engine for all types." colorClass="text-sky-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('mx-lookup')} icon={<Mail size={32} />} title="MX Checker" desc="Mail exchange server identification and provider infrastructure." colorClass="text-rose-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('reverse-dns')} icon={<Hash size={32} />} title="PTR Checker" desc="Reverse DNS IP resolution and hostname mapping verification." colorClass="text-violet-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('ip-geolocation')} icon={<MapPin size={32} />} title="IP Geo Node" desc="Real-world geographic location and ISP network coordinates trace." colorClass="text-cyan-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('whois-checker')} icon={<Calendar size={32} />} title="Expiry Date Checker" desc="Bulk domain registration and expiry lifecycle monitor matrix." colorClass="text-lime-400" />
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center gap-3 mb-8">
          <div className={`p-2 rounded-xl ${isDark ? 'bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20' : 'bg-fuchsia-100 text-fuchsia-600'}`}>
            <FlaskConical size={20} />
          </div>
          <div>
            <h2 className={`text-lg font-black tracking-tight uppercase ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>Design & Forensic Lab</h2>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol & Creative Engineering</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ToolCard theme={theme} onClick={() => onNavigate('font-studio')} icon={<Languages size={32} />} title="Font Studio" desc="Social and marketing typography styling toolkit for content." colorClass="text-orange-500" />
          <ToolCard theme={theme} onClick={() => onNavigate('email-builder')} icon={<Layout size={32} />} title="Email Studio" icon2={<Zap size={10} />} desc="Drag & drop responsive email template design suite studio." colorClass="text-indigo-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('grapes-builder')} icon={<Box size={32} />} title="HTML Designer" desc="Canvas-based layout studio for newsletters and web components." colorClass="text-emerald-500" />
          <ToolCard theme={theme} onClick={() => onNavigate('email-master')} icon={<FileCode2 size={32} />} title="HTML Editor" desc="Live code sandbox for manual HTML/CSS editing and preview." colorClass="text-blue-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('html-cleaner')} icon={<Scissors size={32} />} title="HTML Cleaner" desc="Forensic markup sanitizer and tracking link/image removal." colorClass="text-emerald-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('email-header-analyzer')} icon={<FileText size={32} />} title="Header Analyzer" desc="Hop-by-hop authentication and forensic header protocol audit." colorClass="text-orange-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('mime-encoder')} icon={<Code size={32} />} title="MIME Tool" desc="B64 and Quoted-Printable RFC protocol forensics and encoding." colorClass="text-fuchsia-400" />
          <ToolCard theme={theme} onClick={() => onNavigate('subject-encoder')} icon={<Type size={32} />} title="Subject Encoder" desc="Generate 100+ unique RFC-2047 variants for subject testing." colorClass="text-fuchsia-500" />
        </div>
      </section>

      <footer className={`text-left pb-12 border-t pt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
        <div>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.25em] mb-1">
            © {new Date().getFullYear()} Email Sparks Intelligence Lab
          </p>
          <p className="text-slate-700 text-[9px] font-bold uppercase tracking-widest">Universal deliverability framework v6.0.0</p>
        </div>
        <div className="flex gap-6">
          <a href="mailto:support@emailsparks.com" className="flex items-center gap-2 text-slate-500 hover:text-orange-500 transition-colors text-[10px] font-black uppercase tracking-widest">
            <Mail size={12} /> support@emailsparks.com
          </a>
        </div>
      </footer>
    </div>
  );
};

interface ToolCardProps {
  onClick: () => void;
  icon: React.ReactNode;
  icon2?: React.ReactNode;
  title: string;
  desc: string;
  theme: string;
  colorClass: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ onClick, icon, icon2, title, desc, theme, colorClass }) => {
  const isDark = theme === 'dark';
  return (
    <button 
      onClick={onClick}
      className={`group relative flex flex-col items-start rounded-[2.2rem] border transition-all text-left shadow-lg overflow-hidden p-8 w-full ${
        isDark 
          ? 'bg-[#0a0f1c] border-slate-800/60 hover:bg-[#0f172a] hover:border-orange-500/50 hover:shadow-orange-500/5' 
          : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-orange-300 hover:shadow-xl'
      }`}
    >
      <div className={`transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3 ${colorClass} mb-8`}>
        {icon}
      </div>
      <div className="w-full mt-auto">
        <h3 className={`text-[15px] font-black mb-2 uppercase tracking-tight transition-colors ${isDark ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h3>
        <div className={`w-6 h-0.5 mb-3 rounded-full bg-slate-500/30 group-hover:bg-orange-500/50 transition-all duration-500 group-hover:w-12`} />
        <p className={`text-sm font-medium leading-relaxed text-slate-500`}>
          {desc}
        </p>
      </div>
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
         <Zap size={10} className="text-orange-500" fill="currentColor" />
      </div>
    </button>
  );
};

export default Home;