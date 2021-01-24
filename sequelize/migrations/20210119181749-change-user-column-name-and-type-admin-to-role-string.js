module.exports.up = (queryInterface, DataTypes) => Promise.all([
  queryInterface.addColumn('users', 'role', {
    defaultValue: 'user',
    type: DataTypes.STRING,
  }),
  queryInterface.removeColumn('users', 'admin'),
]);

module.exports.down = (queryInterface, DataTypes) => Promise.all([
  queryInterface.removeColumn('users', 'role'),
  queryInterface.addColumn(
    'users',
    'admin',
    {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  ),
]);
