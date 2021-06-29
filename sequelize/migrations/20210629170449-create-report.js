module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('report', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  classed: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  frameId: {
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
  numOfReports: {
    allowNull: false,
    defaultValue: 1,
    type: DataTypes.INTEGER,
  },
  profilePictureId: {
    references: {
      key: 'id',
      model: 'profilePicture',
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

module.exports.down = (queryInterface) => queryInterface.dropTable('report');
