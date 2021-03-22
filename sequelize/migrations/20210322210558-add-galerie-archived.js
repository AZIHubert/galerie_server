module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'galerie',
  'archived',
  {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'galerie',
  'archived',
);
