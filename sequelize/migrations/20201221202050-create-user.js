module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('users', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT,
  },
  userName: {
    allowNull: false,
    type: DataTypes.STRING,
    unique: true,
  },
  email: {
    allowNull: false,
    type: DataTypes.STRING,
    unique: true,
  },
  password: {
    allowNul: true,
    type: DataTypes.STRING,
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

module.exports.down = (queryInterface) => queryInterface.dropTable('users');
