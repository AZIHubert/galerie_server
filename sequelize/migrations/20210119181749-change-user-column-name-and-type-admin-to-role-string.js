module.exports.up = (queryInterface, DataTypes) => Promise.all([
  queryInterface.renameColumn(
    'users',
    'admin',
    'role',
  ),
  queryInterface.changeColumn(
    'users',
    'admin',
    {
      defaultValue: 'user',
      type: DataTypes.STRING,
    },
  ),
]);

module.exports.down = (queryInterface, DataTypes) => Promise.all([
  queryInterface.changeColumn(
    'users',
    'role',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  ),
  queryInterface.renameColumn(
    'users',
    'role',
    'admin',
  ),
]);
