import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
  Default,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import ProfilePicture from '../profilePicture';
import BlackList from '../blackList';

interface UserI {
  userName: string;
  email: string;
  blackListId: string;
  password: string;
  confirmed: boolean;
  googleId: string;
  galeries?: Galerie[];
  profilePictures?: ProfilePicture[];
  profilePictureId?: ProfilePicture;
  role: 'superAdmin' | 'admin' | 'user';
  defaultProfilePicture: string;
}

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'users',
})
export default class User extends Model implements UserI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  userName!: string;

  @Column({
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  @Column({
    type: DataType.STRING,
  })
  password!: string;

  @Column({
    type: DataType.STRING,
  })
  googleId!: string;

  @Column({
    type: DataType.STRING,
  })
  facebookId!: string;

  @Column({
    type: DataType.STRING,
  })
  defaultProfilePicture!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  confirmed!: boolean;

  @Default('user')
  @Column({
    type: DataType.STRING,
  })
  role!: 'superAdmin' | 'admin' | 'user';

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  authTokenVersion!: number;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  confirmTokenVersion!: number;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  emailTokenVersion!: number;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  updatedEmailTokenVersion!: number;

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  resetPasswordTokenVersion!: number;

  @ForeignKey(() => ProfilePicture)
  @Column({
    type: DataType.BIGINT,
  })
  currentProfilePictureId!: string;

  @BelongsTo(() => ProfilePicture)
  currentProfilePicture!: ProfilePicture

  @HasMany(() => Galerie)
  galeries!: Galerie[];

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];

  @ForeignKey(() => BlackList)
  @Column({
    type: DataType.BIGINT,
  })
  blackListId!: string;

  @BelongsTo(() => BlackList)
  blackList!: BlackList;
}
