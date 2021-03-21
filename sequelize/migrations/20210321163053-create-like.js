module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('like', {
  frameId: {
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
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('like');
