module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'blackListId',
  {
    references: {
      key: 'id',
      model: 'blackList',
    },
    type: DataTypes.BIGINT,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'blackListId',
);
