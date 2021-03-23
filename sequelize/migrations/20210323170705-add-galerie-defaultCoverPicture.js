module.exports.up = (queryInterface, Sequelize) => queryInterface.addColumn(
  'galerie',
  'defaultCoverPicture',
  {
    type: Sequelize.STRING,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'galerie',
  'defaultCoverPicture',
);
