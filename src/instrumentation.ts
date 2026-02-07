
export async function register() {
  // 强制 Node.js 优先使用 IPv4
  // 解决部分路由器 VPN 仅代理 IPv4 导致 IPv6 直连 Google 被阻断的问题
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    try {
      const dns = await import('node:dns');
      if (dns.setDefaultResultOrder) {
        dns.setDefaultResultOrder('ipv4first');
        console.log('✅ [Instrumentation] DNS Order set to ipv4first to fix VPN connectivity');
      }
    } catch (e) {
      // Ignore if node:dns is unavailable
    }
  }
}
