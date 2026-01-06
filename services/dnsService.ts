import { DnsResponse, DnsLookupEntry, MxRecord, WhoisResult, PtrResult, CaaRecord } from '../types';

const RECORD_TYPE_MAP: Record<string, number> = {
  'A': 1,
  'AAAA': 28,
  'MX': 15,
  'TXT': 16,
  'NS': 2,
  'CNAME': 5,
  'SOA': 6,
  'PTR': 12,
  'CAA': 257
};

// Internal DQS Master Key
const DQS_INTERNAL_KEY = 'cnrmf6qnuzmpx57lve7mtvhr2q';

// Updated PHP API Base URL as requested
const PHP_API_URL = 'https://shadow-7dfgdfx.serv00.net/ipchecker';

// Token Caching
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const getCaaDescription = (tag: string, value: string): string => {
  const cleanTag = tag.toLowerCase();
  const cleanValue = value.replace(/"/g, '');
  if (cleanTag === 'issue') return `Only ${cleanValue} is authorized to issue certificates.`;
  if (cleanTag === 'issuewild') return `Only ${cleanValue} is authorized to issue wildcard certificates.`;
  if (cleanTag === 'iodef') return `Unauthorized issuance requests will be reported to ${cleanValue}.`;
  if (cleanTag === 'contactemail') return `CAs can contact the domain owner via ${cleanValue}.`;
  if (cleanTag === 'contactphone') return `CAs can contact the owner at ${cleanValue}.`;
  return `Custom policy defined for property: ${tag}.`;
};

const detectProvider = (hostname: string): string => {
  const host = hostname.toLowerCase();
  if (host.includes('google.com') || host.includes('googlemail.com')) return 'Google Workspace';
  if (host.includes('outlook.com') || host.includes('protection.outlook.com')) return 'Microsoft 365';
  if (host.includes('zoho.com') || host.includes('zoho.eu')) return 'Zoho Mail';
  if (host.includes('amazonaws.com')) return 'Amazon SES';
  if (host.includes('yahoodns.net') || host.includes('yahoo.com')) return 'Yahoo';
  if (host.includes('secureserver.net')) return 'GoDaddy';
  if (host.includes('mimecast.com')) return 'Mimecast';
  if (host.includes('pphosted.com')) return 'Proofpoint';
  if (host.includes('icloud.com') || host.includes('apple.com')) return 'Apple iCloud';
  if (host.includes('protonmail.ch') || host.includes('proton.me')) return 'Proton Mail';
  if (host.includes('fastmail.com')) return 'Fastmail';
  if (host.includes('mailgun.org')) return 'Mailgun';
  if (host.includes('sendgrid.net')) return 'SendGrid';
  if (host.includes('mandrillapp.com')) return 'Mandrill';
  return 'Custom / Private';
};

const ipToArpa = (ip: string): string | null => {
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Regex.test(ip)) return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  return null;
};

const reverseIpv6 = (ip: string): string => {
  const parts = ip.split(':');
  let expanded = '';
  for (const part of parts) {
    if (part === '') {
      const missing = 8 - parts.filter(p => p !== '').length;
      expanded += '0000'.repeat(missing);
    } else expanded += part.padStart(4, '0');
  }
  return expanded.split('').reverse().join('.');
};

export const lookupDkimRecord = async (domain: string, selector: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=${selector}._domainkey.${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) return data.Answer.map(ans => ans.data.replace(/"/g, '')).join('');
    return null;
  } catch (error) { throw error; }
};

export const lookupDmarcRecord = async (domain: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => ans.data.replace(/"/g, '')).find(txt => txt.toUpperCase().startsWith('V=DMARC1')) || null;
    }
    return null;
  } catch (error) { throw error; }
};

export const lookupSpfRecord = async (domain: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => ans.data.replace(/"/g, '')).find(txt => txt.toLowerCase().startsWith('v=spf1')) || null;
    }
    return null;
  } catch (error) { throw error; }
};

export const lookupRecordByType = async (domain: string, type: string): Promise<DnsLookupEntry[]> => {
  const typeId = RECORD_TYPE_MAP[type];
  if (!typeId) return [];
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=${typeId}`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) return data.Answer.map(ans => ({ type, name: ans.name, value: ans.data, ttl: ans.TTL }));
    return [];
  } catch (error) { throw error; }
};

export const lookupCaaRecords = async (domain: string): Promise<CaaRecord[]> => {
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=257`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => {
        const parts = ans.data.split(/\s+/);
        const flag = parseInt(parts[0], 10);
        const tag = parts[1];
        const value = parts.slice(2).join(' ').replace(/"/g, '');
        return { flag, tag, value, description: getCaaDescription(tag, value) };
      });
    }
    return [];
  } catch (error) { throw error; }
};

