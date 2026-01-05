
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ArrowLeft, 
  Code2, 
  Eye, 
  RotateCcw,
  Copy,
  Check,
  Download,
  Smartphone,
  Monitor,
  Mail,
  Sun,
  Moon,
  Zap,
  Play,
  Lock,
  Unlock,
  GripVertical
} from 'lucide-react';
import Editor from '@monaco-editor/react';
import { processMimeContent } from '../services/mimeService';

interface EmailMasterToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    padding: 20px;
    margin: 0;
  }
  .container {
    background-color: #ffffff;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    max-width: 600px;
    margin: 20px auto;
  }
  h1 {
    color: #333;
    font-size: 24px;
  }
  p {
    color: #666;
    line-height: 1.6;
  }
  .btn {
    display: inline-block;
    padding: 12px 24px;
    background-color: #6366f1;
    color: #ffffff;
    text-decoration: none;
    border-radius: 6px;
    font-weight: bold;
    margin-top: 20px;
  }
</style>
</head>
<body>
  <div class="container">
    <h1>Welcome to Email Master</h1>
    <p>This is a W3Schools-style HTML editor designed for email engineers.</p>
    <p>Edit the code on the left and see the results on the right in real-time.</p>
    <a href="#" class="btn">Learn More</a>
  </div>
