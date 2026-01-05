
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
 * UTF-8 Safe Quoted-Printable Encoding (RFC 2045/2047)
 * @param hexOnly If true, encodes every character as =XX
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
 * RFC 2047 Encoding Word Generator
 */
export const encodeRFC2047 = (str: string, mode: 'B' | 'Q', charset = 'UTF-8', hexOnly = false): string => {
  const encoded = mode === 'B' ? encodeBase64(str) : encodeQuotedPrintable(str, true, hexOnly);
  return `=?${charset}?${mode}?${encoded}?=`;
};

/**
 * Decodes RFC 2047 Subject Lines
 */
export const decodeRFC2047 = (encoded: string): string => {
  const regex = /=\?([^?]+)\?([BQbq])\?([^?]*)\?=/g;
  return encoded.replace(regex, (match, charset, encoding, data) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        const binString = atob(data);
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
        return new TextDecoder(charset).decode(bytes);
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
        return new TextDecoder(charset).decode(new Uint8Array(bytes));
      }
    } catch {
      return match;
    }
  });
};

/**
 * High-level processor for MIME tool to handle encoding and decoding of body content
 */
export const processMimeContent = (content: string, type: 'base64' | 'quoted-printable', mode: 'encode' | 'decode'): string => {
  if (mode === 'encode') {
    return type === 'base64' ? encodeBase64(content) : encodeQuotedPrintable(content);
  } else {
    try {
      if (type === 'base64') {
        const binString = atob(content.replace(/\s/g, ''));
        const bytes = new Uint8Array(binString.length);
        for (let i = 0; i < binString.length; i++) bytes[i] = binString.charCodeAt(i);
        return new TextDecoder().decode(bytes);
      } else {
        const bytes: number[] = [];
        const processed = content.replace(/=\r?\n/g, ''); // Remove soft line breaks
        for (let i = 0; i < processed.length; i++) {
          if (processed[i] === '=' && i + 2 < processed.length) {
            bytes.push(parseInt(processed.substring(i + 1, i + 3), 16));
            i += 2;
          } else {
            bytes.push(processed.charCodeAt(i));
          }
        }
        return new TextDecoder().decode(new Uint8Array(bytes));
      }
    } catch (e) {
      throw new Error(`Failed to decode ${type} content: ${e instanceof Error ? e.message : 'Invalid format'}`);
    }
  }
};
