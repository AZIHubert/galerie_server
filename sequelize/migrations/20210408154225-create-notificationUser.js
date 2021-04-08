module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galerieUser', {
  notificationId: {
    references: {
      key: 'id',
      model: 'notification',
    },
    type: DataTypes.BIGINT,
  },
  userId: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.BIGINT,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('galerieUser');
