function withoutEmptyId(data) {
  const doc = { ...data };
  if (!doc._id) delete doc._id;
  return doc;
}

module.exports = { withoutEmptyId };
