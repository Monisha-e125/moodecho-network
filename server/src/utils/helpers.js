const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
};

const getDayOfWeek = (date = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

const getDateRange = (days) => {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
};

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

const roundTo = (value, decimals = 1) => {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

const getPaginationData = (page, limit, total) => {
  return {
    page: parseInt(page),
    limit: parseInt(limit),
    total,
    pages: Math.ceil(total / limit),
    hasMore: page * limit < total
  };
};

module.exports = {
  getTimeOfDay,
  getDayOfWeek,
  getDateRange,
  sanitizeInput,
  roundTo,
  getPaginationData
};