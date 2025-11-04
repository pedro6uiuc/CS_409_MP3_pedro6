function buildQueryParams(req, defaultLimit = 0) {
  let where = {};
  let sort = {};
  let select = {};
  let skip = 0;
  let limit = defaultLimit;
  let count = false;

  try {
    if (req.query.where) where = JSON.parse(req.query.where);
    if (req.query.sort) sort = JSON.parse(req.query.sort);
    if (req.query.select) select = JSON.parse(req.query.select);
    if (req.query.skip) skip = parseInt(req.query.skip);
    if (req.query.limit) limit = parseInt(req.query.limit);
    if (req.query.count && req.query.count === 'true') count = true;
  } catch (e) {
    throw new Error('Invalid JSON format in query parameters.');
  }

  return { where, sort, select, skip, limit, count };
}

module.exports = { buildQueryParams };