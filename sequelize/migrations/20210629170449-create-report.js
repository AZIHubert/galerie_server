module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('report', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
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
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('report');
