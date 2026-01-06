
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

const getCaaDescription = (tag: string, value: string): string => {
  const cleanTag = tag.toLowerCase();
  const cleanValue = value.replace(/"/g, '');
  
  if (cleanTag === 'issue') {
    return `Only ${cleanValue} is authorized to issue certificates.`;
  }
  if (cleanTag === 'issuewild') {
    return `Only ${cleanValue} is authorized to issue wildcard certificates.`;
  }
  if (cleanTag === 'iodef') {
    return `Unauthorized issuance requests will be reported to ${cleanValue}.`;
  }
  if (cleanTag === 'contactemail') {
    return `CAs can contact the domain owner via ${cleanValue}.`;
  }
  if (cleanTag === 'contactphone') {
    return `CAs can contact the owner at ${cleanValue}.`;
  }
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
  if (ipv4Regex.test(ip)) {
    return ip.split('.').reverse().join('.') + '.in-addr.arpa';
  }
  return null;
};

export const lookupDkimRecord = async (domain: string, selector: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=${selector}._domainkey.${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => ans.data.replace(/"/g, '')).join('');
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const lookupDmarcRecord = async (domain: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=_dmarc.${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      const dmarc = data.Answer.map(ans => ans.data.replace(/"/g, '')).find(txt => txt.toUpperCase().startsWith('V=DMARC1'));
      return dmarc || null;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const lookupSpfRecord = async (domain: string): Promise<string | null> => {
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      const spf = data.Answer.map(ans => ans.data.replace(/"/g, '')).find(txt => txt.toLowerCase().startsWith('v=spf1'));
      return spf || null;
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const lookupRecordByType = async (domain: string, type: string): Promise<DnsLookupEntry[]> => {
  const typeId = RECORD_TYPE_MAP[type];
  if (!typeId) return [];
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=${typeId}`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => ({
        type,
        name: ans.name,
        value: ans.data,
        ttl: ans.TTL
      }));
    }
    return [];
  } catch (error) {
    throw error;
  }
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
        return {
          flag,
          tag,
          value,
          description: getCaaDescription(tag, value)
        };
      });
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export const lookupMxRecords = async (domain: string): Promise<MxRecord[]> => {
  const queryUrl = `https://dns.google/resolve?name=${domain}&type=15`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => {
        const parts = ans.data.split(/\s+/);
        const priority = parseInt(parts[0], 10);
        const exchange = (parts[1] || '').replace(/\.$/, '');
        return {
          priority,
          exchange,
          provider: detectProvider(exchange)
        };
      }).sort((a, b) => a.priority - b.priority);
    }
    return [];
  } catch (error) {
    throw error;
  }
};

export const lookupPtrRecord = async (ip: string): Promise<string | null> => {
  const arpaName = ipToArpa(ip);
  if (!arpaName) return null;
  const queryUrl = `https://dns.google/resolve?name=${arpaName}&type=12`;
  try {
    const response = await fetch(queryUrl);
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
      return data.Answer[0].data.replace(/\.$/, '');
    }
    return null;
  } catch (error) {
    throw error;
  }
};

export const lookupWhoisData = async (domain: string): Promise<Omit<WhoisResult, 'id' | 'loadingStatus'> | null> => {
  try {
    const response = await fetch(`https://rdap.org/domain/${domain}`);
    if (!response.ok) return null;
    
    const data = await response.json();
    
    const events = data.events || [];
    const createdEvent = events.find((e: any) => e.eventAction === 'registration');
    const expiryEvent = events.find((e: any) => e.eventAction === 'expiration');
    
    const createdDate = createdEvent ? createdEvent.eventDate : '';
    const expiryDate = expiryEvent ? expiryEvent.eventDate : '';
    
    let daysRemaining = 0;
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      const today = new Date();
      const diffTime = expiry.getTime() - today.getTime();
      daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    const registrarEntity = (data.entities || []).find((e: any) => e.roles?.includes('registrar'));
    const registrar = registrarEntity?.vcardArray?.[1]?.find((v: any) => v[0] === 'fn')?.[3] || 'Unknown';

    return {
      domain,
      registrar,
      createdDate,
      expiryDate,
      daysRemaining,
      status: data.status || [],
      raw: data
    };
  } catch (error) {
    return null;
  }
};

interface SpamhausQueryResult {
  dataset: string;
  listed: boolean;
  reason: string;
  codes: string[];
}

const getSpamhausReason = (code: string, dataset: string): string => {
  const parts = code.split('.');
  const last = parts[parts.length - 1];

  if (dataset === 'ZEN') {
    switch (last) {
      case '2': return 'SBL - Spamhaus Block List';
      case '3': return 'SBL-CSS - Spamhaus CSS';
      case '4': return 'XBL - Exploits Block List';
      case '9': return 'SBL-DROP - Spamhaus DROP';
      case '10': return 'PBL - Policy Block List (ISP)';
      case '11': return 'PBL - Policy Block List (Spamhaus)';
      case '20': return 'AuthBL - Compromised Auth';
      default: return 'Listed (ZEN)';
    }
  } else if (dataset === 'DBL') {
    const codeNum = parseInt(last);
    if (codeNum === 255) throw new Error('Misleading Query (Invalid DQS usage or domain formatting)');
    if (codeNum >= 2 && codeNum <= 99) return 'Bad / Low Reputation';
    if (codeNum >= 102 && codeNum <= 199) return 'Abused but Legitimate';
    return 'Listed (DBL)';
  } else if (dataset === 'ZRD') {
    const hours = parseInt(last) - 2;
    return `Zero Reputation Domain (Observed ${hours}-${hours + 1}h ago)`;
  }
  return 'Listed';
};

/**
 * Professional Spamhaus DQS Implementation.
 * Uses <target>.<key>.<zone>.dq.spamhaus.net format.
 * Strictly uses Google DNS resolvers via HTTP API.
 */
export const lookupSpamhausReputation = async (target: string, type: 'ip' | 'domain', dqsKey: string): Promise<SpamhausQueryResult[]> => {
  if (!dqsKey) throw new Error('DQS Key is missing in environment.');

  const results: SpamhausQueryResult[] = [];
  const zones = type === 'ip' 
    ? [{ name: 'ZEN', host: 'zen.dq.spamhaus.net' }] 
    : [
        { name: 'DBL', host: 'dbl.dq.spamhaus.net' },
        { name: 'ZRD', host: 'zrd.dq.spamhaus.net' }
      ];

  for (const zone of zones) {
    let query = '';
    if (type === 'ip') {
      const reversedIp = target.split('.').reverse().join('.');
      query = `${reversedIp}.${dqsKey}.${zone.host}`;
    } else {
      query = `${target}.${dqsKey}.${zone.host}`;
    }

    const url = `https://dns.google/resolve?name=${query}&type=A`;
    try {
      const res = await fetch(url);
      const data: DnsResponse = await res.json();
      
      if (data.Status === 0 && data.Answer) {
        const codes = data.Answer.map(ans => ans.data);
        results.push({
          dataset: zone.name,
          listed: true,
          reason: codes.map(c => getSpamhausReason(c, zone.name)).join(', '),
          codes
        });
      } else if (data.Status === 3 || !data.Answer) { // NXDOMAIN
        results.push({
          dataset: zone.name,
          listed: false,
          reason: 'Not listed',
          codes: []
        });
      } else {
        results.push({
          dataset: zone.name,
          listed: false,
          reason: 'Lookup error',
          codes: []
        });
      }
    } catch (e: any) {
      // Catch "Misleading Query" or other logic errors from getSpamhausReason
      throw new Error(e.message || 'DNS request failure');
    }
  }
  return results;
};
