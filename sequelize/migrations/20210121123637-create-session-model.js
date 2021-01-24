module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('Sessions', {
  sid: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  expires: DataTypes.DATE,
  data: DataTypes.TEXT,
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
}, { charset: 'utf8' });

module.exports.down = (queryInterface) => queryInterface.dropTable('Sessions');
