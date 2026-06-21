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

function getMockCountries() {
  return [
    { country: 'United States', users: 272, fill: '#13636f' },
    { country: 'Singapore', users: 209, fill: '#1a7a88' },
    { country: 'China', users: 91, fill: '#2596a8' },
    { country: 'India', users: 63, fill: '#3ab0c4' },
    { country: 'United Arab Emirates', users: 63, fill: '#5cc4d4' },
  ];
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
    return res.json(getMockCountries());
  }

  try {
    const [response] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'country' }],
      metrics: [{ name: 'activeUsers' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    if (response.rows) {
      const colors = ['#13636f', '#1a7a88', '#2596a8', '#3ab0c4', '#5cc4d4', '#7dd3e0', '#a0e2eb', '#c3f0f5', '#e0f7fa', '#f0fbfc'];
      const countries = response.rows.map((row, idx) => ({
        country: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        fill: colors[idx % colors.length],
      }));
      res.json(countries);
    } else {
      res.json(getMockCountries());
    }
  } catch (error) {
    console.error('GA Countries Error:', error.message);
    res.json(getMockCountries());
  }
}
