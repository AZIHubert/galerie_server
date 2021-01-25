module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'defaultProfilePicture',
  {
    type: DataTypes.STRING,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'defaultProfilePicture',
);
