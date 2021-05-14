import {
  BelongsToMany,
  Column,
  DataType,
  Default,
  HasOne,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import BlackList from '../blackList';
import Frame from '../frame';
import Galerie from '../galerie';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import Like from '../like';
import Notification from '../notification';
import NotificationUser from '../notificationUser';
import ProfilePicture from '../profilePicture';
import Ticket from '../ticket';

interface UserI {
  authTokenVersion: number;
  confirmed: boolean;
  confirmTokenVersion: number;
  currentProfilePictureId?: string;
  defaultProfilePicture?: string;
  emailTokenVersion: number;
  email?: string;
  facebookId?: string;
  galeries?: Galerie[];
  GalerieUser: GalerieUser;
  googleId?: string;
  id: string;
  password: string;
  profilePictures: ProfilePicture[];
  pseudonym?: string;
  resetPasswordTokenVersion: number;
  role: 'superAdmin' | 'admin' | 'user';
  socialMediaUserName: string;
  tickets: Ticket[];
  updatedEmailTokenVersion: number;
  userName: string;
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

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  // Hashed password.
  @Column({
    type: DataType.STRING,
  })
  password!: string;

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
    type: DataType.STRING,
  })
  role!: 'superAdmin' | 'admin' | 'user';

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
  galeries!: Galerie[];

  @BelongsToMany(() => Notification, () => NotificationUser)
  notificationsUser!: Notification[]

  @HasMany(() => BlackList, 'adminId')
  blackLists!: BlackList[];

  @HasMany(() => Frame)
  frames!: Frame[];

  @HasMany(() => Invitation)
  invitations!: Invitation[];

  @HasMany(() => Like)
  likes!: Like[];

  @HasMany(() => Notification)
  notifications!: Notification[];

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @HasOne(() => BlackList, 'userId')
  blackList!: BlackList;

  // Need it to properly include
  // GalerieUser model when fetching galerie.
  GalerieUser!: GalerieUser;
}
