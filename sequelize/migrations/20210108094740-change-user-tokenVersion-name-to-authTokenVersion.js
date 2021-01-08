module.exports.up = (queryInterface) => queryInterface.renameColumn(
  'users',
  'tokenVersion',
  'authTokenVersion',
);

module.exports.down = (queryInterface) => queryInterface.renameColumn(
  'users',
  'authTokenVersion',
  'tokenVersion',
);
