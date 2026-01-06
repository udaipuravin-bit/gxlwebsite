
import { UrlTraceHop, UrlTraceResult } from '../types';

const MAX_HOPS = 20;

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
 * Traces URL redirects.
 * Note: Due to browser CORS restrictions, true manual redirect following usually requires a server-side component.
 * We use a specialized proxy for this forensic trace.
 */
export const traceUrlRedirects = async (initialUrl: string): Promise<UrlTraceResult> => {
  let currentUrl = initialUrl;
  const hops: UrlTraceHop[] = [];
  const visitedUrls = new Set<string>();
  let isComplete = false;

  try {
    while (hops.length < MAX_HOPS && !isComplete) {
      if (visitedUrls.has(currentUrl)) {
        throw new Error("Redirect loop detected.");
      }
      visitedUrls.add(currentUrl);

      // Using a proxy that allows us to see redirect headers or at least returns them
      // In a real production tool, this would be a custom Node.js endpoint.
      // For this sandbox, we use a fetch with redirect manual and fallback logic.
      const proxyUrl = `https://cors-anywhere.herokuapp.com/${currentUrl}`;
      
      // We attempt a HEAD request first for performance
      const response = await fetch(proxyUrl, { 
        method: 'HEAD',
        redirect: 'manual' 
      });

      const statusCode = response.status === 0 ? 302 : response.status; // cors-anywhere handles some redirects
      const location = response.headers.get('location') || response.headers.get('x-final-url');
      
      hops.push({
        id: hops.length + 1,
        url: currentUrl,
        statusCode: statusCode,
        meaning: HTTP_STATUS_DATA[statusCode] || "Unknown Status",
        statusClass: getStatusClass(statusCode)
      });

      if (statusCode >= 300 && statusCode < 400 && location) {
        // Resolve relative URL
        currentUrl = new URL(location, currentUrl).href;
      } else {
        isComplete = true;
      }
    }

    return { targetUrl: initialUrl, hops, isComplete };
  } catch (err: any) {
    // Fallback: If CORS blocks our manual trace, we use a single follow fetch to get the final destination
    if (hops.length === 0) {
      try {
        const directRes = await fetch(initialUrl);
        return {
          targetUrl: initialUrl,
          hops: [{
            id: 1,
            url: initialUrl,
            statusCode: directRes.status,
            meaning: HTTP_STATUS_DATA[directRes.status] || "OK",
            statusClass: getStatusClass(directRes.status)
          }],
          isComplete: true
        };
      } catch (e) {
        return { targetUrl: initialUrl, hops, isComplete: false, error: "Network error or CORS restriction. Detailed hop tracing requires a server-side proxy." };
      }
    }
    return { targetUrl: initialUrl, hops, isComplete: false, error: err.message };
  }
};
