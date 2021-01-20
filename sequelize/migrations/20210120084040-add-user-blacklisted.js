module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'blackListed',
  {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'blackListed',
);
