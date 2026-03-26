import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

// 1. All firms: address + domains
const firms = await p.firm.findMany({ select: { companyName: true, hqAddress: true, domains: true } });
console.log('=== FIRMS ===');
firms.forEach(f => console.log(`  ${f.companyName} | Address: "${f.hqAddress}" | Domains: ${JSON.stringify(f.domains)}`));

// 2. All requests with requester address info
const requests = await p.request.findMany({
  select: {
    id: true,
    category: true,
    requester: {
      select: {
        tenant: { select: { addressText: true, hoa: { select: { buildingAddress: true } } } },
        hoa: { select: { buildingAddress: true } }
      }
    }
  }
});

const extractCity = (address) => {
  if (!address) return null;
  const parts = address.split(',').map(p => p.trim());
  for (let i = 1; i < parts.length; i++) {
    if (/^bloc\s/i.test(parts[i])) continue;
    if (/^\d{5,6}$/.test(parts[i])) continue;
    if (/^sector\s/i.test(parts[i])) continue;
    return parts[i];
  }
  return null;
};

console.log('\n=== REQUESTS ===');
requests.forEach(r => {
  const addr = r.requester.tenant?.hoa?.buildingAddress || r.requester.hoa?.buildingAddress || r.requester.tenant?.addressText || '';
  const city = extractCity(addr);
  console.log(`  ID: ${r.id.slice(0,8)}... | Category: "${r.category}" | Address: "${addr}" | Extracted city: "${city}"`);
});

// 3. HOA addresses
const hoas = await p.hoa.findMany({ select: { presidentName: true, buildingAddress: true } });
console.log('\n=== HOAs ===');
hoas.forEach(h => console.log(`  ${h.presidentName} | Address: "${h.buildingAddress}"`));

await p.$disconnect();
