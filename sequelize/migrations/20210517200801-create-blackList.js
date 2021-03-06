module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('blackList', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  createdById: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.UUID,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  reason: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  time: {
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedById: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.UUID,
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

module.exports.down = (queryInterface) => queryInterface.dropTable('blackList');
