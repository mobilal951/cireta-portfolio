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

function getMockOverview() {
  return {
    activeUsers: 698,
    sessions: 1024,
    pageViews: 1576,
    events: 6207,
    avgSessionDuration: 306,
    bounceRate: 8.0,
    newUsers: 659,
    engagedSessions: 942,
    _isMock: true,
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
    return res.json(getMockOverview());
  }

  try {
    const [response] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [
        { name: 'activeUsers' },
        { name: 'sessions' },
        { name: 'screenPageViews' },
        { name: 'eventCount' },
        { name: 'averageSessionDuration' },
        { name: 'bounceRate' },
        { name: 'newUsers' },
        { name: 'engagedSessions' },
      ],
    });

    if (response.rows && response.rows[0]) {
      const metrics = response.rows[0].metricValues;
      res.json({
        activeUsers: parseInt(metrics[0].value),
        sessions: parseInt(metrics[1].value),
        pageViews: parseInt(metrics[2].value),
        events: parseInt(metrics[3].value),
        avgSessionDuration: parseFloat(metrics[4].value),
        bounceRate: parseFloat(metrics[5].value) * 100,
        newUsers: parseInt(metrics[6].value),
        engagedSessions: parseInt(metrics[7].value),
        _isLive: true
      });
    } else {
      res.json({ ...getMockOverview(), _isLive: false, _noRows: true });
    }
  } catch (error) {
    console.error('GA Overview Error:', error.message);
    res.json({
      ...getMockOverview(),
      _error: error.message,
      _isLive: false
    });
  }
}
