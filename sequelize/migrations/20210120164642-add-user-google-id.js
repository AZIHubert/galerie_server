module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'googleId',
  {
    type: DataTypes.STRING,
    unique: true,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'googleId',
);
