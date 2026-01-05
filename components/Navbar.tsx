
import React, { useState } from 'react';
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
  Type
} from 'lucide-react';

interface NavbarProps {
  onNavigate: (view: any) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onNavigate, theme, onToggleTheme }) => {
  const [isAllToolsOpen, setIsAllToolsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tools = {
    authentication: [
      { id: 'dkim-checker', name: 'Bulk DKIM', icon: <ShieldCheck size={16} />, color: 'text-emerald-400' },
      { id: 'spf-validator', name: 'SPF Validator', icon: <Globe size={16} />, color: 'text-amber-400' },
      { id: 'dmarc-checker', name: 'DMARC Audit', icon: <BarChart3 size={16} />, color: 'text-sky-400' },
      { id: 'caa-checker', name: 'CAA Policy', icon: <FileCheck size={16} />, color: 'text-teal-400' },
    ],
    infrastructure: [
      { id: 'mx-lookup', name: 'MX & Providers', icon: <Mail size={16} />, color: 'text-rose-400' },
      { id: 'dns-lookup', name: 'Deep DNS', icon: <SearchCode size={16} />, color: 'text-indigo-400' },
      { id: 'reverse-dns', name: 'Reverse DNS', icon: <Hash size={16} />, color: 'text-violet-400' },
    ],
    forensics: [
      { id: 'email-header-analyzer', name: 'Header Forensic', icon: <FileText size={16} />, color: 'text-orange-400' },
      { id: 'ip-geolocation', name: 'IP Geolocation', icon: <MapPin size={16} />, color: 'text-cyan-400' },
      { id: 'whois-checker', name: 'Domain Expiry', icon: <Calendar size={16} />, color: 'text-lime-400' },
      { id: 'mime-encoder', name: 'MIME Studio', icon: <Code2 size={16} />, color: 'text-fuchsia-400' },
      { id: 'subject-encoder', name: 'Subject Studio', icon: <Type size={16} />, color: 'text-fuchsia-500' },
    ]
  };

  const handleNavigate = (view: string) => {
    onNavigate(view);
    setIsAllToolsOpen(false);
    setIsMobileMenuOpen(false);
  };

  const isDark = theme === 'dark';

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${isDark ? 'bg-slate-900/80 border-slate-800 backdrop-blur-xl' : 'bg-white/90 border-slate-200 backdrop-blur-md'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <button 
            onClick={() => handleNavigate('home')} 
            className="flex items-center gap-2 group"
          >
            <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-600/20 group-hover:scale-110 transition-transform">
              <Shield className="text-white" size={22} />
            </div>
            <span className={`text-xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
              AUTH<span className="text-indigo-500">PRO</span>
            </span>
          </button>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1 ml-8">
            <NavButton onClick={() => handleNavigate('dkim-checker')} label="DKIM" active={false} theme={theme} />
            <NavButton onClick={() => handleNavigate('spf-validator')} label="SPF" active={false} theme={theme} />
            <NavButton onClick={() => handleNavigate('dmarc-checker')} label="DMARC" active={false} theme={theme} />
            
            <div 
              className="relative"
              onMouseEnter={() => setIsAllToolsOpen(true)}
              onMouseLeave={() => setIsAllToolsOpen(false)}
            >
              <button className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}>
                ALL TOOLS <ChevronDown size={14} className={`transition-transform duration-200 ${isAllToolsOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Mega Menu Dropdown */}
              {isAllToolsOpen && (
                <div className={`absolute top-full left-1/2 -translate-x-1/2 w-[800px] shadow-2xl rounded-2xl border p-8 grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-2 duration-200 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Security</h3>
                    <div className="space-y-1">
                      {tools.authentication.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Infrastructure</h3>
                    <div className="space-y-1">
                      {tools.infrastructure.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Forensics</h3>
                    <div className="space-y-1">
                      {tools.forensics.map(t => (
                        <MegaMenuButton key={t.id} icon={t.icon} label={t.name} onClick={() => handleNavigate(t.id)} theme={theme} colorClass={t.color} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onToggleTheme}
              className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200'}`}
              title="Toggle Theme"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Mobile Toggle */}
            <button 
              className={`lg:hidden p-2 rounded-lg ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className={`lg:hidden p-4 space-y-4 shadow-xl border-t ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <div className="grid grid-cols-1 gap-2">
             {Object.values(tools).flat().slice(0, 4).map(t => (
               <button key={t.id} onClick={() => handleNavigate(t.id)} className={`flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'}`}>
                 <span className={isDark ? t.color : 'text-indigo-600'}>{t.icon}</span> {t.name}
               </button>
             ))}
             <hr className={isDark ? 'border-slate-800' : 'border-slate-100'} />
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-3">All Intelligence Tools</p>
             <div className="grid grid-cols-2 gap-2">
                {Object.values(tools).flat().slice(4).map(t => (
                  <button key={t.id} onClick={() => handleNavigate(t.id)} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-bold ${isDark ? 'text-slate-400 hover:bg-slate-800' : 'text-slate-50 hover:bg-slate-100'}`}>
                    {t.name}
                  </button>
                ))}
             </div>
          </div>
        </div>
      )}
    </nav>
  );
};

const NavButton: React.FC<{ onClick: () => void; label: string; active: boolean; theme: string }> = ({ onClick, label, active, theme }) => (
  <button 
    onClick={onClick}
    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'}`}
  >
    {label}
  </button>
);

const MegaMenuButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; theme: string; colorClass: string }> = ({ icon, label, onClick, theme, colorClass }) => (
  <button 
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-3 rounded-xl group transition-all text-left ${theme === 'dark' ? 'hover:bg-slate-800' : 'hover:bg-slate-50'}`}
  >
    <div className={`transition-colors ${theme === 'dark' ? colorClass : 'text-slate-400 group-hover:text-indigo-600'}`}>
      {icon}
    </div>
    <span className={`text-sm font-bold transition-colors ${theme === 'dark' ? 'text-slate-300 group-hover:text-white' : 'text-slate-600 group-hover:text-slate-900'}`}>
      {label}
    </span>
  </button>
);

export default Navbar;
