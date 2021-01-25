module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'image',
  'signedUrl',
  {
    type: DataTypes.STRING,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'image',
  'signedUrl',
);
