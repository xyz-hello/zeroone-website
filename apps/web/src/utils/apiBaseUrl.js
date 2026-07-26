export function getApiBaseUrl() {
  const configuredUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  return configuredUrl.replace(/\/api\/?$/, '');
}
