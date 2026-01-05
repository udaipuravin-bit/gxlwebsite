
import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Home from './components/Home';
import DkimTool from './components/DkimTool';
import DmarcTool from './components/DmarcTool';
import SpfTool from './components/SpfTool';
import DnsLookupTool from './components/DnsLookupTool';
import MxTool from './components/MxTool';
import WhoisTool from './components/WhoisTool';
import ReverseDnsTool from './components/ReverseDnsTool';
import CaaTool from './components/CaaTool';
import EmailHeaderTool from './components/EmailHeaderTool';
import IpGeoTool from './components/IpGeoTool';
import MimeEncoderTool from './components/MimeEncoderTool';
import SubjectEncoderTool from './components/SubjectEncoderTool';

type View = 'home' | 'dkim-checker' | 'dmarc-checker' | 'spf-validator' | 'dns-lookup' | 'mx-lookup' | 'whois-checker' | 'reverse-dns' | 'caa-checker' | 'email-header-analyzer' | 'ip-geolocation' | 'mime-encoder' | 'subject-encoder';
type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [theme, setTheme] = useState<Theme>('dark');

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/30`}>
      <Navbar 
        onNavigate={(view) => setCurrentView(view)} 
        theme={theme} 
        onToggleTheme={toggleTheme} 
      />
      
      <main className="min-h-[calc(100vh-64px)]">
        {currentView === 'home' && (
          <Home 
            theme={theme}
            onLaunchDkim={() => setCurrentView('dkim-checker')} 
            onLaunchDmarc={() => setCurrentView('dmarc-checker')} 
            onLaunchSpf={() => setCurrentView('spf-validator')}
            onLaunchDns={() => setCurrentView('dns-lookup')}
            onLaunchMx={() => setCurrentView('mx-lookup')}
            onLaunchWhois={() => setCurrentView('whois-checker')}
            onLaunchReverseDns={() => setCurrentView('reverse-dns')}
            onLaunchCaa={() => setCurrentView('caa-checker')}
            onLaunchHeaderAnalyzer={() => setCurrentView('email-header-analyzer')}
            onLaunchIpGeo={() => setCurrentView('ip-geolocation')}
            onLaunchMimeEncoder={() => setCurrentView('mime-encoder')}
            onLaunchSubjectEncoder={() => setCurrentView('subject-encoder')}
          />
        )}
        {currentView === 'dkim-checker' && <DkimTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'dmarc-checker' && <DmarcTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'spf-validator' && <SpfTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'dns-lookup' && <DnsLookupTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'mx-lookup' && <MxTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'whois-checker' && <WhoisTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'reverse-dns' && <ReverseDnsTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'caa-checker' && <CaaTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'email-header-analyzer' && <EmailHeaderTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'ip-geolocation' && <IpGeoTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'mime-encoder' && <MimeEncoderTool theme={theme} onBack={() => setCurrentView('home')} />}
        {currentView === 'subject-encoder' && <SubjectEncoderTool theme={theme} onBack={() => setCurrentView('home')} />}
      </main>
    </div>
  );
};

export default App;
