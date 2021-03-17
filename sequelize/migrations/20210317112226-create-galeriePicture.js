module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galeriePicture', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT,
  },
  index: {
    allowNull: false,
    defaultValue: 0,
    type: DataTypes.INTEGER,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
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

module.exports.down = (queryInterface) => queryInterface.dropTable('galeriePicture');
