const fs = require('fs');
const maxmind = require('maxmind');
const net = require('net');

const { appConfig } = require('../config/env');

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });
let countryLookupPromise = null;
let warnedMissingGeoIpDb = false;

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

async function getCountryLookup() {
  if (!appConfig.geoipDbPath || !fs.existsSync(appConfig.geoipDbPath)) {
    if (!warnedMissingGeoIpDb) {
      console.warn(
        `GeoIP database not found. Set GEOIP_DB_PATH to a readable GeoLite2-Country.mmdb file. Current path: ${
          appConfig.geoipDbPath || '(empty)'
        }`
      );
      warnedMissingGeoIpDb = true;
    }

    return null;
  }

  if (!countryLookupPromise) {
    countryLookupPromise = maxmind.open(appConfig.geoipDbPath).catch((error) => {
      countryLookupPromise = null;
      throw error;
    });
  }

  return countryLookupPromise;
}

async function getCountryFromIp(ipAddress) {
  if (isPrivateIp(ipAddress)) {
    return {
      countryCode: null,
      countryName: null
    };
  }

  try {
    const lookup = await getCountryLookup();
    const result = lookup?.get(ipAddress);
    const countryCode = result?.country?.iso_code || result?.registered_country?.iso_code || '';

    if (!countryCode) {
      return {
        countryCode: null,
        countryName: null
      };
    }

    return {
      countryCode,
      countryName: countryNames.of(countryCode) || result?.country?.names?.en || countryCode
    };
  } catch (error) {
    console.warn(`GeoIP lookup failed: ${error.message}`);

    return {
      countryCode: null,
      countryName: null
    };
  }
}

module.exports = {
  getCountryFromIp
};
