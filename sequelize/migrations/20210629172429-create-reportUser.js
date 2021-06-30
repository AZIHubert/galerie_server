module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('reportUser', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  reportId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'report',
    },
    type: DataTypes.UUID,
  },
  updatedAt: {
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

module.exports.down = (queryInterface) => queryInterface.dropTable('reportUser');
