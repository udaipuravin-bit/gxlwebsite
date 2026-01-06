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

// Backend PHP API Base URL
const PHP_API_URL = 'https://shadow-7dfgdfx.serv00.net/ipchecker';

/**
 * Token Caching Mechanism
 */
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Fetches or returns a cached Spamhaus API Token
 */
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

/**
 * Format Date exactly as requested: Tue, 06 Jan 2026 6:25 PM IST
 */
const formatDate = (unix: number): string => {
  const d = new Date(unix * 1000);
  const formatter = new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });

  const parts = formatter.formatToParts(d);
  const findPart = (type: string) => parts.find(p => p.type === type)?.value || '';

  const weekday = findPart('weekday');
  const day = findPart('day');
  const month = findPart('month');
  const year = findPart('year');
  const hour = findPart('hour');
  const minute = findPart('minute');
  const ampm = (parts.find(p => p.type === 'dayPeriod')?.value || '').toUpperCase();

  return `${weekday}, ${day} ${month} ${year} ${hour}:${minute} ${ampm} IST`;
};

/**
 * DNSBL Reputation Logic
 */
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

/**
 * IP History: Strictly XBL/CSS only. XBL Priority.
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
    
    // Support both { results: [] } and [] formats
    const results = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);

    if (results.length > 0) {
      const validEntries = results.filter((e: any) => {
        const ds = (e.dataset || '').toUpperCase();
        return ds.includes('XBL') || ds.includes('CSS');
      });

      if (validEntries.length === 0) return { text: '—', data: null };

      // Prioritize XBL over CSS
      const prioritized = validEntries.sort((a: any, b: any) => {
        if (a.dataset.toUpperCase().includes('XBL')) return -1;
        if (b.dataset.toUpperCase().includes('XBL')) return 1;
        return 0;
      });

      const entry = prioritized[0];
      const html = `<div><strong>${entry.dataset.toUpperCase()}</strong> : ${formatDate(entry.valid_until)}</div>`;
      return { text: html, data: prioritized };
    }
    return { text: '—', data: null };
  } catch (e) {
    return { text: '<span class="text-rose-500 opacity-40">Fetch Error</span>', data: null };
  }
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
    
    // Check direct timestamp, nested results, or raw array
    const results = Array.isArray(data) ? data : (data.results && Array.isArray(data.results) ? data.results : []);
    const timestamp = data['listed-until'] || (results[0] ? (results[0].valid_until || results[0]['listed-until']) : null);
    
    if (timestamp) {
      const html = `<div><strong>DBL</strong> : ${formatDate(timestamp)}</div>`;
      return { text: html, data };
    }
    
    return { text: '—', data: null };
  } catch (e) {
    return { text: '<span class="text-rose-500 opacity-40">Fetch Error</span>', data: null };
  }
};

/**
 * Generic DNS Resolver
 */
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

/**
 * Standard Lookups
 */
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
    return { priority: parseInt(parts[0]), exchange: parts[1].replace(/\.$/, ''), provider: 'Detected' };
  }).sort((a, b) => a.priority - b.priority);
};

export const lookupPtrRecord = async (ip: string): Promise<string | null> => {
  let query = ip.includes(':') ? `${reverseIpv6(ip)}.ip6.arpa` : `${ip.split('.').reverse().join('.')}.in-addr.arpa`;
  const records = await lookupRecordByType(query, 'PTR');
  return records.length > 0 ? records[0].value.replace(/\.$/, '') : null;
};

export const lookupWhoisData = async (domain: string): Promise<Partial<WhoisResult> | null> => {
  try {
    const res = await fetch(`${PHP_API_URL}/whois.php?domain=${domain}`);
    const data = await res.json();
    return data && !data.error ? { registrar: data.registrar, expiryDate: data.expiry_date, daysRemaining: data.days_remaining } : null;
  } catch (e) {
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