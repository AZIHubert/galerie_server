module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('notification', {
  autoIncrementId: {
    allowNull: false,
    autoIncrement: true,
    type: DataTypes.BIGINT,
  },
  frameId: {
    references: {
      key: 'id',
      model: 'frame',
    },
    type: DataTypes.UUID,
  },
  galerieId: {
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
  num: {
    type: DataTypes.INTEGER,
  },
  role: {
    type: DataTypes.STRING,
  },
  seen: {
    allowNull: false,
    default: false,
    type: DataTypes.BOOLEAN,
  },
  type: {
    allowNull: false,
    type: DataTypes.ENUM('FRAME_POSTED'),
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

module.exports.down = (queryInterface) => queryInterface.dropTable('notification');