</body>
</html>`;

const EmailMasterTool: React.FC<EmailMasterToolProps> = ({ onBack, theme: initialTheme }) => {
  const [code, setCode] = useState(DEFAULT_HTML);
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>(initialTheme);
  const [splitPosition, setSplitPosition] = useState(50);
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile' | 'email'>('desktop');
  const [jsEnabled, setJsEnabled] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [srcDoc, setSrcDoc] = useState('');
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync theme with localStorage
  useEffect(() => {
    const saved = localStorage.getItem('email-master-theme');
    if (saved === 'dark' || saved === 'light') setActiveTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = activeTheme === 'dark' ? 'light' : 'dark';
    setActiveTheme(next);
    localStorage.setItem('email-master-theme', next);
  };

  // Draggable Divider Logic
  const startResizing = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (isResizing && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const newWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;
      setSplitPosition(Math.max(15, Math.min(85, newWidth)));
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [isResizing, resize, stopResizing]);

  // Preview Update with Debounce and Script Removal
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Clean scripts if disabled
      const content = jsEnabled ? code : code.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, '');
      setSrcDoc(content || ' '); // Use space to ensure iframe clears correctly
    }, 300);
    return () => clearTimeout(timeout);
  }, [code, jsEnabled]);

  const handleAction = (action: 'base64' | 'quoted-printable' | 'auto') => {
    try {
      const decoded = processMimeContent(code, action, 'decode');
      setCode(decoded);
    } catch (err) {
      alert("Decoding failed. Check your input format.");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadHtml = () => {
    const blob = new Blob([code], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'email_template.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetEditor = () => {
    if (confirm("Reset editor to default template?")) setCode(DEFAULT_HTML);
  };

  const isDark = activeTheme === 'dark';
  const toolbarClasses = isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900';
  const paneClasses = isDark ? 'bg-slate-950' : 'bg-slate-50';

  return (
    <div className={`h-[calc(100vh-64px)] flex flex-col overflow-hidden select-none ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Top Toolbar */}
      <header className={`shrink-0 h-14 px-4 flex items-center justify-between border-b shadow-sm z-[100] ${toolbarClasses}`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white">
              <Code2 size={16} />
            </div>
            <h1 className="text-sm font-black uppercase tracking-widest hidden sm:block">Email Master</h1>
          </div>
          <div className="h-6 w-px bg-slate-800 mx-2 hidden md:block" />
          <div className="flex items-center gap-1">
             <ToolButton onClick={() => setCode(code)} icon={<Play size={14}/>} label="Run" color="emerald" isDark={isDark} />
             <ToolButton onClick={resetEditor} icon={<RotateCcw size={14}/>} label="Reset" isDark={isDark} />
             <ToolButton onClick={copyCode} icon={copied ? <Check size={14} className="text-emerald-500"/> : <Copy size={14}/>} label={copied ? "Copied" : "Copy"} isDark={isDark} />
             <ToolButton onClick={downloadHtml} icon={<Download size={14}/>} label="Download" isDark={isDark} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex p-1 rounded-lg bg-black/20 mr-2 md:mr-4 border border-slate-800">
             <DecodeButton onClick={() => handleAction('base64')} label="B64" isDark={isDark} />
             <DecodeButton onClick={() => handleAction('quoted-printable')} label="QP" isDark={isDark} />
             <DecodeButton onClick={() => handleAction('auto')} label="Auto" isDark={isDark} highlight />
          </div>
          <button 
            onClick={toggleTheme}
            className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors ${isDark ? 'text-yellow-400' : 'text-slate-600'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button 
            onClick={() => setJsEnabled(!jsEnabled)}
            className={`p-2 rounded-lg hover:bg-slate-500/10 transition-colors ${jsEnabled ? 'text-emerald-400' : 'text-slate-500'}`}
            title={jsEnabled ? "JS Enabled" : "JS Disabled"}
          >
            {jsEnabled ? <Unlock size={18}/> : <Lock size={18}/>}
          </button>
        </div>
      </header>

      {/* Main Split Editor */}
      <div ref={containerRef} className="flex-1 flex min-h-0 relative select-text">
        
        {/* Editor Pane */}
        <div style={{ width: `${splitPosition}%` }} className="h-full relative overflow-hidden flex flex-col bg-[#1e1e1e] transition-[width] duration-0">
          <div className="h-8 bg-[#252526] flex items-center px-4 justify-between border-b border-[#333] shrink-0">
             <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Source Editor (HTML)</span>
             <span className="text-[9px] font-mono text-slate-600">UTF-8</span>
          </div>
          <div className="flex-1 min-h-0">
            <Editor
              height="100%"
              defaultLanguage="html"
              theme={isDark ? "vs-dark" : "light"}
              value={code}
              onChange={(v) => setCode(v || '')}
              options={{
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                minimap: { enabled: false },
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 10 },
                smoothScrolling: true,
                cursorSmoothCaretAnimation: "on",
                bracketPairColorization: { enabled: true },
                suggest: { showWords: false, snippetsPreventQuickSuggestions: true },
                quickSuggestions: false,
                parameterHints: { enabled: false },
              }}
            />
          </div>
        </div>

        {/* Resizer */}
        <div 
          onMouseDown={startResizing}
          onDoubleClick={() => setSplitPosition(50)}
          className={`w-1 h-full cursor-col-resize z-[150] flex items-center justify-center transition-all group shrink-0 ${isDark ? 'bg-slate-900 border-x border-slate-800' : 'bg-slate-200 border-x border-slate-300'} hover:bg-indigo-600`}
        >
          <div className="w-4 h-8 bg-slate-800/50 rounded-md border border-slate-700/50 flex items-center justify-center group-hover:bg-indigo-700 transition-colors group-hover:scale-110">
            <GripVertical size={12} className="text-slate-400 group-hover:text-white" />
          </div>
        </div>

        {/* Preview Pane */}
        <div style={{ width: `${100 - splitPosition}%` }} className={`h-full flex flex-col relative transition-[width] duration-0 ${paneClasses}`}>
          {/*Resizing overlay to prevent iframe stealing mouse events*/}
          {isResizing && <div className="absolute inset-0 z-[200] cursor-col-resize" />}
          
          <div className={`h-8 px-4 flex items-center justify-between border-b shrink-0 ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Live Preview</span>
             </div>
             <div className="flex items-center gap-1">
                <PreviewModeButton active={previewMode === 'desktop'} onClick={() => setPreviewMode('desktop')} icon={<Monitor size={12}/>} isDark={isDark} />
                <PreviewModeButton active={previewMode === 'mobile'} onClick={() => setPreviewMode('mobile')} icon={<Smartphone size={12}/>} isDark={isDark} />
                <PreviewModeButton active={previewMode === 'email'} onClick={() => setPreviewMode('email')} icon={<Mail size={12}/>} isDark={isDark} />
             </div>
          </div>
          
          <div className="flex-1 overflow-hidden flex items-center justify-center bg-[#f0f0f0] p-4">
             <div 
              className={`h-full bg-white shadow-2xl transition-all duration-300 relative overflow-hidden ${
                previewMode === 'mobile' ? 'max-w-[375px] w-full border-[12px] border-slate-900 rounded-[2.5rem]' :
                previewMode === 'email' ? 'max-w-[600px] w-full shadow-lg' :
                'w-full rounded-md'
              }`}
             >
               {previewMode === 'mobile' && <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-slate-900 rounded-b-xl z-10" />}
               <iframe 
                srcDoc={srcDoc}
                className="w-full h-full border-none bg-white rounded-inherit"
                title="Live HTML Preview"
                sandbox="allow-scripts allow-popups allow-forms"
               />
               {previewMode === 'mobile' && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-700 rounded-full" />}
             </div>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <footer className={`shrink-0 h-6 px-4 flex items-center justify-between text-[9px] font-black uppercase tracking-widest border-t z-[100] ${toolbarClasses}`}>
        <div className="flex gap-4">
           <span>Bytes: {new Blob([code]).size}</span>
           <span>Mode: {previewMode}</span>
        </div>
        <div className="flex gap-2">
           <span className="text-indigo-500">Authenticator Pro Engine</span>
        </div>
      </footer>
    </div>
  );
};

const ToolButton: React.FC<{ onClick: () => void; icon: React.ReactNode; label: string; color?: string; isDark: boolean }> = ({ onClick, icon, label, color, isDark }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-bold transition-all ${
      color === 'emerald' ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-md' : 
      isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    {icon} {label}
  </button>
);

const DecodeButton: React.FC<{ onClick: () => void; label: string; isDark: boolean; highlight?: boolean }> = ({ onClick, label, isDark, highlight }) => (
  <button 
    onClick={onClick}
    className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${
      highlight ? 'text-indigo-400 hover:bg-indigo-500/10' :
      isDark ? 'text-slate-500 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-500 hover:bg-white'
    }`}
  >
    {label}
  </button>
);

const PreviewModeButton: React.FC<{ active: boolean; onClick: () => void; icon: React.ReactNode; isDark: boolean }> = ({ active, onClick, icon, isDark }) => (
  <button 
    onClick={onClick}
    className={`p-1.5 rounded transition-all ${
      active ? (isDark ? 'bg-slate-800 text-indigo-400' : 'bg-slate-100 text-indigo-600') :
      (isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-400 hover:text-slate-600')
    }`}
  >
    {icon}
  </button>
);

export default EmailMasterTool;
