const net = require('net');

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
const countryCache = new Map();
const countryLookupEndpoint = 'https://api.country.is';
const countryCacheTtlMs = 24 * 60 * 60 * 1000;
const countryLookupTimeoutMs = 2500;

function isPrivateIp(ipAddress) {
  if (!ipAddress || ipAddress === 'unknown') {
    return true;
  }

  if (ipAddress === '::1' || ipAddress === '127.0.0.1') {
    return true;
  }

  if (net.isIP(ipAddress) === 4) {
    const parts = ipAddress.split('.').map(Number);
    const [first, second] = parts;

    return (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254)
    );
  }

  return false;
}

function getCachedCountry(ipAddress) {
  const cached = countryCache.get(ipAddress);

  if (!cached) {
    return null;
  }

  if (Date.now() - cached.cachedAt > countryCacheTtlMs) {
    countryCache.delete(ipAddress);
    return null;
  }

  return cached.country;
}

function setCachedCountry(ipAddress, country) {
  countryCache.set(ipAddress, {
    cachedAt: Date.now(),
    country
  });
}

async function getCountryFromIp(ipAddress) {
  const unknownCountry = {
    countryCode: null,
    countryName: null
  };

  if (isPrivateIp(ipAddress)) {
    return unknownCountry;
  }

  const cachedCountry = getCachedCountry(ipAddress);

  if (cachedCountry) {
    return cachedCountry;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), countryLookupTimeoutMs);

  try {
    const response = await fetch(`${countryLookupEndpoint}/${encodeURIComponent(ipAddress)}`, {
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`country lookup returned ${response.status}`);
    }

    const payload = await response.json();
    const countryCode = typeof payload?.country === 'string' ? payload.country.trim().toUpperCase() : '';

    const country = countryCode.length === 2
      ? {
          countryCode,
          countryName: countryNames.of(countryCode) || countryCode
        }
      : unknownCountry;

    setCachedCountry(ipAddress, country);
    return country;
  } catch (error) {
    console.warn(`IP country lookup failed for ${ipAddress}: ${error.message}`);
    setCachedCountry(ipAddress, unknownCountry);
    return unknownCountry;
  } finally {
    clearTimeout(timeoutId);
  }
}

module.exports = {
  getCountryFromIp
};
