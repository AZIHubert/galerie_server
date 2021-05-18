module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('image', {
  bucketName: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
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
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  size: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  width: {
    allowNull: false,
    type: DataTypes.INTEGER,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('image');
