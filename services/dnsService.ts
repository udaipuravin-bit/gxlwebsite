
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
    console.error(`Error looking up DKIM for ${domain}:`, error);
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
    console.error(`Error looking up DMARC for ${domain}:`, error);
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
    console.error(`Error looking up SPF for ${domain}:`, error);
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
    console.error(`Error looking up ${type} for ${domain}:`, error);
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
    console.error(`Error looking up CAA for ${domain}:`, error);
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
    console.error(`Error looking up MX for ${domain}:`, error);
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
    console.error(`Error looking up PTR for ${ip}:`, error);
    throw error;
  }
};

export const lookupWhoisData = async (domain: string): Promise<Omit<WhoisResult, 'id' | 'loadingStatus'> | null> => {
  const queryUrl = `https://rdap.org/domain/${domain}`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) return null;
    const data = await response.json();
    const events = data.events || [];
    const expiration = events.find((e: any) => e.eventAction === 'expiration');
    const registration = events.find((e: any) => e.eventAction === 'registration');
    const entities = data.entities || [];
    const registrarEntity = entities.find((e: any) => e.roles && e.roles.includes('registrar'));
    let registrarName = 'Unknown';
    if (registrarEntity && registrarEntity.vcardArray) {
      const fnEntry = (registrarEntity.vcardArray[1] || []).find((entry: any) => entry[0] === 'fn');
      if (fnEntry) registrarName = fnEntry[3];
    }
    const expiryDate = expiration ? expiration.eventDate : '';
    const createdDate = registration ? registration.eventDate : '';
    let daysRemaining = 0;
    if (expiryDate) {
      const diff = new Date(expiryDate).getTime() - new Date().getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return {
      domain, registrar: registrarName, createdDate, expiryDate, daysRemaining,
      status: data.status || [], raw: data
    };
  } catch (error) {
    console.error(`Error fetching WHOIS for ${domain}:`, error);
    throw error;
  }
};

/**
 * Spamhaus Blacklist Query Implementation
 * Robust construction to handle both DQS and Public mirrors.
 */
export const lookupSpamhausReputation = async (input: string, type: 'ip' | 'domain', dqsKey: string): Promise<{ dataset: string; reason: string; codes: string[]; listed: boolean }[]> => {
  const results: { dataset: string; reason: string; codes: string[]; listed: boolean }[] = [];
  const cleanInput = input.trim().replace(/\.$/, '');
  const cleanKey = dqsKey.trim();

  const dnsQuery = async (hostname: string) => {
    try {
      const resp = await fetch(`https://dns.google/resolve?name=${hostname}&type=A`);
      const data: DnsResponse = await resp.json();
      if (data.Status === 5) throw new Error('Query Limit Exceeded or Unauthorized Key');
      return data.Answer || [];
    } catch (e: any) {
      if (e.message.includes('Limit')) throw e;
      return [];
    }
  };

  if (type === 'ip') {
    const reversedIp = cleanInput.split('.').reverse().join('.');
    const zenHostname = cleanKey 
      ? `${reversedIp}.${cleanKey}.zen.dq.spamhaus.net` 
      : `${reversedIp}.zen.spamhaus.net`;
      
    const answers = await dnsQuery(zenHostname);
    
    if (answers.length > 0) {
      const codes = answers.map(a => a.data);
      const datasetParts: string[] = [];
      const reasons: string[] = [];
      
      codes.forEach(code => {
        if (code === '127.0.0.2') { datasetParts.push('SBL'); reasons.push('SBL (Spamhaus Block List)'); }
        else if (code === '127.0.0.3') { datasetParts.push('SBL-CSS'); reasons.push('SBL-CSS (Spamhaus CSS)'); }
        else if (code === '127.0.0.9') { datasetParts.push('DROP'); reasons.push('DROP (Don\'t Route Or Peer)'); }
        else if (code === '127.0.0.4') { datasetParts.push('XBL'); reasons.push('XBL (Exploits Block List)'); }
        else if (code === '127.0.0.10') { datasetParts.push('PBL'); reasons.push('PBL (Policy Block List - ISP)'); }
        else if (code === '127.0.0.11') { datasetParts.push('PBL'); reasons.push('PBL (Policy Block List - SH)'); }
        else if (code === '127.0.0.20') { datasetParts.push('AuthBL'); reasons.push('AuthBL (Authenticating Block List)'); }
      });

      results.push({
        dataset: `ZEN (${[...new Set(datasetParts)].join(', ')})`,
        reason: reasons.join(', '),
        codes,
        listed: true
      });
    }
  } else {
    // DBL Logic
    const dblHostname = cleanKey 
      ? `${cleanInput}.${cleanKey}.dbl.dq.spamhaus.net` 
      : `${cleanInput}.dbl.spamhaus.net`;

    const dblAnswers = await dnsQuery(dblHostname);
    if (dblAnswers.length > 0) {
      const codes = dblAnswers.map(a => a.data);
      let reason = 'Bad / Low Reputation';
      if (codes.some(c => {
        const last = parseInt(c.split('.').pop() || '0');
        return last >= 102 && last <= 199;
      })) {
        reason = 'Abused but Legitimate';
      } else if (codes.some(c => c === '127.0.1.255')) {
        reason = 'Invalid query (IP used instead of domain)';
      }
      results.push({ dataset: 'DBL', reason, codes, listed: true });
    }

    // ZRD Logic (ZRD is only available via DQS)
    if (cleanKey) {
      const zrdHostname = `${cleanInput}.${cleanKey}.zrd.dq.spamhaus.net`;
      const zrdAnswers = await dnsQuery(zrdHostname);
      if (zrdAnswers.length > 0) {
        const codes = zrdAnswers.map(a => a.data);
        const last = parseInt(codes[0].split('.').pop() || '0');
        // 127.0.2.2 - 127.0.2.24
        const hours = last - 2; 
        results.push({ 
          dataset: 'ZRD', 
          reason: `Zero Reputation Domain (first observed ${hours} hours ago)`, 
          codes, 
          listed: true 
        });
      }
    }
  }

  if (results.length === 0) {
    results.push({ dataset: 'None', reason: 'NOT LISTED', codes: [], listed: false });
  }

  return results;
};
