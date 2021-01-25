module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'facebookId',
  {
    type: DataTypes.STRING,
    unique: true,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'facebookId',
);
