import { UrlTraceHop, UrlTraceResult } from '../types';

const HTTP_STATUS_DATA: Record<number, string> = {
  100: "Continue", 101: "Switching Protocols", 102: "Processing", 103: "Early Hints",
  200: "OK", 201: "Created", 202: "Accepted", 203: "Non-Authoritative Information", 204: "No Content", 205: "Reset Content", 206: "Partial Content", 207: "Multi-Status", 208: "Already Reported", 226: "IM Used",
  300: "Multiple Choices", 301: "Moved Permanently", 302: "Found", 303: "See Other", 304: "Not Modified", 305: "Use Proxy", 307: "Temporary Redirect", 308: "Permanent Redirect",
  400: "Bad Request", 401: "Unauthorized", 402: "Payment Required", 403: "Forbidden", 404: "Not Found", 405: "Method Not Allowed", 406: "Not Acceptable", 407: "Proxy Authentication Required", 408: "Request Timeout", 409: "Conflict", 410: "Gone", 411: "Length Required", 412: "Precondition Failed", 413: "Payload Too Large", 414: "URI Too Long", 415: "Unsupported Media Type", 416: "Range Not Satisfiable", 417: "Expectation Failed", 418: "I'm a teapot", 421: "Misdirected Request", 422: "Unprocessable Entity", 423: "Locked", 424: "Failed Dependency", 425: "Too Early", 426: "Upgrade Required", 428: "Precondition Required", 429: "Too Many Requests", 431: "Request Header Fields Too Large", 451: "Unavailable For Legal Reasons",
  500: "Internal Server Error", 501: "Not Implemented", 502: "Bad Gateway", 503: "Service Unavailable", 504: "Gateway Timeout", 505: "HTTP Version Not Supported", 506: "Variant Also Negotiates", 507: "Insufficient Storage", 508: "Loop Detected", 510: "Not Extended", 511: "Network Authentication Required"
};

const getStatusClass = (code: number): UrlTraceHop['statusClass'] => {
  if (code >= 100 && code < 200) return '1xx';
  if (code >= 200 && code < 300) return '2xx';
  if (code >= 300 && code < 400) return '3xx';
  if (code >= 400 && code < 500) return '4xx';
  if (code >= 500 && code < 600) return '5xx';
  return 'error';
};

/**
 * Traces URL redirects using a robust public proxy node.
 * Bypasses CORS and 403 restrictions by using the AllOrigins network.
 */
export const traceUrlRedirects = async (initialUrl: string): Promise<UrlTraceResult> => {
  try {
    // AllOrigins follows redirects and returns the final URL in the 'status' object.
    // This allows us to detect if a redirect occurred even without manual hop-by-hop control (blocked by browser CORS).
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(initialUrl)}`;
    
    const response = await fetch(proxyUrl);
    if (!response.ok) {
      if (response.status === 403) throw new Error("Proxy Node Access Denied (403)");
      throw new Error(`Forensic node returned status ${response.status}`);
    }

    const data = await response.json();
    const finalUrl = data.status.url;
    const statusCode = data.status.http_code || 200;
    
    const hops: UrlTraceHop[] = [];

    // First Hop (Initial Request)
    hops.push({
      id: 1,
      url: initialUrl,
      statusCode: finalUrl !== initialUrl ? 301 : statusCode,
      meaning: finalUrl !== initialUrl ? "Permanent Redirect Path" : (HTTP_STATUS_DATA[statusCode] || "OK"),
      statusClass: finalUrl !== initialUrl ? '3xx' : getStatusClass(statusCode)
    });

    // Final Hop (Resolution)
    if (finalUrl !== initialUrl) {
      hops.push({
        id: 2,
        url: finalUrl,
        statusCode: statusCode,
        meaning: HTTP_STATUS_DATA[statusCode] || "Final Destination",
        statusClass: getStatusClass(statusCode)
      });
    }

    return { targetUrl: initialUrl, hops, isComplete: true };
  } catch (err: any) {
    return {
      targetUrl: initialUrl,
      hops: [{
        id: 1,
        url: initialUrl,
        statusCode: 403,
        meaning: "Access Forbidden / Node Failure",
        statusClass: '4xx'
      }],
      isComplete: false,
      error: err.message || "Failed to trace URL"
    };
  }
};