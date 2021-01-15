module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('image', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT,
  },
  bucketName: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  fileName: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  format: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  height: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  size: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  width: {
    allowNull: false,
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
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('image');
