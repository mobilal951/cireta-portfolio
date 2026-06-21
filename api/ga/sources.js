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

function getMockSources() {
  return {
    channels: [
      { channel: 'Direct', users: 304, sessions: 446, fill: '#13636f' },
      { channel: 'Organic Search', users: 187, sessions: 268, fill: '#1a7a88' },
      { channel: 'Organic Social', users: 96, sessions: 134, fill: '#3ab0c4' },
      { channel: 'Referral', users: 64, sessions: 92, fill: '#5cc4d4' },
      { channel: 'Email', users: 28, sessions: 42, fill: '#7dd3e0' },
      { channel: 'Unassigned', users: 19, sessions: 42, fill: '#a0e2eb' },
    ],
    sources: [
      { source: '(direct)', users: 304, sessions: 446 },
      { source: 'google', users: 178, sessions: 254 },
      { source: 'linkedin.com', users: 64, sessions: 88 },
      { source: 'twitter.com', users: 22, sessions: 32 },
      { source: 'github.com', users: 14, sessions: 18 },
      { source: 'bing', users: 9, sessions: 14 },
    ],
    mediums: [
      { medium: '(none)', users: 304, sessions: 446 },
      { medium: 'organic', users: 187, sessions: 268 },
      { medium: 'social', users: 96, sessions: 134 },
      { medium: 'referral', users: 64, sessions: 92 },
      { medium: 'email', users: 28, sessions: 42 },
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
    return res.json(getMockSources());
  }

  try {
    const colors = ['#13636f', '#1a7a88', '#2596a8', '#3ab0c4', '#5cc4d4', '#7dd3e0', '#a0e2eb', '#c3f0f5'];

    // Fetch channel grouping data
    const [channelResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionDefaultChannelGroup' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    // Fetch source data
    const [sourceResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionSource' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    // Fetch medium data
    const [mediumResponse] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'sessionMedium' }],
      metrics: [{ name: 'activeUsers' }, { name: 'sessions' }],
      orderBys: [{ metric: { metricName: 'activeUsers' }, desc: true }],
      limit: 10,
    });

    const result = {
      channels: [],
      sources: [],
      mediums: [],
    };

    if (channelResponse.rows) {
      result.channels = channelResponse.rows.map((row, idx) => ({
        channel: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
        fill: colors[idx % colors.length],
      }));
    }

    if (sourceResponse.rows) {
      result.sources = sourceResponse.rows.map((row) => ({
        source: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
      }));
    }

    if (mediumResponse.rows) {
      result.mediums = mediumResponse.rows.map((row) => ({
        medium: row.dimensionValues[0].value,
        users: parseInt(row.metricValues[0].value),
        sessions: parseInt(row.metricValues[1].value),
      }));
    }

    res.json(result);
  } catch (error) {
    console.error('GA Sources Error:', error.message);
    res.json(getMockSources());
  }
}
