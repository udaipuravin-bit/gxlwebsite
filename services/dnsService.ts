
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
    return `CAs can contact the domain owner at ${cleanValue}.`;
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
  if (ip.includes(':')) {
    return ip; 
  }
  return null;
};

export const lookupDkimRecord = async (domain: string, selector: string): Promise<string | null> => {
  const cleanDomain = domain.trim().toLowerCase();
  const cleanSelector = selector.trim();
  if (!cleanDomain || !cleanSelector) return null;
  const queryUrl = `https://dns.google/resolve?name=${cleanSelector}._domainkey.${cleanDomain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
      return data.Answer.map(ans => ans.data.replace(/"/g, '')).join('');
    }
    return null;
  } catch (error) {
    console.error(`Error looking up DKIM for ${domain}:`, error);
    throw error;
  }
};

export const lookupDmarcRecord = async (domain: string): Promise<string | null> => {
  const cleanDomain = domain.trim().toLowerCase();
  if (!cleanDomain) return null;
  const queryUrl = `https://dns.google/resolve?name=_dmarc.${cleanDomain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
      const dmarcRecord = data.Answer
        .map(ans => ans.data.replace(/"/g, ''))
        .find(txt => txt.toUpperCase().startsWith('V=DMARC1'));
      return dmarcRecord || (data.Answer[0]?.data.replace(/"/g, '') || null);
    }
    return null;
  } catch (error) {
    console.error(`Error looking up DMARC for ${domain}:`, error);
    throw error;
  }
};

export const lookupSpfRecord = async (domain: string): Promise<string | null> => {
  const cleanDomain = domain.trim().toLowerCase();
  if (!cleanDomain) return null;
  const queryUrl = `https://dns.google/resolve?name=${cleanDomain}&type=TXT`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
      const spfRecord = data.Answer
        .map(ans => ans.data.replace(/"/g, ''))
        .find(txt => txt.toLowerCase().startsWith('v=spf1'));
      return spfRecord || null;
    }
    return null;
  } catch (error) {
    console.error(`Error looking up SPF for ${domain}:`, error);
    throw error;
  }
};

export const lookupRecordByType = async (domain: string, type: string): Promise<DnsLookupEntry[]> => {
  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
  const typeId = RECORD_TYPE_MAP[type];
  if (!cleanDomain || !typeId) return [];
  const queryUrl = `https://dns.google/resolve?name=${cleanDomain}&type=${typeId}`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
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
  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
  if (!cleanDomain) return [];
  
  const queryUrl = `https://dns.google/resolve?name=${cleanDomain}&type=257`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
    const data: DnsResponse = await response.json();
    
    if (data.Status === 0 && data.Answer) {
      return data.Answer.map(ans => {
        // Data format: "0 issue \"letsencrypt.org\""
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
  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
  if (!cleanDomain) return [];
  const queryUrl = `https://dns.google/resolve?name=${cleanDomain}&type=15`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
    const data: DnsResponse = await response.json();
    if (data.Status === 0 && data.Answer) {
      return data.Answer
        .map(ans => {
          const parts = ans.data.split(/\s+/);
          const priority = parseInt(parts[0], 10);
          const exchange = (parts[1] || '').replace(/\.$/, '');
          return {
            priority,
            exchange,
            provider: detectProvider(exchange)
          };
        })
        .sort((a, b) => a.priority - b.priority);
    }
    return [];
  } catch (error) {
    console.error(`Error looking up MX for ${domain}:`, error);
    throw error;
  }
};

export const lookupPtrRecord = async (ip: string): Promise<string | null> => {
  const cleanIp = ip.trim();
  const arpaName = ipToArpa(cleanIp);
  if (!arpaName) return null;

  const queryUrl = `https://dns.google/resolve?name=${arpaName}&type=12`;
  try {
    const response = await fetch(queryUrl);
    if (!response.ok) throw new Error('DNS lookup failed');
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

// Fix: Update lookupWhoisData return type to use Omit<WhoisResult, 'id' | 'loadingStatus'> as the returned object contains core data but not UI state properties.
export const lookupWhoisData = async (domain: string): Promise<Omit<WhoisResult, 'id' | 'loadingStatus'> | null> => {
  const cleanDomain = domain.trim().toLowerCase().replace(/^(https?:\/\/)/, '').replace(/\/$/, '');
  if (!cleanDomain) return null;

  const queryUrl = `https://rdap.org/domain/${cleanDomain}`;

  try {
    const response = await fetch(queryUrl);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('WHOIS/RDAP lookup failed');
    }
    const data = await response.json();

    const events = data.events || [];
    const expirationEvent = events.find((e: any) => e.eventAction === 'expiration');
    const registrationEvent = events.find((e: any) => e.eventAction === 'registration');
    
    const entities = data.entities || [];
    const registrarEntity = entities.find((e: any) => e.roles && e.roles.includes('registrar'));
    let registrarName = 'Unknown';
    
    if (registrarEntity && registrarEntity.vcardArray) {
      const vcard = registrarEntity.vcardArray[1] || [];
      const fnEntry = vcard.find((entry: any) => entry[0] === 'fn');
      if (fnEntry) registrarName = fnEntry[3];
    }

    const expiryDate = expirationEvent ? expirationEvent.eventDate : '';
    const createdDate = registrationEvent ? registrationEvent.eventDate : '';
    
    let daysRemaining = 0;
    if (expiryDate) {
      const diff = new Date(expiryDate).getTime() - new Date().getTime();
      // REMOVED Math.max(0, ...) to allow negative values for expired domains
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      domain: cleanDomain,
      registrar: registrarName,
      createdDate,
      expiryDate,
      daysRemaining,
      status: data.status || [],
      raw: data
    };
  } catch (error) {
    console.error(`Error fetching WHOIS for ${domain}:`, error);
    throw error;
  }
};
