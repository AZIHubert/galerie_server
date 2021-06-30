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
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  type: {
    allowNull: false,
    type: DataTypes.ENUM(
      'BETA_KEY_USED',
      'FRAME_LIKED',
      'FRAME_POSTED',
      'GALERIE_ROLE_CHANGE',
      'ROLE_CHANGE',
      'USER_SUBSCRIBE',
    ),
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