export const lookupMxRecords = async (domain: string): Promise<MxRecord[]> => {
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=15`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => {
        const parts = ans.data.split(/\s+/);
        return { priority: parseInt(parts[0], 10), exchange: (parts[1] || '').replace(/\.$/, ''), provider: detectProvider(parts[1] || '') };
      }).sort((a, b) => a.priority - b.priority);
    }
    return [];
  } catch (error) { throw error; }
};

export const lookupPtrRecord = async (ip: string): Promise<string | null> => {
  const arpaName = ipToArpa(ip);
  if (!arpaName) return null;
  const queryUrl = `https://dns.google/resolve?name=${arpaName}&type=12`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer && data.Answer.length > 0) return data.Answer[0].data.replace(/\.$/, '');
    return null;
  } catch (error) { throw error; }
};

export const lookupWhoisData = async (domain: string): Promise<Omit<WhoisResult, 'id' | 'loadingStatus'> | null> => {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) return null;
    const data = await response.json();
    const createdEvent = (data.events || []).find((e: any) => e.eventAction === 'registration');
    const expiryEvent = (data.events || []).find((e: any) => e.eventAction === 'expiration');
    const createdDate = createdEvent ? createdEvent.eventDate : '';
    const expiryDate = expiryEvent ? expiryEvent.eventDate : '';
    let daysRemaining = 0;
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      daysRemaining = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
    const registrarEntity = (data.entities || []).find((e: any) => e.roles?.includes('registrar'));
    const registrar = registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || 'Unknown';
    return { domain, registrar, createdDate, expiryDate, daysRemaining, status: data.status || [], raw: data };
  } catch (error) { return null; }
};

interface SpamhausQueryResult {
  dataset: string; // Internal Zone Name (ZEN/DBL)
  lists: string[]; // Actual List Names (XBL, SBL, etc)
  listed: boolean;
  reason: string;
  codes: string[];
}

const getSpamhausListNames = (code: string, zone: string): string[] => {
  const last = code.split('.').pop() || '';
  if (zone === 'ZEN') {
    if (last === '2') return ['SBL'];
    if (last === '3') return ['CSS'];
    if (['4','5','6','7'].includes(last)) return ['XBL'];
    if (last === '9') return ['SBL-DROP'];
    if (['10','11'].includes(last)) return ['PBL'];
  } else if (zone === 'DBL') {
    return ['DBL'];
  }
  return [];
};

const getSpamhausReason = (code: string, dataset: string): string => {
  const parts = code.split('.');
  const last = parts[parts.length - 1];
  if (dataset === 'ZEN') {
    switch (last) {
      case '1': return 'Error: Unauthorized DQS Key';
      case '2': return 'SBL - Spamhaus Block List';
      case '3': return 'SBL-CSS - Spamhaus CSS (Spam Source)';
      case '4': 
      case '5': 
      case '6': 
      case '7': return 'XBL - Exploits Block List (Malware/Botnet)';
      case '9': return 'SBL-DROP - Spamhaus DROP (Hijacked Space)';
      case '10': return 'PBL - Policy Block List (ISP Dynamics)';
      case '11': return 'PBL - Policy Block List (Non-MTA Space)';
      case '20': return 'AuthBL - Compromised Credentials';
      default: return 'Listed (ZEN)';
    }
  } else if (dataset === 'DBL') {
    const codeNum = parseInt(last);
    if (codeNum === 255) return 'Error: Invalid DQS Key / Unauthorized';
    if (codeNum === 2) return 'Bad Domain - Spam Source';
    if (codeNum === 4) return 'Bad Domain - Phishing';
    if (codeNum === 5) return 'Bad Domain - Malware';
    if (codeNum === 6) return 'Bad Domain - Botnet C2';
    if (codeNum >= 102 && codeNum <= 106) return 'Abused Legitimate Domain';
    return 'Listed (DBL)';
  }
  return 'Listed';
};

