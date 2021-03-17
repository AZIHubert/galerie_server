module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('profilePicture', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
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
  deletedAt: {
    allowNull: true,
    type: DataTypes.DATE,
  },
  userId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.BIGINT,
  },
  originalImageId: {
    references: {
      key: 'id',
      model: 'image',
    },
    type: DataTypes.BIGINT,
  },
  cropedImageId: {
    references: {
      key: 'id',
      model: 'image',
    },
    type: DataTypes.BIGINT,
  },
  pendingImageId: {
    references: {
      key: 'id',
      model: 'image',
    },
    type: DataTypes.BIGINT,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('profilePicture');
