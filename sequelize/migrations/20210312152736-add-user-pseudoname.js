module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'pseudonym',
  {
    allowNull: false,
    type: DataTypes.STRING,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'pseudonym',
);
