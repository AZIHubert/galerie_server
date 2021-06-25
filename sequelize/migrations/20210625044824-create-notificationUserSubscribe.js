module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('notificationUserSubscribe', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  notificationId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'notification',
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

module.exports.down = (queryInterface) => queryInterface.dropTable('notificationUserSubscribe');
