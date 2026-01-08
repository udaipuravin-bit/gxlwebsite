
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

export type MimeEncodingType = 'auto' | 'base64' | 'quoted-printable';

export interface SpamCopResult {
  id: number;
  ip: string;
  dnsbl: string;
  status: 'listed' | 'clean' | 'error' | 'invalid' | 'loading' | 'pending';
  returnCode: string;
  meaning: string;
  ttl: number;
}

export interface SpamhausResult {
  id: number;
  input: string;
  type: 'ip' | 'domain';
  listed: boolean;
  datasets: string[];
  reason: string;
  status: 'pending' | 'loading' | 'clean' | 'listed-high' | 'listed-low' | 'error';
  releaseDate?: string;
}

export interface BarracudaResult {
  id: number;
  input: string;
  type: 'ip' | 'domain';
  status: 'listed' | 'clean' | 'error' | 'loading' | 'pending';
  message: string;
  categories: string[];
}

export type EmailMasterAction = 'optimize' | 'fix' | 'decode' | 'validate' | 'write';

export interface RecordMatchResult {
  id: number;
  domain: string;
  hostname: string;
  expected: string;
  found: string;
  status: 'pending' | 'loading' | 'match' | 'mismatch' | 'missing' | 'error';
}

export interface UrlTraceHop {
  id: number;
  url: string;
  statusCode: number;
  meaning: string;
  statusClass: '1xx' | '2xx' | '3xx' | '4xx' | '5xx' | 'error';
}

export interface UrlTraceResult {
  targetUrl: string;
  hops: UrlTraceHop[];
  isComplete: boolean;
  error?: string;
}

export interface BlacklistAuditEntry {
  id: number;
  input: string;
  type: 'ip' | 'domain';
  ptr: string;
  spamhaus: 'listed' | 'clean' | 'pending' | 'error';
  spamcop: 'listed' | 'clean' | 'pending' | 'error' | 'n/a';
  barracuda: 'listed' | 'clean' | 'pending' | 'error';
  status: 'pending' | 'loading' | 'complete' | 'error';
}
