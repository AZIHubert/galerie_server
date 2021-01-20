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
import Image from '../image';
import ProfilePicture from '../profilePicture';

interface UserI {
  userName: string;
  email: string;
  blackListed: boolean;
  password: string;
  confirmed: boolean;
  galeries?: Galerie[];
  images?: Image[];
  profilePictures?: ProfilePicture[];
  profilePicture?: ProfilePicture;
  role: 'superAdmin' | 'admin' | 'user';
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
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  email!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  password!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  confirmed!: boolean;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  blackListed!: boolean;

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
}
