import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  ShieldCheck, 
  Globe, 
  BarChart3, 
  FileCheck, 
  Mail, 
  SearchCode, 
  Hash, 
  FileText, 
  MapPin, 
  Calendar, 
  Code2,
  Menu,
  X,
  Zap,
  Moon,
  Sun,
  Shield,
  Type,
  Search as SearchIcon,
  FileCode2,
  ShieldAlert,
  Link2,
  Scissors,
  Layout,
  Box,
  Layers,
  SearchCheck,
  Fish,
  Grid
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, theme, onToggleTheme }) => {
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const tools = {
    authentication: [
      { id: 'bulk-blacklist', name: 'Blacklist Checker', icon: <Grid size={16} />, color: 'text-indigo-500' },
      { id: 'spamhaus-checker', name: 'Spamhaus Checker', icon: <ShieldAlert size={16} />, color: 'text-rose-500' },
      { id: 'barracuda-checker', name: 'Barracuda Checker', icon: <Fish size={16} />, color: 'text-blue-500' },
      { id: 'spamcop-checker', name: 'SpamCop Checker', icon: <SearchCheck size={16} />, color: 'text-orange-500' },
      { id: 'dkim-checker', name: 'DKIM Checker', icon: <ShieldCheck size={16} />, color: 'text-emerald-400' },
      { id: 'spf-validator', name: 'SPF Checker', icon: <Globe size={16} />, color: 'text-amber-400' },
      { id: 'dmarc-checker', name: 'DMARC Checker', icon: <BarChart3 size={16} />, color: 'text-sky-400' },
      { id: 'record-matcher', name: 'Record Matcher', icon: <Layers size={16} />, color: 'text-indigo-400' },
      { id: 'caa-checker', name: 'CAA Checker', icon: <FileCheck size={16} />, color: 'text-teal-400' },
    ],
    infrastructure: [
      { id: 'url-tracer', name: 'URL Tracer', icon: <Link2 size={16} />, color: 'text-indigo-400' },
      { id: 'mx-lookup', name: 'MX Checker', icon: <Mail size={16} />, color: 'text-rose-400' },
      { id: 'dns-lookup', name: 'DNS Lookup', icon: <SearchCode size={16} />, color: 'text-indigo-400' },
      { id: 'reverse-dns', name: 'PTR Checker', icon: <Hash size={16} />, color: 'text-violet-400' },
      { id: 'ip-geolocation', name: 'IP Geo Checker', icon: <MapPin size={16} />, color: 'text-cyan-400' },
      { id: 'whois-checker', name: 'WHOIS Checker', icon: <Calendar size={16} />, color: 'text-lime-400' },
    ],
    design: [
      { id: 'email-builder', name: 'Email Builder', icon: <Layout size={16} />, color: 'text-indigo-400' },
      { id: 'grapes-builder', name: 'HTML Designer', icon: <Box size={16} />, color: 'text-emerald-500' },
      { id: 'email-master', name: 'HTML Editor', icon: <FileCode2 size={16} />, color: 'text-indigo-400' },
      { id: 'html-cleaner', name: 'HTML Cleaner', icon: <Scissors size={16} />, color: 'text-emerald-400' },
      { id: 'email-header-analyzer', name: 'Header Analyzer', icon: <FileText size={16} />, color: 'text-orange-400' },
      { id: 'mime-encoder', name: 'MIME Tool', icon: <Code2 size={16} />, color: 'text-fuchsia-400' },
      { id: 'subject-encoder', name: 'Subject Encoder', icon: <Type size={16} />, color: 'text-fuchsia-500' },
    ]
  };

  const allToolsList = Object.values(tools).flat();

  const filteredTools = searchQuery.trim() 
    ? allToolsList.filter(t => t.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsAllToolsOpen(false);
    setIsMobileMenuOpen(false);
    setSearchQuery('');
    setIsSearchFocused(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isDark = theme === 'dark';

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDark ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center gap-4">
          <button 
            onClick={() => handleNavigate('home')} 
            className="flex items-center gap-2 group shrink-0"
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <Shield className="text-white" size={22} />
            </div>
            <span className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              TOOL<span className="text-indigo-500">BOX</span>
            </span>
          </button>

          <div className="hidden lg:flex items-center gap-1 ml-4 flex-1">
            <NavButton onClick={() => handleNavigate('bulk-blacklist')} label="BLACKLIST" theme={theme} />
            <NavButton onClick={() => handleNavigate('spamhaus-checker')} label="SPAMHAUS" theme={theme} />
            <NavButton onClick={() => handleNavigate('barracuda-checker')} label="BARRACUDA" theme={theme} />
            
            <div 
              className="relative"
              onMouseEnter={() => setIsAllToolsOpen(true)}
              onMouseLeave={() => setIsAllToolsOpen(false)}
            >
              <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}>
                TOOLS <ChevronDown size={14} className={`transition-transform duration-200 ${isAllToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {isAllToolsOpen && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 w-[840px] shadow-2xl rounded-3xl border p-8 grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Security</h3>
                    <div className="space-y-1">
                      {tools.authentication.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Network</h3>
                    <div className="space-y-1">
                      {tools.infrastructure.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Content</h3>
                    <div className="space-y-1">
                      {tools.design.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4 flex-1 justify-end">
            <div className="relative w-full max-w-[120px] md:max-w-[240px]" ref={searchRef}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                isDark 
                  ? 'bg-slate-950 border-slate-800 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50' 
                  : 'bg-slate-100 border-slate-200 focus-within:border-indigo-300 focus-within:ring-1 focus-within:ring-indigo-200'
              }`}>
                <SearchIcon size={16} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  placeholder="Search tools..."
                  className={`w-full bg-transparent border-none outline-none text-xs font-bold ${isDark ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-700 placeholder:text-slate-400'}`}
                />
              </div>

              {isSearchFocused && filteredTools.length > 0 && (
                <div className={`absolute top-full mt-2 w-full max-w-[280px] right-0 shadow-2xl rounded-2xl border p-2 animate-in fade-in slide-in-from-top-1 duration-200 overflow-hidden ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="max-h-60 overflow-y-auto custom-scrollbar">
                    {filteredTools.map(tool => (
                      <button
                        key={tool.id}
                        onClick={() => handleNavigate(tool.id)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group ${
                          isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-slate-950' : 'bg-slate-50'} group-hover:scale-110 transition-transform`}>
                          <span className={tool.color}>{tool.icon}</span>
                        </div>
                        <div>
                          <p className={`text-[11px] font-black uppercase tracking-tight ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {tool.name}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <button 
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition-all border shrink-0 ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <button 
              className={`lg:hidden p-2 rounded-lg shrink-0 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

const NavButton: React.FC<{ onClick: () => void; label: string; theme: string }> = ({ onClick, label, theme }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-[10px] font-black tracking-widest uppercase transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}>
    {label}
  </button>
);

const MegaMenuButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; theme: string; colorClass: string }> = ({ icon, label, onClick, theme, colorClass }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all group ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}>
    <div className={`p-2 rounded-lg transition-transform group-hover:scale-110 ${theme === 'dark' ? 'bg-slate-950' : 'bg-white shadow-sm border border-slate-100'}`}>
      <span className={colorClass}>{icon}</span>
    </div>
    <span className={`text-[11px] font-bold uppercase transition-colors ${theme === 'dark' ? 'text-slate-400 group-hover:text-white' : 'text-slate-600 group-hover:text-indigo-600'}`}>
      {label}
    </span>
  </button>
);

export default Navbar;