import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import BetaKey from '../betaKey';
import BlackList from '../blackList';
import Frame from '../frame';
import Galerie from '../galerie';
import GalerieBlackList from '../galerieBlackLists';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import Like from '../like';
import Notification from '../notification';
import NotificationBetaKeyUsed from '../notificationBetaKeyUsed';
import NotificationFrameLiked from '../notificationFrameLiked';
import NotificationUserSubscribe from '../notificationUserSubscribe';
import ProfilePicture from '../profilePicture';
import Ticket from '../ticket';

interface UserI {
  authTokenVersion: number;
  confirmed: boolean;
  confirmTokenVersion: number;
  defaultProfilePicture?: string;
  emailTokenVersion: number;
  email?: string;
  facebookId?: string;
  googleId?: string;
  hash?: string;
  id: string;
  isBlackListed: boolean;
  pseudonym?: string;
  resetPasswordTokenVersion: number;
  role: 'superAdmin' | 'admin' | 'user';
  salt?: string;
  socialMediaUserName?: string;
  updatedEmailTokenVersion: number;
  userName?: string;
}

@Table({
  tableName: 'users',
})
export default class User extends Model implements UserI {
  // Use to check if the authToken use to
  // access different routes is valid.
  // If the user update his email/password,
  // the authTokenVersion is incremented.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  authTokenVersion!: number;

  // Use to check if a user
  // has confirmed his account.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  confirmed!: boolean;

  // When a user want to confirme his account
  // A email his sent to his current adress email
  // with a JWT containing the current confirmTokenVersion
  // and confirmTokenVersion his incremented.
  // If multiple email have been send,
  // only the last one gonna be valid.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  confirmTokenVersion!: number;

  // When a user create an account
  // with Facebook or Google,
  // his profile picture from this social media
  // is saved on his Galerie account.
  @Column({
    type: DataType.STRING,
  })
  defaultProfilePicture!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  // When a user want to update his email
  // A email his sent to his current adress email
  // with a JWT containing the current emailTokenVersion
  // and emailTokenVersion his incremented.
  // If multiple email have been send,
  // only the last one gonna be valid.
  @Default(0)
  @Column({
    type: DataType.INTEGER,
  })
  emailTokenVersion!: number;

  @Column({
    type: DataType.STRING,
  })
  facebookId!: string;

  @Column({
    type: DataType.STRING,
  })
  googleId!: string;

  // Use for password.
  @Column({
    type: DataType.STRING,
  })
  hash!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  isBlackListed!: boolean

  // user.userName can't be changed
  // but pseudonym can.
  // when a user is created,
  // user.pseudonym is equal to `@${userName}`.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  pseudonym!: string;

  // When a user want to reset his password
  // (because is forgot his current one)
  // A email his sent to his current adress email
  // with a JWT containing the current resetPasswordTokenVersion
  // and resetPasswordTokenVersion his incremented.
  // If multiple email have been send,
  // only the last one gonna be valid.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  resetPasswordTokenVersion!: number;

  @Default('user')
  @Column({
    type: DataType.ENUM('admin', 'superAdmin', 'user'),
  })
  role!: 'admin' | 'superAdmin' | 'user';

  // Use for password.
  @Column({
    type: DataType.STRING,
  })
  salt!: string;

  // If a user create an account with
  // Facebook or Google, socialMediaUserName
  // is used instead of userName.
  // userName need to be unique but between
  // multiple social media, the user name must
  // be equal.
  @Column({
    type: DataType.STRING,
  })
  socialMediaUserName!: string;

  // When a user want to change his email
  // A email his sent to the new adress email he register
  // with a JWT containing the current updatedEmailTokenVersion
  // and updatedEmailTokenVersion his incremented.
  // If multiple email have been send,
  // only the last one gonna be valid.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  updatedEmailTokenVersion!: number;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  userName!: string;

  @BelongsToMany(() => Galerie, () => GalerieUser)
  galeries!: Array<Galerie & {GalerieUser: GalerieUser}>;

  @BelongsToMany(() => Notification, () => NotificationBetaKeyUsed)
  notificationsBetaKeyUsed!: Array<
  Notification &
  {NotificationBetaKeyUsed: NotificationBetaKeyUsed}
  >;

  @BelongsToMany(() => Notification, () => NotificationFrameLiked)
  notificationsFrameLiked!: Array<
  Notification &
  {NotificationFrameLiked: NotificationFrameLiked}
  >;

  @BelongsToMany(() => Notification, () => NotificationUserSubscribe)
  notificationsUserSubscribe!: Array<
  Notification &
  {NotificationUserSubscribe: NotificationUserSubscribe}
  >;

  @HasMany(() => BetaKey, 'createdById')
  betaKeyCreatedBy!: BetaKey[];

  @HasMany(() => BetaKey, 'userId')
  betaKeyUser!: BetaKey[];

  @HasMany(() => BlackList, 'createdById')
  blackListsCreated!: BlackList[];

  @HasMany(() => BlackList, 'updatedById')
  blackListsUpdatedBy!: BlackList[];

  @HasMany(() => BlackList, 'userId')
  blackListsUser!: BlackList[];

  @HasMany(() => GalerieBlackList, 'createdById')
  galerieBlackListsCreated!: GalerieBlackList[];

  @HasMany(() => GalerieBlackList, 'userId')
  galerieBlackListsUser!: GalerieBlackList[];

  @HasMany(() => Frame, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  frames!: Frame[];

  @HasMany(() => Invitation, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  invitations!: Invitation[];

  @HasMany(() => Like, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  likes!: Like[];

  @HasMany(() => Notification, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  notifications!: Notification[];

  @HasMany(() => ProfilePicture, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  profilePictures!: ProfilePicture[];

  @HasMany(() => Ticket)
  tickets!: Ticket[];
}
