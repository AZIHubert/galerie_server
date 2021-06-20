module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('betaKey', {
  code: {
    type: DataTypes.STRING,
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
