module.exports.up = (queryInterface, DataTypes) => queryInterface.createTable('users', {
  authTokenVersion: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  blackListedAt: {
    default: null,
    type: DataTypes.DATE,
  },
  confirmed: {
    allowNull: false,
    default: false,
    type: DataTypes.BOOLEAN,
  },
  confirmTokenVersion: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  createdAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  defaultProfilePicture: {
    type: DataTypes.STRING,
  },
  emailTokenVersion: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
  },
  facebookId: {
    type: DataTypes.STRING,
    unique: true,
  },
  googleId: {
    type: DataTypes.STRING,
    unique: true,
  },
  hash: {
    type: DataTypes.STRING,
  },
  id: {
    allowNull: false,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    type: DataTypes.UUID,
  },
  isBlackListed: {
    allowNull: false,
    defaultValue: false,
    type: DataTypes.BOOLEAN,
  },
  pseudonym: {
    allowNull: false,
    type: DataTypes.STRING,
  },
  resetPasswordTokenVersion: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  role: {
    allowNull: false,
    default: 'user',
    type: DataTypes.STRING,
  },
  salt: {
    type: DataTypes.STRING,
  },
  socialMediaUserName: {
    type: DataTypes.STRING,
  },
  updatedEmailTokenVersion: {
    allowNull: false,
    default: 0,
    type: DataTypes.INTEGER,
  },
  updatedAt: {
    allowNull: false,
    type: DataTypes.DATE,
  },
  userName: {
    type: DataTypes.STRING,
    unique: true,
  },
}, {
  charset: 'utf8',
});

module.exports.down = (queryInterface) => queryInterface.dropTable('users');
