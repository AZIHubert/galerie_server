module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'confirmed',
  {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'confirmed',
);
