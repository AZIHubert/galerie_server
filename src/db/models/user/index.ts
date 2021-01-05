import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
  Default,
} from 'sequelize-typescript';

import Galerie from '../galerie';

interface UserI {
  userName: string;
  email: string;
  password: string;
  galeries?: Galerie[];
  confirmed: boolean;
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

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  tokenVersion!: number;

  @HasMany(() => Galerie)
  galeries!: Galerie[];
}
