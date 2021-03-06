module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galerieUser', {
  allowNotification: {
    allowNull: false,
    defaultValue: true,
    type: DataTypes.BOOLEAN,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  galerieId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'galerie',
    },
    type: DataTypes.UUID,
  },
  hasNewFrames: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  notificationHasBeenSend: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  role: {
    allowNull: false,
    type: DataTypes.ENUM('admin', 'moderator', 'user'),
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

module.exports.down = (queryInterface) => queryInterface.dropTable('galerieUser');
