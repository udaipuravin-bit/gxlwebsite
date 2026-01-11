
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

const DQS_INTERNAL_KEY = 'cnrmf6qnuzmpx57lve7mtvhr2q';
const PHP_API_URL = 'https://shadow-7dfgdfx.serv00.net/ipchecker';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const getSpamhausToken = async (): Promise<string | null> => {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  try {
    const res = await fetch(`${PHP_API_URL}/spamhaus-auth.php?action=get_token`, {
      headers: { 'Referer': window.location.origin }
    });
    const data = await res.json();
    if (data && data.token && !data.error) {
      cachedToken = data.token;
      tokenExpiry = now + (1000 * 60 * 20); 
      return cachedToken;
    }
    return null;
  } catch (e) {
    return null;
  }
};

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
  const formatter = new Intl.DateTimeFormat('en-GB', options);
  const parts = formatter.formatToParts(d);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';
  return `${findPart('weekday')}, ${findPart('day')} ${findPart('month')}, ${findPart('year')}, ${findPart('hour')}:${findPart('minute')} ${(parts.find(p => p.type === 'dayPeriod')?.value || '').toLowerCase()} IST`;
};

export const lookupSpamhausReputation = async (target: string, type: 'ip' | 'domain') => {
  const zones = type === 'ip' ? [{ name: 'ZEN', host: 'zen.dq.spamhaus.net' }] : [{ name: 'DBL', host: 'dbl.dq.spamhaus.net' }];
  const results = [];

  for (const zone of zones) {
    let query = type === 'ip' 
      ? (target.includes(':') ? `${reverseIpv6(target)}.${DQS_INTERNAL_KEY}.${zone.host}` : `${target.split('.').reverse().join('.')}.${DQS_INTERNAL_KEY}.${zone.host}`)
      : `${target}.${DQS_INTERNAL_KEY}.${zone.host}`;

    const url = `https://dns.google/resolve?name=${query}&type=A`;
    try {
      const res = await fetch(url);
      const data: DnsResponse = await res.json();
      if (data.Status === 0 && data.Answer) {
        const codes = data.Answer.map(ans => ans.data);
        results.push({
          dataset: zone.name,
          lists: codes.flatMap(c => getSpamhausListNames(c, zone.name)),
          listed: true,
          reason: codes.map(c => getSpamhausReason(c, zone.name)).join(', '),
          codes
        });
      } else {
        results.push({ dataset: zone.name, lists: [], listed: false, reason: 'Not listed', codes: [] });
      }
    } catch (e) {
      throw new Error('DQS Resolve failure');
    }
  }
  return results;
};

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
  const last = code.split('.').pop() || '';
  if (dataset === 'ZEN') {
    switch (last) {
      case '2': return 'SBL - Spamhaus Block List';
      case '3': return 'SBL-CSS - Spamhaus CSS';
      case '4': 
      case '5': 
      case '6': 
      case '7': return 'XBL - Exploits Block List';
      case '9': return 'SBL-DROP - Spamhaus DROP';
      case '10': return 'PBL - ISP Dynamics';
      case '11': return 'PBL - Non-MTA Space';
      default: return 'Listed';
    }
  }
  return 'Listed (DBL)';
};

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
    const results = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
    if (results.length > 0) {
      const validEntries = results.filter((e: any) => {
        const ds = (e.dataset || '').toUpperCase();
        return ds.includes('XBL') || ds.includes('CSS');
      });
      if (validEntries.length === 0) return { text: '—', data: null };
      const prioritized = validEntries.sort((a: any, b: any) => {
        if (a.dataset.toUpperCase().includes('XBL')) return -1;
        if (b.dataset.toUpperCase().includes('XBL')) return 1;
        return 0;
      });
      const html = prioritized.map((entry: any) => `<div class="mb-1 last:mb-0"><strong class="text-rose-500">${entry.dataset.toUpperCase()}</strong> : ${formatDate(entry.valid_until)}</div>`).join('');
      return { text: html, data: prioritized };
    }
    return { text: '—', data: null };
  } catch (e) {
    return { text: '<span class="text-rose-500 opacity-40">Fetch Error</span>', data: null };
  }
};

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
    const results = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
    const timestamp = data['listed-until'] || (results[0] ? (results[0].valid_until || results[0]['listed-until']) : null);
    if (timestamp) {
      const html = `<div><strong class="text-rose-500">DBL</strong> : ${formatDate(timestamp)}</div>`;
      return { text: html, data };
    }
    return { text: '—', data: null };
  } catch (e) {
    return { text: '<span class="text-rose-500 opacity-40">Fetch Error</span>', data: null };
  }
};

