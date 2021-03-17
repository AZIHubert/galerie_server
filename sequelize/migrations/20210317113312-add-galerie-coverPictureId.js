module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'galerie',
  'coverPictureId',
  {
    references: {
      key: 'id',
      model: 'boardImage',
    },
    type: DataTypes.BIGINT,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'galerie',
  'coverPictureId',
);
