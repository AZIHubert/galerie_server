module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'galeriePicture',
  'frameId',
  {
    allowNull: false,
    references: {
      key: 'id',
      model: 'frame',
    },
    type: DataTypes.BIGINT,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'galeriePicture',
  'frameId',
);
