import {
  BelongsToMany,
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Default,
  HasOne,
} from 'sequelize-typescript';

import BlackList from '../blackList';
import Frame from '../frame';
import Galerie from '../galerie';
import GalerieUser from '../galerieUser';
import Invitation from '../invitation';
import Notification from '../notification';
import NotificationUser from '../notificationUser';
import ProfilePicture from '../profilePicture';
import Ticket from '../ticket';
import Like from '../like';

interface UserI {
  authTokenVersion: number;
  confirmed: boolean;
  confirmTokenVersion: number;
  currentProfilePictureId?: string;
  defaultProfilePicture?: string;
  email?: string;
  emailTokenVersion: number;
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
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  authTokenVersion!: number;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  confirmed!: boolean;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  confirmTokenVersion!: number;

  @Column({
    type: DataType.STRING,
  })
  defaultProfilePicture!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  @Default(0)
  @Column({
    allowNull: false,
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

  @Column({
    type: DataType.STRING,
  })
  password!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  pseudonym!: string;

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

  @Column({
    type: DataType.STRING,
  })
  socialMediaUserName!: string;

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

  @BelongsToMany(() => Frame, () => Like)
  likes!: Frame[];

  @HasMany(() => BlackList, 'adminId')
  blackLists!: BlackList[];

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];

  @HasMany(() => Notification)
  notifications!: Notification[]

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @HasMany(() => Frame)
  frames!: Frame[];

  @HasMany(() => Invitation)
  invitations!: Invitation[];

  @HasOne(() => BlackList, 'userId')
  blackList!: BlackList;

  GalerieUser!: GalerieUser;
}
