module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'admin',
  {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'admin',
);
