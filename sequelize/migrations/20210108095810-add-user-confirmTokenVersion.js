module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'confirmedTokenVersion',
  {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 0,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'confirmedTokenVersion',
);
