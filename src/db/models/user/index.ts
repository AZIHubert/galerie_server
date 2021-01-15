import {
  Column,
  DataType,
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
  password: string;
  confirmed: boolean;
  admin: boolean;
  galeries?: Galerie[];
  images?: Image[];
  profilePictures?: ProfilePicture[];
  profilePicture?: ProfilePicture;
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
  admin!: boolean;

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

  @HasMany(() => Galerie)
  galeries!: Galerie[];

  @HasMany(() => ProfilePicture)
  profilePictures!: ProfilePicture[];
}
