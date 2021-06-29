module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galeriePicture', {
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
  frameId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'frame',
    },
    type: DataTypes.UUID,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  index: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
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
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('galeriePicture');
