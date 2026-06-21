import { BetaAnalyticsDataClient } from '@google-analytics/data';

const PROPERTY_ID = '472271698';

function getAnalyticsClient() {
  if (process.env.GA_CLIENT_EMAIL && process.env.GA_PRIVATE_KEY) {
    return new BetaAnalyticsDataClient({
      credentials: {
        client_email: process.env.GA_CLIENT_EMAIL,
        private_key: process.env.GA_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
    });
  }
  return null;
}

function getMockDemographics() {
  return {
    browsers: [
      { browser: 'Chrome', users: 412, fill: '#13636f' },
      { browser: 'Safari', users: 168, fill: '#1a7a88' },
      { browser: 'Edge', users: 64, fill: '#3ab0c4' },
      { browser: 'Firefox', users: 36, fill: '#5cc4d4' },
      { browser: 'Opera', users: 12, fill: '#7dd3e0' },
      { browser: 'Samsung Internet', users: 6, fill: '#a0e2eb' },
    ],
    operatingSystems: [
      { os: 'Windows', users: 318, fill: '#13636f' },
      { os: 'macOS', users: 196, fill: '#1a7a88' },
      { os: 'iOS', users: 112, fill: '#3ab0c4' },
      { os: 'Android', users: 58, fill: '#5cc4d4' },
      { os: 'Linux', users: 14, fill: '#7dd3e0' },
    ],
    screenResolutions: [
      { resolution: '1920x1080', users: 198 },
      { resolution: '1536x864', users: 124 },
      { resolution: '1366x768', users: 96 },
      { resolution: '2560x1440', users: 82 },
      { resolution: '1440x900', users: 54 },
      { resolution: '390x844', users: 48 },
    ],
    languages: [
      { language: 'en-us', users: 312 },
      { language: 'en-gb', users: 84 },
      { language: 'zh-cn', users: 76 },
      { language: 'en', users: 58 },
      { language: 'hi-in', users: 42 },
      { language: 'ar', users: 38 },
    ],
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { startDate = '90daysAgo', endDate = 'today' } = req.query;

  const analyticsClient = getAnalyticsClient();

  if (!analyticsClient) {
    return res.json(getMockDemographics());
  }

  try {
    const colors = ['#13636f', '#1a7a88', '#2596a8', '#3ab0c4', '#5cc4d4', '#7dd3e0', '#a0e2eb', '#c3f0f5'];

    // Fetch browser data
    const [browserResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'browser' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    });

    // Fetch OS data
    const [osResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'operatingSystem' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    });

    // Fetch screen resolution data
    const [resolutionResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'screenResolution' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    });

    // Fetch language data
    const [languageResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'language' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 8,
    });

    const result = {
      browsers: [],
      operatingSystems: [],
      screenResolutions: [],
      languages: [],
    };

    if (browserResponse.rows) {
      result.browsers = browserResponse.rows.map((row, idx) => ({
        browser: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        fill: colors[idx % colors.length],
      }));
    }

    if (osResponse.rows) {
      result.operatingSystems = osResponse.rows.map((row, idx) => ({
        os: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        fill: colors[idx % colors.length],
      }));
    }

    if (resolutionResponse.rows) {
      result.screenResolutions = resolutionResponse.rows.map((row) => ({
        resolution: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
      }));
    }

    if (languageResponse.rows) {
      result.languages = languageResponse.rows.map((row) => ({
        language: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
      }));
    }

    res.json(result);
  } catch (error) {
    console.error('GA Demographics Error:', error.message);
    res.json(getMockDemographics());
  }
}
