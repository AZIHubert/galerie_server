import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  Default,
} from 'sequelize-typescript';

import BlackList from '../blackList';
import Galerie from '../galerie';
import ProfilePicture from '../profilePicture';
import Ticket from '../ticket';
import GalerieUser from '../galerieUser';

interface UserI {
  authTokenVersion: number;
  blackListId?: string;
  confirmed: boolean;
  confirmTokenVersion: number;
  currentProfilePictureId?: string;
  defaultProfilePicture?: string;
  email?: string;
  emailTokenVersion: number;
  facebookId?: string;
  galeries?: Galerie[];
  googleId?: string;
  id: string;
  password: string;
  profilePictures: ProfilePicture[];
  pseudonym?: string;
  resetPasswordTokenVersion: number;
  role: 'superAdmin' | 'admin' | 'user';
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

  @ForeignKey(() => BlackList)
  @Column({
    type: DataType.BIGINT,
  })
  blackListId!: string;

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

  @ForeignKey(() => ProfilePicture)
  @Column({
    type: DataType.BIGINT,
  })
  currentProfilePictureId!: string;

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

  @BelongsToMany(() => Galerie, () => GalerieUser)
  galeries!: Galerie[];

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

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];

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

  @HasMany(() => Ticket)
  tickets!: Ticket[];

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  updatedEmailTokenVersion!: number;

  @Column({
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  userName!: string;

  @BelongsTo(() => BlackList)
  blackList!: BlackList;

  @BelongsTo(() => ProfilePicture)
  currentProfilePicture!: ProfilePicture
}
