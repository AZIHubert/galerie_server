module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'frame',
  'numOfLikes',
  {
    allowNull: false,
    defaultValue: 0,
    type: Sequelize.INTEGER,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'frame',
  'numOfLikes',
);
