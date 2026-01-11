import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Languages, 
  Copy, 
  Check, 
  Heart, 
  Search, 
  X, 
  Zap, 
  Sparkles, 
  Smile, 
  ArrowRight,
  Filter,
  Trash2,
  Terminal,
  Palette,
  Type,
  Star
} from 'lucide-react';
import { useNotify } from '../App';

interface FontStudioToolProps {
  onBack: () => void;
  theme: 'dark' | 'light';
}

interface FontStyle {
  name: string;
  category: 'fancy' | 'minimal' | 'weird' | 'symbols' | 'popular';
  transform: (text: string) => string;
}

const MAPS: Record<string, string[]> = {
  lower: "abcdefghijklmnopqrstuvwxyz".split(""),
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  digits: "0123456789".split(""),
  boldSerifUpper: "𝐀𝐁𝐂𝐃𝐄𝐅𝐆𝐇𝐈𝐉𝐊𝐋𝐌𝐍𝐎𝐏𝐐𝐑𝐒𝐓𝐔𝐕𝐖𝐗𝐘𝐙".match(/./gu) || [],
  boldSerifLower: "𝐚𝐛𝐜𝐝𝐞𝐟塑造ｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚ".match(/./gu) || [],
  boldSerifDigits: "𝟎𝟏𝟐𝟑𝟒𝟓𝟔𝟕𝟖𝟗".match(/./gu) || [],
  italicSerifUpper: "𝐴𝐵𝐶𝐷𝐸𝐹𝐺𝐻𝐼𝐽𝐾𝐿𝑀𝑁𝑂𝑃𝑄𝑅𝑆𝑇𝑈𝑉𝑊𝑋𝑌𝑍".match(/./gu) || [],
  italicSerifLower: "𝑎𝑏𝑐𝑑𝑒𝑓𝑔ℎ𝑖𝑗𝑘𝑙𝑚𝑛𝑜𝑝𝑞𝑟𝑠𝑡𝑢𝑣𝑤𝑥𝑦𝑧".match(/./gu) || [],
  boldSansUpper: "𝗔𝗕𝗖𝗗𝗘𝗙𝗚𝗛𝗜𝗝𝗞𝗟𝗠𝗡𝐎𝐏𝗤𝗥𝗦𝗧𝗨𝗩𝗪𝗫𝗬𝗭".match(/./gu) || [],
  boldSansLower: "𝗮𝗯𝗰ｄｅｆｇｈｉ碰ｋｌｍｎｏｐ𝗾𝗿𝘀𝘁ｕｖｗ𝘅ｙｚ".match(/./gu) || [],
  monoUpper: "𝙰𝙱𝙲𝙳𝙴𝙵𝙶𝙷𝙸𝙹𝙺𝙻𝙼𝙽𝙾𝙿𝚀𝚁𝚂𝚃𝚄𝚅𝚆𝚇𝚈𝚉".match(/./gu) || [],
  monoLower: "𝚊𝚋𝚌𝚍𝚎𝚏下ｈｉｊｋｌｍｎｏｐ𝚚𝚛ｓｔｕｖｗ𝘅ｙ𝚣".match(/./gu) || [],
  doubleStruckUpper: "𝔸𝔹ℂ𝔻𝔼𝔽𝔾ℍ𝕀𝕁𝕂𝕃𝕄ℕ𝕆ℙℚℝ𝕊𝕋𝕌𝕍𝕎𝕏𝕐ℤ".match(/./gu) || [],
  doubleStruckLower: "𝕒𝕓𝕔𝕕𝕖𝕗𝕘𝕙𝕚𝛂𝕜𝕝𝕞𝕟𝕠𝕡𝕢𝕣𝕤𝕥𝕦𝛔𝛎𝕨𝕩𝕪𝕫".match(/./gu) || [],
  scriptUpper: "𝒜𝐵𝒞𝒟𝐸𝐹𝐻𝐼𝒥𝒦𝐿𝑀𝒩𝒪𝒫𝒬𝑅𝒮𝒯𝒰𝒱𝒲𝒳𝒴𝒵".match(/./gu) || [],
  scriptLower: "𝒶𝒷𝒸𝒹𝑒𝒻𝑔𝒽𝒾𝒿𝓀𝓁𝓂𝓃𝑜𝓅𝓆𝓇𝓈𝓉𝓊𝓋𝓌𝓍𝓎𝓏".match(/./gu) || [],
  frakturUpper: "𝔄𝔅ℭ𝔇𝔈𝔊ℌℑ𝔍𝔎𝔏𝔐𝔑𝔒𝔓𝔔ℜ𝔖𝔗𝘜𝔙𝔚𝔛𝔜ℨ".match(/./gu) || [],
  frakturLower: "𝔞𝔟𝔠𝔡𝔢𝔣𝔤𝔥𝔦𝔧𝔨𝔩𝔪𝔫𝔬𝔭𝔮𝔯𝔰𝔱𝔲𝔳𝔴𝔵𝔶𝔷".match(/./gu) || [],
  circledUpper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ".match(/./gu) || [],
  circledLower: "ⓐⓑⓒⓓⓔⓕⓖⓗⓘⓙⓚⓛⓜⓝⓞⓟⓠⓡⓢⓣⓤⓥⓦⓧⓨⓩ".match(/./gu) || [],
  smallCaps: "ᴀʙᴄᴅᴇꜰɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ".split(""),
  fullwidth: "ＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ".match(/./gu) || [],
  bubbleUpper: "ⒶⒷⒸⒹⒺⒻⒼⒽⒾⒿⓀⓁⓂⓃⓄⓅⓆⓇⓈⓉⓊⓋⓌⓍⓎⓏ".match(/./gu) || [],
  squareUpper: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄼🄽🄾🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉".match(/./gu) || [],
  darkCircle: "🅐🅑🅒🅓🅔🅕🅖🅗🅘🅙🅚🅛🅜🅝🅞🅟🅠🅡🅢🅣🅤🅥🅦🅧🅨🅩".match(/./gu) || [],
  darkSquare: "🄰🄱🄲🄳🄴🄵🄶🄷🄸🄹🄺🄼🄽🄞🄿🅀🅁🅂🅃🅄🅅🅆🅇🅈🅉".match(/./gu) || [],
};

