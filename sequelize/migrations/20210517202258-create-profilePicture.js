module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('profilePicture', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  cropedImageId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'image',
    },
    type: DataTypes.UUID,
  },
  current: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  originalImageId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'image',
    },
    type: DataTypes.UUID,
  },
  pendingImageId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'image',
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

module.exports.down = (queryInterface) => queryInterface.dropTable('profilePicture');
