module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'confirmTokenVersion',
  {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'confirmTokenVersion',
);
