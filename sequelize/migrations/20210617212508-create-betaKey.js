module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('betaKey', {
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
  usedAt: {
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

module.exports.down = (queryInterface) => queryInterface.dropTable('betaKey');
