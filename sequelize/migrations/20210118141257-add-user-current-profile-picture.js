module.exports.up = (queryInterface, DataTypes) => queryInterface.addColumn(
  'users',
  'currentProfilePicture',
  {
    references: {
      key: 'id',
      model: 'profilePicture',
    },
    type: DataTypes.BIGINT,
  },
);

module.exports.down = (queryInterface) => queryInterface.removeColumn(
  'users',
  'currentProfilePicture',
);
