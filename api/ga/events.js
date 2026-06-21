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
    // System (catch-all)
    { eventName: 'page_view',                  count: 2070 },
    { eventName: 'session_start',              count: 1208 },
    { eventName: 'gtm.js',                     count: 1256 },
    { eventName: 'first_visit',                count: 749  },
    { eventName: 'user_engagement',            count: 558  },
    { eventName: 'scroll',                     count: 309  },
    { eventName: 'click',                      count: 31   },
    { eventName: 'file_download',              count: 31   },
    { eventName: 'generate_lead',              count: 42   },
    // Menu_
    { eventName: 'Menu_Home',                  count: 44   },
    { eventName: 'Menu_Projects',              count: 37   },
    { eventName: 'Menu_AboutUs',               count: 16   },
    { eventName: 'Menu_Contacts',              count: 14   },
    { eventName: 'Menu_RWA',                   count: 7    },
    // HomePage_
    { eventName: 'HomePage_LearnMore',         count: 13   },
    { eventName: 'HomePage_ApplyforFunding',   count: 1    },
    { eventName: 'HomePage_Commodities',       count: 1    },
    // Form_
    { eventName: 'Form_Start',                 count: 5    },
    { eventName: 'Form_Submit',                count: 1    },
    // Footer_
    { eventName: 'Footer_LinkedIn',            count: 2    },
    { eventName: 'Footer_Twitter',             count: 1    },
    // RWA_
    { eventName: 'RWA_Requirements',           count: 1    },
    // Priority/Register
    { eventName: 'PriorityList_Submit',        count: 3    },
    { eventName: 'Register_Click',             count: 2    },
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