export const lookupSpamhausReputation = async (target: string, type: 'ip' | 'domain'): Promise<SpamhausQueryResult[]> => {
  const results: SpamhausQueryResult[] = [];
  const zones = type === 'ip' ? [{ name: 'ZEN', host: 'zen.dq.spamhaus.net' }] : [{ name: 'DBL', host: 'dbl.dq.spamhaus.net' }];
  for (const zone of zones) {
    let query = type === 'ip' ? (target.includes(':') ? `${reverseIpv6(target)}.${DQS_INTERNAL_KEY}.${zone.host}` : `${target.split('.').reverse().join('.')}.${DQS_INTERNAL_KEY}.${zone.host}`) : `${target}.${DQS_INTERNAL_KEY}.${zone.host}`;
    const url = `https://dns.google/resolve?name=${query}&type=A`;
    try {
      const res = await fetch(url);
      const data: DnsResponse = await res.json();
      if (data.Status === 0 && data.Answer) {
        const codes = data.Answer.map(ans => ans.data);
        const hasDqsError = codes.some(c => (zone.name === 'ZEN' && c === '127.0.0.1') || (zone.name === 'DBL' && c === '127.0.1.255'));
        results.push({
          dataset: zone.name,
          lists: codes.flatMap(c => getSpamhausListNames(c, zone.name)),
          listed: !hasDqsError,
          reason: hasDqsError ? 'Unauthorized / Invalid DQS Key' : codes.map(c => getSpamhausReason(c, zone.name)).join(', '),
          codes
        });
      } else {
        results.push({ dataset: zone.name, lists: [], listed: false, reason: 'Not listed', codes: [] });
      }
    } catch (e) { throw new Error('DQS infrastructure timeout'); }
  }
  return results;
};

/**
 * Format date precisely as: Tue, 06 Jan 2026 6:25 PM IST
 */
const formatDate = (unix: number): string => {
  const d = new Date(unix * 1000);
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  };
  // format returns string like "Tue, 06 Jan 2026, 6:25 PM" depending on locale
  // We force a specific look
  const parts = new Intl.DateTimeFormat('en-IN', options).formatToParts(d);
  const find = (type: string) => parts.find(p => p.type === type)?.value || '';
  
  const weekday = find('weekday');
  const day = find('day').padStart(2, '0');
  const month = find('month');
  const year = find('year');
  const hour = find('hour');
  const minute = find('minute');
  const dayPeriod = find('dayPeriod').toUpperCase();
  
  return `${weekday}, ${day} ${month} ${year} ${hour}:${minute} ${dayPeriod} IST`;
};

/**
 * Token Management with Caching
 */
const getSpamhausToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;
  try {
    const res = await fetch(`${PHP_API_URL}/spamhaus-auth.php?action=get_token`);
    const data = await res.json();
    if (data && data.token && !data.error) {
      cachedToken = data.token;
      tokenExpiry = now + (1000 * 60 * 30); // 30min cache
      return cachedToken;
    }
    return null;
  } catch (e) { return null; }
};

/**
 * IP History: Only fetches for XBL and CSS. Prioritizes XBL.
 */
export const getIPReleaseDate = async (ip: string): Promise<{ text: string, data: any }> => {
  const token = await getSpamhausToken();
  if (!token) return { text: '<span class="text-rose-500 opacity-60">Auth failed</span>', data: null };
  try {
    const res = await fetch(`${PHP_API_URL}/spamhaus-history.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ip, token })
    });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      const allowed = data.filter(e => {
        const ds = (e.dataset || '').toUpperCase();
        return ds.includes('XBL') || ds.includes('CSS');
      });

      if (allowed.length === 0) return { text: '—', data: null };

      // Requirement: if xbl and sbl/css exist, show only xbl
      const prioritized = allowed.sort((a, b) => {
        if (a.dataset.toUpperCase().includes('XBL')) return -1;
        if (b.dataset.toUpperCase().includes('XBL')) return 1;
        return 0;
      });

      const entry = prioritized[0];
      const html = `<div><strong>${entry.dataset.toUpperCase()}</strong> : ${formatDate(entry.valid_until)}</div>`;
      return { text: html, data: prioritized };
    }
    return { text: '—', data: null };
  } catch (e) { return { text: '<span class="text-rose-500 opacity-40">Fetch error</span>', data: null }; }
};

/**
 * Domain History for DBL Dataset
 */
export const getDomainReleaseDate = async (domain: string): Promise<{ text: string, data: any }> => {
  const token = await getSpamhausToken();
  if (!token) return { text: '<span class="text-rose-500 opacity-60">Auth failed</span>', data: null };
  try {
    const res = await fetch(`${PHP_API_URL}/spamhaus-domain-history.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain, token })
    });
    const data = await res.json();
    
    if (data && data['listed-until']) {
      const html = `<div><strong>DBL</strong> : ${formatDate(data['listed-until'])}</div>`;
      return { text: html, data };
    }
    
    if (Array.isArray(data) && data.length > 0) {
      const entry = data[0];
      const ts = entry.valid_until || entry['listed-until'];
      if (!ts) return { text: '—', data: null };
      const html = `<div><strong>${(entry.dataset || 'DBL').toUpperCase()}</strong> : ${formatDate(ts)}</div>`;
      return { text: html, data };
    }
    
    return { text: '—', data: null };
  } catch (e) { return { text: '<span class="text-rose-500 opacity-40">Fetch error</span>', data: null }; }
};