const applyMap = (text: string, upperMap?: string[], lowerMap?: string[], digitMap?: string[]) => {
  return text.split('').map(char => {
    if (upperMap && /[A-Z]/.test(char)) return upperMap[char.charCodeAt(0) - 65] || char;
    if (lowerMap && /[a-z]/.test(char)) return lowerMap[char.charCodeAt(0) - 97] || char;
    if (digitMap && /[0-9]/.test(char)) return digitMap[char.charCodeAt(0) - 48] || char;
    return char;
  }).join('');
};

const generateStyles = (): FontStyle[] => {
  const styles: FontStyle[] = [
    { name: 'Bold Serif', category: 'popular', transform: (t) => applyMap(t, MAPS.boldSerifUpper, MAPS.boldSerifLower, MAPS.boldSerifDigits) },
    { name: 'Italic Serif', category: 'popular', transform: (t) => applyMap(t, MAPS.italicSerifUpper, MAPS.italicSerifLower) },
    { name: 'Bold Sans', category: 'popular', transform: (t) => applyMap(t, MAPS.boldSansUpper, MAPS.boldSansLower) },
    { name: 'Monospace', category: 'minimal', transform: (t) => applyMap(t, MAPS.monoUpper, MAPS.monoLower) },
    { name: 'Small Caps', category: 'popular', transform: (t) => applyMap(t.toLowerCase(), MAPS.smallCaps, MAPS.smallCaps) },
    { name: 'Double Struck', category: 'fancy', transform: (t) => applyMap(t, MAPS.doubleStruckUpper, MAPS.doubleStruckLower) },
    { name: 'Medieval Script', category: 'fancy', transform: (t) => applyMap(t, MAPS.scriptUpper, MAPS.scriptLower) },
    { name: 'Old Fraktur', category: 'fancy', transform: (t) => applyMap(t, MAPS.frakturUpper, MAPS.frakturLower) },
    { name: 'Bubble Text', category: 'symbols', transform: (t) => applyMap(t.toUpperCase(), MAPS.bubbleUpper, MAPS.bubbleUpper) },
    { name: 'Square Frame', category: 'symbols', transform: (t) => applyMap(t.toUpperCase(), MAPS.squareUpper, MAPS.squareUpper) },
    { name: 'Dark Circles', category: 'symbols', transform: (t) => applyMap(t.toUpperCase(), MAPS.darkCircle, MAPS.darkCircle) },
    { name: 'Fullwidth Vapor', category: 'minimal', transform: (t) => applyMap(t.toUpperCase(), MAPS.fullwidth, MAPS.fullwidth) },
    { name: 'S.p.a.c.e.d', category: 'minimal', transform: (t) => t.split('').join(' ') },
    { name: 'D.o.t.t.e.d', category: 'minimal', transform: (t) => t.split('').join('.') },
    { name: 'S/l/a/s/h/e/d', category: 'weird', transform: (t) => t.split('').join('/') },
    { name: 'Mirror Image', category: 'weird', transform: (t) => {
      const map: any = {"a":"ɒ","b":"d","c":"ɔ","d":"b","e":"ɘ","f":"Ꮈ","g":"ϱ","h":"ʜ","i":"i","j":"ꞁ","k":"ʞ","l":"l","m":"m","n":"n","o":"o","p":"q","q":"p","r":"ɿ","s":"ꙅ","t":"ƚ","u":"u","v":"v","w":"w","x":"x","y":"ʏ","z":"ƹ"};
      return t.toLowerCase().split('').reverse().map(c => map[c] || c).join('');
    }},
    { name: 'Upside Down', category: 'weird', transform: (t) => {
      const map: any = {"a":"ɐ","b":"q","c":"ɔ","d":"p","e":"ǝ","f":"ɟ","g":"ƃ","h":"ɥ","i":"ı","j":"ɾ","k":"ʞ","l":"l","m":"ɯ","n":"u","o":"o","p":"d","q":"b","r":"ɹ","s":"s","t":"ʇ","u":"n","v":"ʌ","w":"ʍ","x":"x","y":"ʎ","z":"z"};
      return t.toLowerCase().split('').reverse().map(c => map[c] || c).join('');
    }},
  ];

  const bases = [
    { n: 'Bold', fn: (t: string) => applyMap(t, MAPS.boldSerifUpper, MAPS.boldSerifLower) },
    { n: 'Mono', fn: (t: string) => applyMap(t, MAPS.monoUpper, MAPS.monoLower) },
    { n: 'Script', fn: (t: string) => applyMap(t, MAPS.scriptUpper, MAPS.scriptLower) },
    { n: 'Fraktur', fn: (t: string) => applyMap(t, MAPS.frakturUpper, MAPS.frakturLower) },
    { n: 'Double', fn: (t: string) => applyMap(t, MAPS.doubleStruckUpper, MAPS.doubleStruckLower) },
    { n: 'Small', fn: (t: string) => applyMap(t.toLowerCase(), MAPS.smallCaps, MAPS.smallCaps) }
  ];

  const decorators = [
    { n: 'Sparkle', wrap: (t: string) => `✨ ${t} ✨` },
    { n: 'Heart', wrap: (t: string) => `❤️ ${t} ❤️` },
    { n: 'Starry', wrap: (t: string) => `★ ${t} ★` },
    { n: 'Winged', wrap: (t: string) => `╰╮ ${t} ╭╯` },
    { n: 'Ocean', wrap: (t: string) => `≋ ${t} ≋` },
    { n: 'Ghost', wrap: (t: string) => `꧁ ${t} ꧂` },
    { n: 'Crown', wrap: (t: string) => `👑 ${t} 👑` },
    { n: 'Fire', wrap: (t: string) => `🔥 ${t} 🔥` },
    { n: 'Diamond', wrap: (t: string) => `◈ ${t} ◈` },
    { n: 'Arrow', wrap: (t: string) => `» ${t} «` },
    { n: 'Crossed', wrap: (t: string) => `♱ ${t} ♱` },
    { n: 'Bracket', wrap: (t: string) => `【 ${t} 】` },
    { n: 'Flower', wrap: (t: string) => `✿ ${t} ✿` },
    { n: 'Ribbon', wrap: (t: string) => `🎗️ ${t} 🎗️` },
    { n: 'Shield', wrap: (t: string) => `🛡️ ${t} 🛡️` },
    { n: 'Music', wrap: (t: string) => `♫ ${t} ♫` },
    { n: 'Moon', wrap: (t: string) => `☾ ${t} ☽` },
    { n: 'Lightning', wrap: (t: string) => `⚡ ${t} ⚡` },
    { n: 'Robot', wrap: (t: string) => `[ ${t} ]` },
    { n: 'Target', wrap: (t: string) => `◎ ${t} ◎` },
  ];

  bases.forEach(b => {
    decorators.forEach(d => {
      styles.push({
        name: `${b.n} ${d.n}`,
        category: 'fancy',
        transform: (t) => d.wrap(b.fn(t))
      });
    });
  });

  return styles.slice(0, 150);
};

