module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('notification', {
  userId: {
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.BIGINT,
  },
  type: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  frameId: {
    allowNull: true,
    references: {
      key: 'id',
      model: 'frame',
    },
    type: DataTypes.BIGINT,
  },
  galerieId: {
    references: {
      key: 'id',
      model: 'galerie',
    },
    type: DataTypes.BIGINT,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('notification');
