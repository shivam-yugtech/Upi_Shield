function getDb(req) {
  return req.app.get('prisma');
}

module.exports = { getDb };
