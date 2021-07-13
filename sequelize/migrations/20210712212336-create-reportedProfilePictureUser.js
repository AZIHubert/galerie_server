module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('reportedProfilePictureUser', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  profilePictureId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'profilePicture',
    },
    type: DataTypes.UUID,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  userId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.UUID,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('reportedProfilePictureUser');
