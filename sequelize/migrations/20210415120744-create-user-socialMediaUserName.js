module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'users',
  'socialMediaUserName',
  {
    type: Sequelize.STRING,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'socialMediaUserName',
);
