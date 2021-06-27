module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('notificationFramePosted', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  frameId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'frame',
    },
    type: DataTypes.UUID,
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
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('notificationFramePosted');
