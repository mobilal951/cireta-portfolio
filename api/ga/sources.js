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
      { channel: 'Direct',         users: 531, sessions: 675, fill: '#13636f' },
      { channel: 'Organic Search', users: 185, sessions: 395, fill: '#1a7a88' },
      { channel: 'Organic Social', users: 31,  sessions: 54,  fill: '#2596a8' },
      { channel: 'Referral',       users: 25,  sessions: 66,  fill: '#3ab0c4' },
      { channel: 'Unassigned',     users: 13,  sessions: 17,  fill: '#5cc4d4' },
      { channel: 'AI Assistant',   users: 4,   sessions: 4,   fill: '#7dd3e0' },
    ],
    sources: [
      { source: '(direct)',     users: 531, sessions: 675 },
      { source: 'google',       users: 178, sessions: 380 },
      { source: 'linkedin.com', users: 28,  sessions: 48  },
      { source: 'twitter.com',  users: 9,   sessions: 14  },
      { source: 'github.com',   users: 7,   sessions: 11  },
      { source: 'bing',         users: 5,   sessions: 8   },
      { source: 'chatgpt.com',  users: 4,   sessions: 4   },
    ],
    mediums: [
      { medium: '(none)',   users: 531, sessions: 675 },
      { medium: 'organic',  users: 185, sessions: 395 },
      { medium: 'social',   users: 31,  sessions: 54  },
      { medium: 'referral', users: 25,  sessions: 66  },
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