const GENERATED_STYLES = generateStyles();

const EMOJI_CATEGORIES = [
  { id: 'smileys', name: 'Smileys', icon: <Smile size={16} />, emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️'] },
  { id: 'hearts', name: 'Hearts', icon: <Heart size={16} />, emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { id: 'symbols', name: 'Symbols', icon: <Sparkles size={16} />, emojis: ['✨', '⭐', '🌟', '💫', '🔥', '💥', '💢', '💦', '💨', '💤', '💠', '🌀', '♾️', '✅', '☑️', '✔️', '❌', '❎', '➕', '➖', '➗', '✖️', '❓', '❔', '❕', '❗', '💯', '🚫', '⚠️', '☢️', '☣️', '⬆️', '↗️', '➡️', '↘️', '⬇️', '↙️', '⬅️', '↖️', '↕️', '↔️', '↩️', '↪️', '⤴️', '⤵️'] }
];

const FontStudioTool: React.FC<FontStudioToolProps> = ({ onBack, theme }) => {
  const { notify } = useNotify();
  const isDark = theme === 'dark';
  
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'fonts' | 'emojis' | 'favorites'>('fonts');
  const [fontFilter, setFontFilter] = useState<'all' | 'fancy' | 'minimal' | 'weird' | 'symbols' | 'popular'>('all');
  const [favoriteFonts, setFavoriteFonts] = useState<string[]>([]);
  const [favoriteEmojis, setFavoriteEmojis] = useState<string[]>([]);
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [multiEmoji, setMultiEmoji] = useState<string[]>([]);
  const [emojiSearch, setEmojiSearch] = useState('');

  useEffect(() => {
    const savedFavs = localStorage.getItem('es-font-favs');
    const savedEmojiFavs = localStorage.getItem('es-emoji-favs');
    const savedRecent = localStorage.getItem('es-emoji-recent');
    if (savedFavs) setFavoriteFonts(JSON.parse(savedFavs));
    if (savedEmojiFavs) setFavoriteEmojis(JSON.parse(savedEmojiFavs));
    if (savedRecent) setRecentEmojis(JSON.parse(savedRecent));
  }, []);

  const saveToStorage = (key: string, data: any) => {
    localStorage.setItem(key, JSON.stringify(data));
  };

  const toggleFavoriteFont = (name: string) => {
    setFavoriteFonts(prev => {
      const next = prev.includes(name) ? prev.filter(f => f !== name) : [...prev, name];
      saveToStorage('es-font-favs', next);
      return next;
    });
  };

  const toggleFavoriteEmoji = (emoji: string) => {
    setFavoriteEmojis(prev => {
      const next = prev.includes(emoji) ? prev.filter(e => e !== emoji) : [...prev, emoji];
      saveToStorage('es-emoji-favs', next);
      return next;
    });
  };

  const addToRecent = (emoji: string) => {
    setRecentEmojis(prev => {
      const filtered = prev.filter(e => e !== emoji);
      const next = [emoji, ...filtered].slice(0, 36);
      saveToStorage('es-emoji-recent', next);
      return next;
    });
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    notify('success', 'Copied to clipboard');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const previewText = inputText || 'Type your message...';

  const fontResults = useMemo(() => {
    return GENERATED_STYLES.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = fontFilter === 'all' || f.category === fontFilter;
      return matchesSearch && matchesFilter;
    }).map(style => ({
      ...style,
      result: style.transform(previewText)
    }));
  }, [previewText, searchQuery, fontFilter]);

  const favoritesList = useMemo(() => {
    return GENERATED_STYLES.filter(f => favoriteFonts.includes(f.name)).map(style => ({
      ...style,
      result: style.transform(previewText)
    }));
  }, [previewText, favoriteFonts]);

  const emojiSearchResults = useMemo(() => {
    if (!emojiSearch) return null;
    const q = emojiSearch.toLowerCase();
    return EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(q) || q.length < 2);
  }, [emojiSearch]);

  const handleEmojiClick = (emoji: string) => {
    setMultiEmoji(prev => [...prev, emoji]);
    addToRecent(emoji);
  };

  const inputClasses = isDark ? 'bg-[#05080f] border-[#1e293b] text-slate-200 focus:border-orange-500' : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-orange-600';

  return (
    <div className={`flex flex-col gap-0 overflow-hidden ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      <header className={`shrink-0 z-50 border-b shadow-lg ${isDark ? 'bg-[#0f172a]/90 border-slate-800' : 'bg-white/90 border-slate-200'} backdrop-blur-xl sticky top-0`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className={`p-2 rounded-xl transition-all border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white' : 'bg-slate-100 border-slate-200 text-slate-600'}`}>
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-orange-600 p-1.5 rounded-lg text-white shadow-xl">
                <Languages size={20} />
              </div>
              <h1 className="text-sm font-black uppercase tracking-widest hidden sm:block">Font Studio</h1>
            </div>
          </div>

          <div className="flex p-1 rounded-xl bg-black/20 border border-slate-800">
            <TabButton active={activeTab === 'fonts'} onClick={() => setActiveTab('fonts')} icon={<Type size={14}/>} label="Fonts" />
            <TabButton active={activeTab === 'emojis'} onClick={() => setActiveTab('emojis')} icon={<Smile size={14}/>} label="Emojis" />
            <TabButton active={activeTab === 'favorites'} onClick={() => setActiveTab('favorites')} icon={<Heart size={14}/>} label="Favs" />
          </div>
        </div>

        {(activeTab === 'fonts' || activeTab === 'favorites') && (
          <div className="px-6 pb-4 max-w-7xl mx-auto w-full animate-in slide-in-from-top-2">
            <div className={`relative flex items-center p-1 rounded-2xl border transition-all ${isDark ? 'bg-slate-950 border-slate-800 focus-within:border-orange-500' : 'bg-slate-50 border-slate-200'}`}>
              <Terminal size={18} className="absolute left-5 text-orange-500" />
              <input 
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type your message here..."
                className="w-full pl-12 pr-4 py-4 bg-transparent outline-none font-black text-xl md:text-2xl placeholder:opacity-40"
              />
              {inputText && (
                <button onClick={() => setInputText('')} className="p-3 text-slate-500 hover:text-rose-500 transition-colors">
                  <X size={20} />
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-auto custom-scrollbar p-6 min-h-[600px]">
        <div className="max-w-7xl mx-auto space-y-6 pb-12">
          
          {activeTab === 'fonts' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0">
                  <FilterChip active={fontFilter === 'all'} onClick={() => setFontFilter('all')} label="All Styles" />
                  <FilterChip active={fontFilter === 'popular'} onClick={() => setFontFilter('popular')} label="Popular" />
                  <FilterChip active={fontFilter === 'fancy'} onClick={() => setFontFilter('fancy')} label="Fancy" />
                  <FilterChip active={fontFilter === 'minimal'} onClick={() => setFontFilter('minimal')} label="Minimal" />
                  <FilterChip active={fontFilter === 'weird'} onClick={() => setFontFilter('weird')} label="Weird" />
                </div>
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search styles..."
                    className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs outline-none border transition-all ${inputClasses}`}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {fontResults.map((f, i) => (
                  <FontRow key={`${f.name}-${i}`} style={f} onCopy={() => copyText(f.result, f.name)} onToggleFav={() => toggleFavoriteFont(f.name)} isFavorite={favoriteFonts.includes(f.name)} isCopied={copiedId === f.name} isDark={isDark} />
                ))}
              </div>
            </>
          )}

          {activeTab === 'emojis' && (
            <div className="flex flex-col gap-6">
              <div className={`sticky top-[140px] z-10 p-4 rounded-3xl border shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-top-4 ${isDark ? 'bg-slate-900 border-orange-500/20' : 'bg-white border-orange-500/20'}`}>
                <div className="flex-1 flex flex-wrap gap-2 items-center min-h-[40px]">
                  {multiEmoji.length === 0 ? (
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-widest px-4">Combine emojis...</span>
                  ) : (
                    multiEmoji.map((e, idx) => (
                      <button key={idx} onClick={() => setMultiEmoji(prev => prev.filter((_, i) => i !== idx))} className="text-2xl hover:scale-125 transition-all">{e}</button>
                    ))
                  )}
                </div>
                <div className="flex gap-2 shrink-0">
                   {multiEmoji.length > 0 && <button onClick={() => setMultiEmoji([])} className="p-3 text-rose-500 hover:bg-rose-500/10 rounded-2xl"><Trash2 size={18} /></button>}
                   <button disabled={multiEmoji.length === 0} onClick={() => copyText(multiEmoji.join(''), 'multi')} className="px-6 py-3 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50">
                     {copiedId === 'multi' ? 'COPIED' : 'COPY ALL'}
                   </button>
                </div>
              </div>

              <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                 <input value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} placeholder="Search emoji..." className={`w-full pl-12 pr-4 py-4 rounded-[1.5rem] border outline-none font-bold transition-all ${inputClasses}`} />
              </div>

              {emojiSearch && emojiSearchResults && (
                <EmojiGrid title={`Results for "${emojiSearch}"`} emojis={emojiSearchResults} onClick={handleEmojiClick} onToggleFav={toggleFavoriteEmoji} favorites={favoriteEmojis} isDark={isDark} />
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <EmojiGrid title="Recently Used" emojis={recentEmojis} onClick={handleEmojiClick} onToggleFav={toggleFavoriteEmoji} favorites={favoriteEmojis} isDark={isDark} compact />
                <EmojiGrid title="Saved Emojis" emojis={favoriteEmojis} onClick={handleEmojiClick} onToggleFav={toggleFavoriteEmoji} favorites={favoriteEmojis} isDark={isDark} compact />
              </div>

              {EMOJI_CATEGORIES.map(cat => (
                <EmojiGrid key={cat.id} title={cat.name} icon={cat.icon} emojis={cat.emojis} onClick={handleEmojiClick} onToggleFav={toggleFavoriteEmoji} favorites={favoriteEmojis} isDark={isDark} />
              ))}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div className="space-y-8">
               {favoritesList.length === 0 && favoriteEmojis.length === 0 && (
                 <div className="py-24 text-center opacity-30 flex flex-col items-center gap-6">
                    <Star size={64} strokeWidth={1} />
                    <p className="text-[10px] font-black uppercase tracking-widest">No favorites found</p>
                 </div>
               )}
               {favoritesList.length > 0 && (
                 <section>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2"><Palette size={16} className="text-orange-500"/> Favorite Fonts</h3>
                    <div className="flex flex-col gap-3">
                      {favoritesList.map((f, i) => (
                        <FontRow key={`${f.name}-${i}`} style={f} onCopy={() => copyText(f.result, f.name)} onToggleFav={() => toggleFavoriteFont(f.name)} isFavorite={true} isCopied={copiedId === f.name} isDark={isDark} />
                      ))}
                    </div>
                 </section>
               )}
               {favoriteEmojis.length > 0 && <EmojiGrid title="Saved Emojis" emojis={favoriteEmojis} onClick={handleEmojiClick} onToggleFav={toggleFavoriteEmoji} favorites={favoriteEmojis} isDark={isDark} />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TabButton = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-50 hover:text-slate-300'}`}>
    {icon} {label}
  </button>
);

const FilterChip = ({ active, onClick, label }: any) => (
  <button onClick={onClick} className={`shrink-0 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${active ? 'bg-orange-600/10 text-orange-500 border-orange-500/50 shadow-md' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
    {label}
  </button>
);

const FontRow = ({ style, onCopy, onToggleFav, isFavorite, isCopied, isDark }: any) => (
  <div className={`group flex flex-col md:flex-row items-start md:items-center justify-between p-6 rounded-2xl border transition-all duration-300 ${isDark ? 'bg-[#0a0f18] border-slate-800 hover:border-orange-500/40' : 'bg-white border-slate-100 hover:shadow-lg'}`}>
    <div className="flex flex-col mb-2 md:mb-0 md:flex-1">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">{style.name}</span>
        <span className={`text-[8px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded ${isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-50 text-slate-400'}`}>{style.category}</span>
      </div>
      <div className={`text-2xl md:text-3xl font-bold tracking-tight break-all leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
        {style.result}
      </div>
    </div>
    <div className="flex items-center gap-3 w-full md:w-auto mt-3 md:mt-0">
      <button onClick={onToggleFav} title="Add to Favorites" className={`p-3 rounded-xl transition-all ${isFavorite ? 'text-orange-500 bg-orange-500/10' : 'text-slate-600 hover:text-orange-500'}`}>
        <Heart size={22} fill={isFavorite ? "currentColor" : "none"} />
      </button>
      <button onClick={onCopy} title={isCopied ? "Copied" : "Copy to Clipboard"} className={`p-4 rounded-xl flex items-center justify-center transition-all ${isCopied ? 'bg-emerald-600 text-white shadow-lg' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-600/20'}`}>
        {isCopied ? <Check size={20}/> : <Copy size={20}/>}
      </button>
    </div>
  </div>
);

const EmojiGrid = ({ title, icon, emojis, onClick, onToggleFav, favorites, isDark, compact }: any) => {
  if (emojis.length === 0 && compact) return null;
  return (
    <section className={`p-6 rounded-[2rem] border ${isDark ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-slate-100'}`}>
      <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">{icon} {title}</h3>
      <div className="grid grid-cols-6 sm:grid-cols-10 lg:grid-cols-12 gap-2">
        {emojis.map((e: string, i: number) => (
          <div key={i} className="group relative">
            <button onClick={() => onClick(e)} className={`w-full aspect-square flex items-center justify-center text-3xl rounded-2xl border transition-all hover:scale-125 hover:z-20 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>{e}</button>
            <button onClick={(ev) => { ev.stopPropagation(); onToggleFav(e); }} className={`absolute -top-1 -right-1 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-30 ${favorites.includes(e) ? 'opacity-100 text-orange-500' : 'text-slate-400'}`}>
              <Heart size={10} fill={favorites.includes(e) ? "currentColor" : "none"} />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FontStudioTool;