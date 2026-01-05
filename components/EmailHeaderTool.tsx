
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  FileText, 
  Play, 
  Loader2, 
  Trash2, 
  ShieldCheck, 
  ShieldAlert, 
  History, 
  Mail, 
  Info,
  CheckCircle2,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { HeaderAnalysisResult, EmailHop } from '../types';

interface EmailHeaderToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const EmailHeaderTool: React.FC<EmailHeaderToolProps> = ({ onBack, theme }) => {
  const isDark = theme === 'dark';
  const [headerInput, setHeaderInput] = useState('');
  const [analysis, setAnalysis] = useState<HeaderAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const performBasicParse = (header: string): HeaderAnalysisResult => {
    const lines = header.split(/\r?\n/);
    const getVal = (key: string) => lines.find(l => l.toLowerCase().startsWith(key.toLowerCase()))?.split(': ')[1] || 'Unknown';

    // Basic Hop Parser
    const receivedLines = lines.filter(l => l.toLowerCase().startsWith('received:'));
    const hops: EmailHop[] = receivedLines.map((line, i) => ({
      hop: receivedLines.length - i,
      from: line.match(/from\s+([^\s]+)/i)?.[1] || 'Unknown',
      by: line.match(/by\s+([^\s]+)/i)?.[1] || 'Unknown',
      with: line.match(/with\s+([^\s]+)/i)?.[1] || 'SMTP',
      id: 'ID-' + Math.random().toString(36).substr(2, 5),
      date: line.split(';').pop()?.trim() || 'Unknown',
      delaySeconds: 0
    }));

    return {
      summary: {
        from: getVal('from'),
        to: getVal('to'),
        subject: getVal('subject'),
        date: getVal('date'),
        messageId: getVal('message-id'),
        returnPath: getVal('return-path'),
        authenticated: header.toLowerCase().includes('dkim=pass') || header.toLowerCase().includes('spf=pass'),
        riskLevel: 'low'
      },
      auth: {
        spf: header.match(/spf=([^\s;]+)/i)?.[1] || 'Not Found',
        dkim: header.match(/dkim=([^\s;]+)/i)?.[1] || 'Not Found',
        dmarc: header.match(/dmarc=([^\s;]+)/i)?.[1] || 'Not Found'
      },
      hops,
      anomalies: header.toLowerCase().includes('spam-score') ? ['Header contains Spam-Score markers'] : [],
      recommendations: ['Enable DMARC p=reject for highest security', 'Verify SPF lookup limit is < 10']
    };
  };

  const handleAnalyze = () => {
    if (!headerInput.trim()) return;
    setIsAnalyzing(true);
    setTimeout(() => {
      setAnalysis(performBasicParse(headerInput));
      setIsAnalyzing(false);
    }, 1000);
  };

  const cardClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const inputClasses = isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900';

  return (
    <div className="min-h-screen p-4 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto">
      <header className={`flex items-center justify-between p-6 rounded-2xl border shadow-xl ${cardClasses}`}>
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-xl border transition-colors ${isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 hover:bg-slate-200'}`}>
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2.5 rounded-xl text-white shadow-lg shadow-orange-500/20">
              <FileText size={24} />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight">Header Analyzer</h1>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className={`p-6 rounded-2xl border shadow-xl ${cardClasses}`}>
          <label className="text-xs font-black text-slate-500 uppercase mb-3 block tracking-widest">Raw Header</label>
          <textarea
            value={headerInput}
            onChange={(e) => setHeaderInput(e.target.value)}
            className={`w-full h-[400px] p-4 border rounded-xl font-mono text-xs outline-none transition-all focus:ring-2 focus:ring-orange-500/50 ${inputClasses}`}
            placeholder="Paste raw email header..."
          />
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !headerInput.trim()}
            className="w-full mt-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
          >
            {isAnalyzing ? <Loader2 className="animate-spin mx-auto" /> : 'Analyze Path'}
          </button>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {analysis ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className={`p-6 rounded-2xl border shadow-xl flex items-center gap-6 ${cardClasses}`}>
                 <div className={`p-4 rounded-xl ${analysis.summary.authenticated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                   {analysis.summary.authenticated ? <ShieldCheck size={32} /> : <ShieldAlert size={32} />}
                 </div>
                 <div>
                    <h2 className="text-xl font-bold">{analysis.summary.authenticated ? 'Authenticated' : 'Unverified'}</h2>
                    <p className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{analysis.summary.subject}</p>
                 </div>
              </div>

              <div className={`p-6 rounded-2xl border shadow-xl ${cardClasses}`}>
                 <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-4 flex items-center gap-2">
                    <History size={14}/> Routing Hops
                 </h3>
                 <div className="space-y-3">
                    {analysis.hops.map(h => (
                      <div key={h.hop} className={`p-3 rounded-lg border flex justify-between items-center transition-colors hover:border-slate-600/50 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                         <div className="flex gap-4 items-center">
                            <span className="text-xs font-black text-slate-500">{h.hop}</span>
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{h.by}</span>
                         </div>
                         <span className="text-[10px] font-mono text-slate-500">{h.date}</span>
                      </div>
                    ))}
                 </div>
              </div>
            </div>
          ) : (
            <div className={`h-full min-h-[400px] rounded-3xl border border-dashed flex flex-col items-center justify-center ${isDark ? 'border-slate-800 bg-slate-900/20' : 'border-slate-200 bg-slate-50/50'}`}>
               <Mail className="text-slate-700 mb-2" size={48} />
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">Awaiting Header Input</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailHeaderTool;
