module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('notification', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
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
  type: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
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

module.exports.down = (queryInterface) => queryInterface.dropTable('notification');
