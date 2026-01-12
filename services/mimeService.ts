import { MimeEncodingType } from '../types';

/**
 * RFC 2045 compliant Base64 Encoder
 * Uses TextEncoder for UTF-8 safety and implements strict 76-character line wrapping.
 */
export const encodeBase64 = (str: string, wrap = true): string => {
  const bytes = new TextEncoder().encode(str);
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(binString);
  if (!wrap) return b64;
  
  // RFC 2045: Lines must not exceed 76 characters
  return b64.match(/.{1,76}/g)?.join('\r\n') || b64;
};

/**
 * Robust Base64 Decoder
 * Handles standard and URL-safe variants, cleans whitespace, and returns UTF-8 string.
 */
export const decodeBase64 = (str: string): string => {
  try {
    const cleaned = str.replace(/[\s\r\n]/g, '').replace(/-/g, '+').replace(/_/g, '/');
    const binString = atob(cleaned);
    const bytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      bytes[i] = binString.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch (e) {
    throw new Error("Decoding Failed: Invalid Base64 stream data.");
  }
};

/**
 * RFC 2045 compliant Quoted-Printable Encoder
 * Processes raw bytes to prevent emoji corruption and adds soft line breaks (=) at 76 characters.
 */
export const encodeQuotedPrintable = (str: string, wrap = true): string => {
  const bytes = new TextEncoder().encode(str);
  let result = "";
  let lineLength = 0;
  const hex = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    let encoded = "";

    // Literal characters: 33-60 and 62-126 are safe.
    // Spaces (32) and Tabs (9) are literal unless at the end of a line.
    if ((b >= 33 && b <= 60) || (b >= 62 && b <= 126)) {
      encoded = String.fromCharCode(b);
    } else if (b === 32 || b === 9) {
      const isEndOfLine = i + 1 === bytes.length || bytes[i+1] === 10 || bytes[i+1] === 13;
      if (isEndOfLine && wrap) encoded = "=" + hex(b);
      else encoded = String.fromCharCode(b);
    } else if (b === 10 || b === 13) {
      // Preserve hard line breaks
      result += String.fromCharCode(b);
      lineLength = 0;
      continue;
    } else {
      // Multi-byte characters and special symbols must be encoded as =XX
      encoded = "=" + hex(b);
    }

    // Soft line break logic
    if (wrap && lineLength + encoded.length > 75) {
      result += "=\r\n";
      lineLength = 0;
    }

    result += encoded;
    lineLength += encoded.length;
  }
  return result;
};

/**
 * Quoted-Printable Decoder
 * Removes soft line breaks and decodes hex sequences back to UTF-8.
 */
export const decodeQuotedPrintable = (str: string): string => {
  try {
    const bytes: number[] = [];
    // 1. Strip soft line breaks
    const processed = str.replace(/=\r?\n/g, '');
    
    for (let i = 0; i < processed.length; i++) {
      if (processed[i] === '=' && i + 2 < processed.length) {
        const hexStr = processed.substring(i + 1, i + 3);
        if (/^[0-9A-Fa-f]{2}$/.test(hexStr)) {
          bytes.push(parseInt(hexStr, 16));
          i += 2;
        } else {
          bytes.push(processed.charCodeAt(i));
        }
      } else {
        bytes.push(processed.charCodeAt(i));
      }
    }
    return new TextDecoder().decode(new Uint8Array(bytes));
  } catch (e) {
    throw new Error("Decoding Failed: Malformed Quoted-Printable sequence.");
  }
};

/**
 * Fix: Added autoDecode to handle RFC 2047 encoded words and heuristic stream decoding.
 * Required by YahooImapFetcher and EmailMasterTool.
 */
export const autoDecode = (str: string): string => {
  if (!str) return "";

  // 1. Handle RFC 2047 (Encoded Word) e.g. =?UTF-8?B?...?=
  const rfc2047Regex = /=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g;
  if (rfc2047Regex.test(str)) {
    return str.replace(rfc2047Regex, (match, charset, encoding, data) => {
      try {
        if (encoding.toUpperCase() === 'B') {
          return decodeBase64(data);
        } else if (encoding.toUpperCase() === 'Q') {
          // RFC 2047 Q-encoding replaces spaces with underscores
          return decodeQuotedPrintable(data.replace(/_/g, ' '));
        }
      } catch (e) {
        return match;
      }
      return match;
    });
  }

  // 2. Heuristic for pure Base64 vs Quoted-Printable
  const cleaned = str.trim();
  
  // Check if it's likely Quoted-Printable (contains =XX markers)
  const hasQPMarkers = /=[0-9A-F]{2}/i.test(cleaned);
  // Check if it's likely Base64 (valid charset and multiple of 4 in length)
  const isBase64Candidate = /^[A-Za-z0-9+/=\s]+$/.test(cleaned) && (cleaned.replace(/\s/g, '').length % 4 === 0);

  if (hasQPMarkers) {
    try { return decodeQuotedPrintable(str); } catch (e) {}
  }
  
  if (isBase64Candidate) {
    try { return decodeBase64(str); } catch (e) {}
  }

  return str;
};

/**
 * Unified processing bridge for MIME operations
 * Fix: Updated 'type' parameter to support 'auto' to resolve type mismatch error in EmailMasterTool.
 */
export const processMimeContent = (
  content: string, 
  type: 'base64' | 'quoted-printable' | 'auto', 
  mode: 'encode' | 'decode', 
  wrap = true
): string => {
  if (mode === 'encode') {
    if (type === 'auto') return encodeBase64(content, wrap);
    return type === 'quoted-printable' 
      ? encodeQuotedPrintable(content, wrap) 
      : encodeBase64(content, wrap);
  } else {
    if (type === 'auto') return autoDecode(content);
    return type === 'quoted-printable' 
      ? decodeQuotedPrintable(content) 
      : decodeBase64(content);
  }
};