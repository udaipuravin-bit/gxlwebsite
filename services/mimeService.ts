
import { MimeEncodingType } from '../types';

/**
 * UTF-8 Safe Base64 Encoding
 */
export const encodeBase64 = (str: string): string => {
  const bytes = new TextEncoder().encode(str);
  let binString = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binString += String.fromCharCode(bytes[i]);
  }
  return btoa(binString);
};

/**
 * UTF-8 Safe Base64 Decoding
 */
export const decodeBase64 = (str: string): string => {
  const binString = atob(str.replace(/\s/g, ''));
  const bytes = new Uint8Array(binString.length);
  for (let i = 0; i < binString.length; i++) {
    bytes[i] = binString.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
};

/**
 * UTF-8 Safe Quoted-Printable Encoding (RFC 2045/2047)
 */
export const encodeQuotedPrintable = (str: string, isHeader = false, hexOnly = false): string => {
  const bytes = new TextEncoder().encode(str);
  let result = "";
  const hex = (b: number) => b.toString(16).toUpperCase().padStart(2, '0');

  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    
    if (hexOnly) {
      result += "=" + hex(b);
      continue;
    }

    if (isHeader) {
      if (b === 32) result += "_";
      else if ((b >= 48 && b <= 57) || (b >= 65 && b <= 90) || (b >= 97 && b <= 122)) {
        result += String.fromCharCode(b);
      } else {
        result += "=" + hex(b);
      }
    } else {
      if (b === 61 || b < 33 || b > 126 || (b === 32 && (i + 1 === bytes.length || bytes[i+1] === 10 || bytes[i+1] === 13))) {
        result += "=" + hex(b);
      } else {
        result += String.fromCharCode(b);
      }
    }
  }
  return result;
};

/**
 * Quoted-Printable Decoding (RFC 2045)
 */
export const decodeQuotedPrintable = (str: string): string => {
  const bytes: number[] = [];
  const processed = str.replace(/=\r?\n/g, ''); // Remove soft line breaks
  for (let i = 0; i < processed.length; i++) {
    if (processed[i] === '=' && i + 2 < processed.length) {
      const hex = processed.substring(i + 1, i + 3);
      if (/^[0-9A-Fa-f]{2}$/.test(hex)) {
        bytes.push(parseInt(hex, 16));
        i += 2;
      } else {
        bytes.push(processed.charCodeAt(i));
      }
    } else {
      bytes.push(processed.charCodeAt(i));
    }
  }
  return new TextDecoder().decode(new Uint8Array(bytes));
};

/**
 * RFC 2047 Encoding Word Generator
 */
export const encodeRFC2047 = (str: string, mode: 'B' | 'Q', charset = 'UTF-8', hexOnly = false): string => {
  const encoded = mode === 'B' ? encodeBase64(str) : encodeQuotedPrintable(str, true, hexOnly);
  return `=?${charset}?${mode}?${encoded}?=`;
};

/**
 * Decodes RFC 2047 Subject Lines or Encoded Words
 */
export const decodeRFC2047 = (encoded: string): string => {
  const regex = /=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g;
  let result = encoded;
  let match;
  while ((match = regex.exec(encoded)) !== null) {
    const [fullMatch, charset, encoding, data] = match;
    try {
      let decoded = "";
      if (encoding.toUpperCase() === 'B') {
        decoded = decodeBase64(data);
      } else {
        const processed = data.replace(/_/g, ' ');
        const bytes: number[] = [];
        for (let i = 0; i < processed.length; i++) {
          if (processed[i] === '=' && i + 2 < processed.length) {
            bytes.push(parseInt(processed.substring(i + 1, i + 3), 16));
            i += 2;
          } else {
            bytes.push(processed.charCodeAt(i));
          }
        }
        decoded = new TextDecoder(charset).decode(new Uint8Array(bytes));
      }
      result = result.replace(fullMatch, decoded);
    } catch {
      // Return as is if decoding fails
    }
  }
  return result;
};

/**
 * Auto-detect and decode encoded content
 */
export const autoDecode = (str: string): string => {
  const input = str.trim();
  if (!input) return "";

  // Check for RFC 2047
  if (/=\?([^?]+)\?([BQbq])\?([^?]*)\?=/.test(input)) {
    return decodeRFC2047(input);
  }

  // Check for Quoted-Printable (RFC 2045 signs: soft line breaks or hex sequences)
  if (/=[0-9A-Fa-f]{2}/.test(input) || /=\r?\n/.test(input)) {
    return decodeQuotedPrintable(input);
  }

  // Check for Base64
  try {
    const cleaned = input.replace(/\s/g, '');
    if (/^[A-Za-z0-9+/=]+$/.test(cleaned)) {
      return decodeBase64(cleaned);
    }
  } catch {}

  return input;
};

/**
 * High-level processor for MIME tool
 */
export const processMimeContent = (content: string, type: 'base64' | 'quoted-printable' | 'auto', mode: 'encode' | 'decode'): string => {
  if (mode === 'encode') {
    if (type === 'auto' || type === 'base64') return encodeBase64(content);
    return encodeQuotedPrintable(content);
  } else {
    if (type === 'auto') return autoDecode(content);
    if (type === 'base64') return decodeBase64(content);
    return decodeQuotedPrintable(content);
  }
};
