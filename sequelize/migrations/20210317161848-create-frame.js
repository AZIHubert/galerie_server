module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('frame', {
  id: {
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataTypes.BIGINT,
  },
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

module.exports.down = (queryInterface) => queryInterface.dropTable('frame');
