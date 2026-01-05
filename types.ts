
export interface DkimResult {
  id: number;
  domain: string;
  selector: string;
  record: string;
  status: 'pending' | 'loading' | 'success' | 'not_found' | 'error';
  errorMessage?: string;
}

export interface DmarcResult {
  id: number;
  domain: string;
  record: string;
  status: 'valid' | 'missing' | 'invalid' | 'loading' | 'pending' | 'error';
  policy?: string;
  adkim?: string;
  aspf?: string;
}

export interface SpfResult {
  id: number;
  domain: string;
  record: string;
  status: 'valid' | 'missing' | 'invalid' | 'warning' | 'loading' | 'pending' | 'error';
  lookupCount: number;
  mechanism: string;
}

export interface DnsLookupEntry {
  type: string;
  name: string;
  value: string;
  ttl: number;
}

export interface MxRecord {
  priority: number;
  exchange: string;
  provider: string;
}

export interface MxResult {
  domain: string;
  records: MxRecord[];
  primaryProvider: string;
  status: 'success' | 'not_found' | 'error' | 'loading' | 'idle';
}

export interface WhoisResult {
  id: number;
  domain: string;
  registrar: string;
  createdDate: string;
  expiryDate: string;
  daysRemaining: number;
  status: string[];
  loadingStatus: 'pending' | 'loading' | 'success' | 'not_found' | 'error';
  raw?: any;
}

export interface SSLResult {
  id: number;
  domain: string;
  issuer: string;
  validFrom: string;
  validTo: string;
  status: 'valid' | 'expired' | 'loading' | 'pending' | 'error';
}

export interface BlacklistResult {
  id: number;
  ip: string;
  domain: string;
  listed: boolean;
  listsChecked: number;
  status: 'clean' | 'listed' | 'loading' | 'pending';
}

export interface PtrResult {
  ip: string;
  hostname: string;
  status: 'success' | 'not_found' | 'error' | 'loading' | 'invalid' | 'pending';
}

export interface CaaRecord {
  flag: number;
  tag: string;
  value: string;
  description: string;
}

export interface CaaResult {
  domain: string;
  records: CaaRecord[];
  status: 'secure' | 'open' | 'error' | 'loading' | 'idle';
}

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

export interface DnsResponse {
  Status: number;
  TC: boolean;
  RD: boolean;
  RA: boolean;
  AD: boolean;
  CD: boolean;
  Question: Array<{ name: string; type: number }>;
  Answer?: DnsAnswer[];
}

export interface EmailHop {
  hop: number;
  from: string;
  by: string;
  with: string;
  id: string;
  date: string;
  delaySeconds: number;
}

export interface HeaderAnalysisResult {
  summary: {
    from: string;
    to: string;
    subject: string;
    date: string;
    messageId: string;
    returnPath: string;
    authenticated: boolean;
    riskLevel: 'low' | 'medium' | 'high';
  };
  auth: {
    spf: string;
    dkim: string;
    dmarc: string;
    arc?: string;
  };
  hops: EmailHop[];
  anomalies: string[];
  recommendations: string[];
}

export interface IpGeoResult {
  ip: string;
  hostname: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  isp: string | null;
  timezone: string | null;
  status: 'valid' | 'invalid' | 'unknown';
}

export interface IpGeoAnalysis {
  results: IpGeoResult[];
  summary: {
    total: number;
    countries: Array<{ name: string; count: number }>;
    isps: Array<{ name: string; count: number }>;
  };
}

export type MimeEncodingType = 'auto' | 'base64' | 'quoted-printable';

export interface MimeEncodingResult {
  encoded: string;
  decoded: string;
  mode: 'encode' | 'decode';
  type: MimeEncodingType;
  headers: {
    transferEncoding: string;
    contentType: string;
  };
}

export type SubjectStyle = 'normal' | 'uppercase' | 'titlecase' | 'bold' | 'italic' | 'monospace';

export interface SubjectFormat {
  id: string;
  label: string;
  active: boolean;
}

export interface SubjectEncodingResult {
  id: string;
  original: string;
  styled: string;
  encodings: Record<string, string>;
  espCompatibility: Record<string, 'supported' | 'partial' | 'unsupported'>;
}

export type EmailMasterAction = 'optimize' | 'fix' | 'decode' | 'validate' | 'write';
