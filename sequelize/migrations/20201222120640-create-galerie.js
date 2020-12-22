module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galeries', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT,
  },
  name: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  userId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.BIGINT,
  },
  createAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  deleteAt: {
    allowNull: true,
    type: DataTypes.DATE,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('galeries');