const identifyProvider = (exchange: string): string => {
  const host = exchange.toLowerCase();
  if (host.includes('google.com') || host.includes('googlemail.com')) return 'Google Workspace';
  if (host.includes('outlook.com') || host.includes('messaging.microsoft.com') || host.includes('onmicrosoft.com')) return 'Microsoft 365 / Outlook';
  if (host.includes('zoho.com')) return 'Zoho Mail';
  if (host.includes('pphosted.com')) return 'Proofpoint';
  if (host.includes('mimecast.com')) return 'Mimecast';
  if (host.includes('secureserver.net')) return 'GoDaddy / WildWest';
  if (host.includes('barracudanetworks.com')) return 'Barracuda';
  if (host.includes('mail.yahoo.com')) return 'Yahoo Mail';
  if (host.includes('icloud.com')) return 'Apple iCloud';
  if (host.includes('register.com')) return 'Register.com';
  if (host.includes('yandex.net')) return 'Yandex Mail';
  if (host.includes('amazon.com')) return 'Amazon SES';
  if (host.includes('sendgrid.net')) return 'Twilio SendGrid';
  if (host.includes('protection.outlook.com')) return 'Microsoft 365 Defender';
  return 'Private / Custom';
};

export const lookupRecordByType = async (domain: string, type: string): Promise<DnsLookupEntry[]> => {
  const typeNum = RECORD_TYPE_MAP[type.toUpperCase()] || 1;
  const url = `https://dns.google/resolve?name=${domain}&type=${typeNum}`;
  try {
    const res = await fetch(url);
    const data: DnsResponse = await res.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => ({
        type: type.toUpperCase(),
        name: ans.name,
        value: ans.data,
        ttl: ans.TTL
      }));
    }
    return [];
  } catch (e) {
    return [];
  }
};

export const lookupDkimRecord = async (domain: string, selector: string): Promise<string | null> => {
  const records = await lookupRecordByType(`${selector}._domainkey.${domain}`, 'TXT');
  return records.length > 0 ? records[0].value.replace(/"/g, '') : null;
};

export const lookupDmarcRecord = async (domain: string): Promise<string | null> => {
  const records = await lookupRecordByType(`_dmarc.${domain}`, 'TXT');
  return records.length > 0 ? records[0].value.replace(/"/g, '') : null;
};

export const lookupSpfRecord = async (domain: string): Promise<string | null> => {
  const records = await lookupRecordByType(domain, 'TXT');
  const spf = records.find(r => r.value.toLowerCase().includes('v=spf1'));
  return spf ? spf.value.replace(/"/g, '') : null;
};

export const lookupCaaRecords = async (domain: string): Promise<CaaRecord[]> => {
  const records = await lookupRecordByType(domain, 'CAA');
  return records.map(r => ({
    flag: 0,
    tag: 'issue',
    value: r.value.replace(/"/g, ''),
    description: 'CA Policy'
  }));
};

export const lookupMxRecords = async (domain: string): Promise<MxRecord[]> => {
  const records = await lookupRecordByType(domain, 'MX');
  return records.map(r => {
    const parts = r.value.split(' ');
    const exchange = parts[1].replace(/\.$/, '');
    return { 
      priority: parseInt(parts[0]), 
      exchange, 
      provider: identifyProvider(exchange) 
    };
  }).sort((a, b) => a.priority - b.priority);
};

export const lookupPtrRecord = async (ip: string): Promise<string | null> => {
  let query = ip.includes(':') ? `${reverseIpv6(ip)}.ip6.arpa` : `${ip.split('.').reverse().join('.')}.in-addr.arpa`;
  const records = await lookupRecordByType(query, 'PTR');
  return records.length > 0 ? records[0].value.replace(/\.$/, '') : null;
};

export const lookupWhoisData = async (domain: string): Promise<Partial<WhoisResult> | null> => {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) return null;
    const data = await response.json();
    const expiryEvent = (data.events || []).find((e: any) => e.eventAction === 'expiration');
    const expiryDate = expiryEvent ? expiryEvent.eventDate : '';
    let daysRemaining = 0;
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      daysRemaining = Math.ceil((expiry.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    }
    const registrarEntity = (data.entities || []).find((e: any) => e.roles?.includes('registrar'));
    const registrar = registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || 'Unknown';
    return { registrar, expiryDate, daysRemaining, status: data.status || [] };
  } catch (error) {
    return null;
  }
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
