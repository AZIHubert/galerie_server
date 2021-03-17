module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('galerieUser', {
  galerieId: {
    references: {
      key: 'id',
      model: 'galerie',
    },
    type: DataTypes.BIGINT,
  },
  userId: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.BIGINT,
  },
  role: {
    allowNull: false,
    type: DataTypes.STRING,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('galerieUser');
