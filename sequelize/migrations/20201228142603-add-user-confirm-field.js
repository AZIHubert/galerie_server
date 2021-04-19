module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'confirmed',
  {
    allowNull: false,
    defaultValue: false,
    type: Sequelize.BOOLEAN,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'confirmed',
);
