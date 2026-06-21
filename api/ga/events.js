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

function getMockEvents() {
  return [
    { eventName: 'page_view', count: 1576 },
    { eventName: 'session_start', count: 1024 },
    { eventName: 'scroll', count: 892 },
    { eventName: 'first_visit', count: 659 },
    { eventName: 'user_engagement', count: 1456 },
    { eventName: 'click', count: 412 },
    { eventName: 'view_platform', count: 124 },
    { eventName: 'cta_book_demo', count: 38 },
    { eventName: 'form_submit', count: 26 },
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
    return res.json(getMockEvents());
  }

  try {
    const [response] = await analyticsClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [{ startDate, endDate }],
      dimensions: [{ name: 'eventName' }],
      metrics: [{ name: 'eventCount' }],
      orderBys: [{ metric: { metricName: 'eventCount' }, desc: true }],
      limit: 50,
    });

    if (response.rows) {
      const events = response.rows.map((row) => ({
        eventName: row.dimensionValues[0].value,
        count: parseInt(row.metricValues[0].value),
      }));
      res.json(events);
    } else {
      res.json(getMockEvents());
    }
  } catch (error) {
    console.error('GA Events Error:', error.message);
    res.json(getMockEvents());
  }
}
