module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('like', {
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

module.exports.down = (queryInterface) => queryInterface.dropTable('like');
