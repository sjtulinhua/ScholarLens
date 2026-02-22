import dns from 'dns';
import { ProxyAgent, setGlobalDispatcher } from 'undici';
import 'dotenv/config';

/**
 * Configure global network settings for Node.js scripts.
 * Supports:
 * 1. 'direct' - Typically for Router VPNs that need IPv4 first.
 * 2. 'proxy'  - For local proxies like Clash/V2Ray.
 */
export function setupNetwork() {
  const mode = process.env.NETWORK_MODE || 'direct'; // Default to direct
  // Prioritize PROXY_URL, fallback to GEMINI_BASE_URL (which we hijacked earlier for proxy)
  const proxyUrl = process.env.PROXY_URL || process.env.GEMINI_BASE_URL;

  console.log(`[Network] Configuring for mode: ${mode}`);

  if (mode === 'direct') {
    // Force IPv4 first to avoid IPv6 issues common with Router VPNs
    dns.setDefaultResultOrder('ipv4first');
    console.log('[Network] DNS: setDefaultResultOrder("ipv4first") applied.');
  } else if (mode === 'proxy' && proxyUrl) {
    // Use undici global dispatcher for proxy support
    const agent = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(agent);
    console.log(`[Network] Proxy: Global undici dispatcher set to ${proxyUrl}`);
  } else if (mode === 'proxy' && !proxyUrl) {
    console.warn('[Network] Warning: NETWORK_MODE is "proxy" but GEMINI_BASE_URL is not defined.');
  }
}
