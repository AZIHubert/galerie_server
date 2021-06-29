module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('betaKey', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  code: {
    type: DataTypes.STRING,
    unique: true,
  },
  createdById: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.UUID,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  email: {
    type: DataTypes.STRING,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  notificationHasBeenSend: {
    allowNull: false,
    default: false,
    type: DataTypes.BOOLEAN,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  userId: {
    references: {
      key: 'id',
      model: 'users',
    },
    unique: true,
    type: DataTypes.UUID,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('betaKey');
