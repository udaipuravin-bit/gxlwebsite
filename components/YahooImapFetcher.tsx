
import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Mail, 
  Lock, 
  User, 
  CloudDownload, 
  Loader2, 
  Search, 
  Eye, 
  Code, 
  X, 
  ExternalLink, 
  Zap, 
  Terminal, 
  ShieldCheck,
  FileCode,
  Layout,
  Globe,
  Monitor,
  FolderOpen,
  Hash,
  ArrowRight,
  FileText,
  Settings2,
  Database
} from 'lucide-react';
import { YahooEmail } from '../types';
import { autoDecode, decodeBase64, decodeQuotedPrintable } from '../services/mimeService';
import { useNotify } from '../App';

interface YahooImapFetcherProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const YAHOO_FOLDERS = [
  { id: 'INBOX', name: 'Inbox' },
  { id: 'Bulk Mail', name: 'Spam / Bulk' },
  { id: 'Sent', name: 'Sent' }
];

const YahooImapFetcher: React.FC<YahooImapFetcherProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';

  // Mode: 'imap' (Simulation) or 'source' (Real Parser)
  const [opMode, setOpMode] = useState<'imap' | 'source'>('source');
  
  // IMAP Simulation states
  const [emailId, setEmailId] = useState('');
  const [appPassword, setAppPassword] = useState('');
  const [selectedFolder, setSelectedFolder] = useState('INBOX');
  const [startRange, setStartRange] = useState('1');
  const [endRange, setEndRange] = useState('5');
  
  // Real Parser states
  const [rawSourceInput, setRawSourceInput] = useState('');
  
  const [isFetching, setIsFetching] = useState(false);
  const [emails, setEmails] = useState<YahooEmail[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal states
  const [selectedEmail, setSelectedEmail] = useState<YahooEmail | null>(null);
  const [modalMode, setModalMode] = useState<'preview' | 'source' | null>(null);

  const parseRawSource = (source: string): YahooEmail | null => {
    try {
      const getHeader = (name: string) => {
        const regex = new RegExp(`^${name}:\\s*(.*)`, 'im');
        const match = source.match(regex);
        return match ? match[1].trim() : 'N/A';
      };

      const fromHeader = getHeader('From');
      const fromMatch = fromHeader.match(/(.*)<(.*)>/) || [null, fromHeader, fromHeader];
      
      // Attempt to find Origin IP in Received headers
      const receivedMatch = source.match(/Received: from .* \[((\d{1,3}\.){3}\d{1,3})\]/i);
      const originIp = receivedMatch ? receivedMatch[1] : 'Unknown';

      // Very basic HTML part extraction (RFC boundary searching)
      // This looks for common HTML patterns if complex MIME structure isn't fully parsed
      let htmlBody = "";
      if (source.includes('Content-Type: text/html')) {
        const parts = source.split(/Content-Type: text\/html/i);
        if (parts.length > 1) {
          const bodyPart = parts[1].split(/--[a-zA-Z0-9'()+_,-./:=? ]+/)[0];
          const encodingMatch = bodyPart.match(/Content-Transfer-Encoding:\s*(\S+)/i);
          const encoding = encodingMatch ? encodingMatch[1].toLowerCase() : '7bit';
          
          // Strip headers from the MIME part
          const actualContent = bodyPart.split(/\r?\n\r?\n/).slice(1).join('\n');
          
          if (encoding === 'base64') htmlBody = actualContent;
          else if (encoding === 'quoted-printable') htmlBody = actualContent;
          else htmlBody = btoa(actualContent); // Encode to match state expectations
        }
      }

      return {
        uid: Math.floor(Math.random() * 1000).toString(),
        subject: autoDecode(getHeader('Subject')),
        fromName: autoDecode(fromMatch[1].trim() || 'Sender'),
        fromEmail: fromMatch[2].replace(/[<>]/g, '').trim(),
        originIp,
        listUnsubscribe: getHeader('List-Unsubscribe'),
        messageId: getHeader('Message-ID'),
        returnPath: getHeader('Return-Path'),
        htmlContent: htmlBody || btoa("<h3>No HTML content identified in this part</h3>"),
        fullSource: source,
        date: getHeader('Date')
      };
    } catch (e) {
      return null;
    }
  };

  const handleProcess = async () => {
    if (opMode === 'imap') {
      if (!emailId.trim() || !appPassword.trim()) {
        notify('warning', 'Please provide Yahoo credentials.');
        return;
      }
      setIsFetching(true);
      notify('info', 'Engaging IMAP Simulation...');
      setTimeout(() => {
        setIsFetching(false);
        notify('error', 'CORS Restriction: Direct browser-to-IMAP connection blocked. Use "Direct Source Audit" mode.');
      }, 1500);
    } else {
      if (!rawSourceInput.trim()) {
        notify('warning', 'Paste raw email source to analyze.');
        return;
      }
      setIsFetching(true);
      const parsed = parseRawSource(rawSourceInput);
      if (parsed) {
        setEmails([parsed, ...emails]);
        setRawSourceInput('');
        notify('success', 'Email source parsed & decoded successfully.');
      } else {
        notify('error', 'Forensic parsing failed. Ensure you copied the FULL source.');
      }
      setIsFetching(false);
    }
  };

  const filteredEmails = useMemo(() => {
    return emails.filter(e => 
      e.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.fromEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.fromName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [emails, searchQuery]);

  const cardClasses = isDark ? 'bg-[#0a0f18] border-[#1e293b] text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  const openModal = (email: YahooEmail, mode: 'preview' | 'source') => {
    setSelectedEmail(email);
    setModalMode(mode);
  };

  const closeModal = () => {
    setSelectedEmail(null);
    setModalMode(null);
  };

  return (
    <div className="min-h-screen px-4 pt-3 pb-8 md:px-8 md:pt-4 md:pb-8 flex flex-col gap-6 max-w-full mx-auto animate-in fade-in duration-500">
      <header className={`flex items-center justify-between p-5 rounded-3xl shadow-2xl border ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2.5 rounded-2xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-600 p-2.5 rounded-2xl text-white shadow-xl">
              <CloudDownload size={28} />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight uppercase text-orange-500">Yahoo Fetcher</h1>
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest opacity-60">Forensic Source Analyzer</p>
            </div>
          </div>
        </div>
        
        <div className={`flex p-1 rounded-2xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
           <button onClick={() => setOpMode('source')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${opMode === 'source' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>Real Data Parser</button>
           <button onClick={() => setOpMode('imap')} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${opMode === 'imap' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500'}`}>IMAP Proxy (Sim)</button>
        </div>
      </header>

      <div className={`p-8 rounded-[2.5rem] shadow-xl border flex flex-col gap-6 ${cardClasses}`}>
        {opMode === 'imap' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} className="text-orange-500" /> Yahoo Email ID
              </label>
              <input type="text" value={emailId} onChange={(e) => setEmailId(e.target.value)} placeholder="user@yahoo.com" className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm ${inputClasses}`} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Lock size={12} className="text-orange-500" /> App Password
              </label>
              <input type="password" value={appPassword} onChange={(e) => setAppPassword(e.target.value)} placeholder="•••• •••• •••• ••••" className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm ${inputClasses}`} />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <FolderOpen size={12} className="text-orange-500" /> Remote Folder
              </label>
              <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm transition-all appearance-none cursor-pointer ${inputClasses}`}>
                {YAHOO_FOLDERS.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Hash size={12} className="text-orange-500" /> Fetch Range
              </label>
              <div className="flex items-center gap-2">
                <input type="number" value={startRange} onChange={(e) => setStartRange(e.target.value)} className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm text-center ${inputClasses}`} />
                <ArrowRight size={16} className="text-slate-500" />
                <input type="number" value={endRange} onChange={(e) => setEndRange(e.target.value)} className={`w-full p-3.5 border rounded-2xl outline-none font-bold text-sm text-center ${inputClasses}`} />
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
             <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                   <Terminal size={12} className="text-orange-500" /> Paste Full Message Source (RFC-822)
                </label>
                <a href="https://help.yahoo.com/kb/SLN2202.html" target="_blank" className="text-[9px] font-black text-orange-500 hover:underline uppercase tracking-widest">How to get source?</a>
             </div>
             <textarea 
                value={rawSourceInput}
                onChange={(e) => setRawSourceInput(e.target.value)}
                placeholder="Paste the 'View Raw Message' content here..."
                className={`w-full h-40 p-5 border rounded-[2rem] outline-none font-mono text-xs transition-all resize-none custom-scrollbar ${inputClasses}`}
             />
          </div>
        )}
        
        <button
          onClick={handleProcess}
          disabled={isFetching}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl shadow-orange-600/20 disabled:opacity-50 flex items-center justify-center gap-3 transition-all"
        >
          {isFetching ? <><Loader2 size={16} className="animate-spin" /> EXECUTING...</> : <><Zap size={16} /> {opMode === 'imap' ? 'START IMAP BRIDGE' : 'ANALYZE REAL SOURCE'}</>}
        </button>
      </div>

      {emails.length > 0 && (
        <div className={`rounded-[2.5rem] shadow-2xl border overflow-hidden flex flex-col ${cardClasses}`}>
          <div className="p-6 border-b flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-orange-500/10 p-2 rounded-xl text-orange-500">
                 <Database size={16} />
              </div>
              <h2 className="text-[10px] font-black uppercase tracking-widest">Parsed Audit Results</h2>
            </div>
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
              <input type="text" placeholder="Filter subjects/senders..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`w-full pl-11 pr-4 py-3 border rounded-2xl outline-none text-xs font-bold ${inputClasses}`} />
            </div>
            <button onClick={() => setEmails([])} className="p-3 bg-rose-500/10 text-rose-500 rounded-2xl hover:bg-rose-500/20 transition-all"><X size={18}/></button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className={`${isDark ? 'bg-[#05080f] border-[#1e293b]' : 'bg-slate-50 border-slate-100'} border-b text-[10px] font-black uppercase tracking-widest text-slate-500`}>
                  <th className="px-6 py-4 w-16 text-center">UID</th>
                  <th className="px-6 py-4">Sender</th>
                  <th className="px-6 py-4">Subject & Message ID</th>
                  <th className="px-6 py-4">Network Fingerprint</th>
                  <th className="px-6 py-4 text-center">Diagnostics</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e293b]' : 'divide-slate-100'}`}>
                {filteredEmails.map((email) => (
                  <tr key={email.uid} className="hover:bg-orange-500/5 transition-colors group">
                    <td className="px-6 py-4 text-center font-mono text-[10px] font-bold text-slate-500">{email.uid}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`text-sm font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{email.fromName}</span>
                        <span className="text-[10px] text-orange-500 font-bold">{email.fromEmail}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col max-w-xs">
                        <span className={`text-xs font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{email.subject}</span>
                        <span className="text-[9px] text-slate-500 font-mono mt-0.5 truncate">{email.messageId}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                             <Globe size={10} className="text-orange-400" />
                             <span className="text-[10px] font-mono font-bold text-slate-500">{email.originIp}</span>
                          </div>
                          <span className="text-[9px] text-slate-600 truncate max-w-[150px]">Return: {email.returnPath}</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openModal(email, 'preview')} className="p-2.5 rounded-xl bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white transition-all border border-orange-500/20" title="Decode HTML Body"><Eye size={16} /></button>
                          <button onClick={() => openModal(email, 'source')} className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-all border border-slate-700" title="Full Source Matrix"><Code size={16} /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Popup */}
      {selectedEmail && modalMode && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in duration-200">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeModal} />
           <div className={`relative w-full max-w-6xl h-full max-h-[85vh] flex flex-col rounded-[2.5rem] border shadow-2xl overflow-hidden ${cardClasses}`}>
              <header className="shrink-0 p-6 border-b flex items-center justify-between">
                 <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-2xl ${modalMode === 'preview' ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                       {modalMode === 'preview' ? <Layout size={20} /> : <FileCode size={20} />}
                    </div>
                    <div>
                       <h3 className="text-sm font-black uppercase tracking-widest">{modalMode === 'preview' ? 'HTML Template Preview' : 'Raw Forensic Source'}</h3>
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest truncate max-w-md">{selectedEmail.subject}</p>
                    </div>
                 </div>
                 <button onClick={closeModal} className="p-3 bg-slate-900 rounded-2xl text-slate-500 hover:text-white transition-colors"><X size={20} /></button>
              </header>
              <div className="flex-1 overflow-hidden p-6">
                 {modalMode === 'preview' ? (
                   <div className="h-full flex flex-col gap-4">
                      <div className="shrink-0 flex items-center gap-4 px-4 py-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
                         <div className="flex items-center gap-2 text-[9px] font-black uppercase text-orange-500"><Monitor size={12} /> Auto-Decoded Engine</div>
                         <span className="text-[9px] font-bold text-slate-600">Base64 & Quoted-Printable Compliant</span>
                      </div>
                      <div className="flex-1 bg-white rounded-[1.5rem] overflow-hidden shadow-inner border border-slate-200">
                         <iframe srcDoc={autoDecode(selectedEmail.htmlContent)} className="w-full h-full border-none" title="Email Preview" />
                      </div>
                   </div>
                 ) : (
                   <pre className={`h-full overflow-auto custom-scrollbar p-6 rounded-[1.5rem] border font-mono text-[11px] leading-relaxed ${isDark ? 'bg-slate-950 border-slate-800 text-orange-400/80' : 'bg-slate-50 border-slate-100 text-slate-700'}`}>
                      {selectedEmail.fullSource}
                   </pre>
                 )}
              </div>
              <footer className="shrink-0 px-6 py-4 border-t flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-widest">
                 <div className="flex gap-4">
                    <span>UID: {selectedEmail.uid}</span>
                    <span>Date: {selectedEmail.date}</span>
                 </div>
                 <button onClick={() => { navigator.clipboard.writeText(modalMode === 'preview' ? autoDecode(selectedEmail.htmlContent) : selectedEmail.fullSource); notify('success', 'Copied to clipboard.'); }} className="px-6 py-2 bg-orange-600 rounded-xl text-white hover:bg-orange-500 transition-colors">Copy to Clipboard</button>
              </footer>
           </div>
        </div>
      )}

      <footer className={`shrink-0 pt-10 border-t flex justify-between items-center text-[10px] font-black text-slate-600 uppercase tracking-widest ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
        <p>© {new Date().getFullYear()} Email Sparks Lab • Yahoo Forensic Node</p>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5 text-emerald-500"><ShieldCheck size={12}/> Browser Sandbox</span>
          <span className="opacity-40">|</span>
          <a href="#" className="hover:text-orange-500 transition-colors">Intelligence Matrix</a>
        </div>
      </footer>
    </div>
  );
};

export default YahooImapFetcher;
