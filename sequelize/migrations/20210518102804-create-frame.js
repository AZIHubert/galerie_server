module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('frame', {
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  description: {
    type: DataTypes.STRING,
  },
  galerieId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'galerie',
    },
    type: DataTypes.UUID,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  numOfLikes: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  userId: {
    allowNull: false,
    references: {
      key: 'id',
      model: 'users',
    },
    type: DataTypes.UUID,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('frame');
