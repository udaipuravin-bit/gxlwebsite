
import React, { useState, createContext, useContext, useCallback } from 'react';
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
import EmailMasterTool from './components/EmailMasterTool';
import SpamhausTool from './components/SpamhausTool';
import SpamCopTool from './components/SpamCopTool';
import BarracudaTool from './components/BarracudaTool';
import UrlTracerTool from './components/UrlTracerTool';
import HtmlCleanerTool from './components/HtmlCleanerTool';
import EmailBuilderTool from './components/EmailBuilderTool';
import GrapesBuilderTool from './components/GrapesBuilderTool';
import RecordMatcherTool from './components/RecordMatcherTool';
import BulkBlacklistTool from './components/BulkBlacklistTool';
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react';

type View = 'home' | 'dkim-checker' | 'dmarc-checker' | 'spf-validator' | 'dns-lookup' | 'mx-lookup' | 'whois-checker' | 'reverse-dns' | 'caa-checker' | 'email-header-analyzer' | 'ip-geolocation' | 'mime-encoder' | 'subject-encoder' | 'email-master' | 'spamhaus-checker' | 'spamcop-checker' | 'barracuda-checker' | 'url-tracer' | 'html-cleaner' | 'email-builder' | 'grapes-builder' | 'record-matcher' | 'bulk-blacklist';
type Theme = 'dark' | 'light';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
}

interface NotificationContextType {
  notify: (type: NotificationType, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotify = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotify must be used within a NotificationProvider');
  return context;
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [theme, setTheme] = useState<Theme>('dark');
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const notify = useCallback((type: NotificationType, message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark';

  const navigate = (view: View) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fullScreenViews: View[] = ['html-cleaner', 'email-master', 'email-builder', 'grapes-builder'];

  return (
    <NotificationContext.Provider value={{ notify }}>
      <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'} selection:bg-indigo-500/30`}>
        {!fullScreenViews.includes(currentView) && (
          <Navbar 
            onNavigate={(view) => navigate(view as View)} 
            theme={theme} 
            onToggleTheme={toggleTheme} 
          />
        )}
        
        <main className={`relative z-0 ${fullScreenViews.includes(currentView) ? 'pt-0' : 'pt-16'}`}>
          {currentView === 'home' && (
            <Home 
              theme={theme}
              onLaunchDkim={() => navigate('dkim-checker')} 
              onLaunchDmarc={() => navigate('dmarc-checker')} 
              onLaunchSpf={() => navigate('spf-validator')}
              onLaunchDns={() => navigate('dns-lookup')}
              onLaunchMx={() => navigate('mx-lookup')}
              onLaunchWhois={() => navigate('whois-checker')}
              onLaunchReverseDns={() => navigate('reverse-dns')}
              onLaunchCaa={() => navigate('caa-checker')}
              onLaunchHeaderAnalyzer={() => navigate('email-header-analyzer')}
              onLaunchIpGeo={() => navigate('ip-geolocation')}
              onLaunchMimeEncoder={() => navigate('mime-encoder')}
              onLaunchSubjectEncoder={() => navigate('subject-encoder')}
              onLaunchEmailMaster={() => navigate('email-master')}
              onLaunchSpamhaus={() => navigate('spamhaus-checker')}
              onLaunchSpamCop={() => navigate('spamcop-checker')}
              onLaunchBarracuda={() => navigate('barracuda-checker')}
              onLaunchUrlTracer={() => navigate('url-tracer')}
              onLaunchHtmlCleaner={() => navigate('html-cleaner')}
              onLaunchEmailBuilder={() => navigate('email-builder')}
              onLaunchGrapesBuilder={() => navigate('grapes-builder')}
              onLaunchRecordMatcher={() => navigate('record-matcher')}
              onLaunchBulkBlacklist={() => navigate('bulk-blacklist')}
            />
          )}
          {currentView === 'dkim-checker' && <DkimTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'dmarc-checker' && <DmarcTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'spf-validator' && <SpfTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'dns-lookup' && <DnsLookupTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'mx-lookup' && <MxTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'whois-checker' && <WhoisTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'reverse-dns' && <ReverseDnsTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'caa-checker' && <CaaTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'email-header-analyzer' && <EmailHeaderTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'ip-geolocation' && <IpGeoTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'mime-encoder' && <MimeEncoderTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'subject-encoder' && <SubjectEncoderTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'email-master' && <EmailMasterTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'spamhaus-checker' && <SpamhausTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'spamcop-checker' && <SpamCopTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'barracuda-checker' && <BarracudaTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'url-tracer' && <UrlTracerTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'html-cleaner' && <HtmlCleanerTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'email-builder' && <EmailBuilderTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'grapes-builder' && <GrapesBuilderTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'record-matcher' && <RecordMatcherTool theme={theme} onBack={() => navigate('home')} />}
          {currentView === 'bulk-blacklist' && <BulkBlacklistTool theme={theme} onBack={() => navigate('home')} />}
        </main>

        <div className="fixed top-6 right-6 z-[10000] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
          {notifications.map(n => (
            <div 
              key={n.id} 
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl shadow-2xl border backdrop-blur-md animate-notification ${
                n.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                n.type === 'error' ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' :
                n.type === 'warning' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' :
                'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {n.type === 'success' && <CheckCircle2 size={18} />}
                {n.type === 'error' && <AlertCircle size={18} />}
                {n.type === 'warning' && <AlertTriangle size={18} />}
                {n.type === 'info' && <Info size={18} />}
              </div>
              <p className="flex-1 text-sm font-bold leading-snug">{n.message}</p>
              <button 
                onClick={() => removeNotification(n.id)}
                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </NotificationContext.Provider>
  );
};

export default App;
