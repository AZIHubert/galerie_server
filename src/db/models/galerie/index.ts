import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';
import GalerieUser from '../GalerieUser';

interface GalerieI {
  id: string;
  name: string;
  userId?: string;
  users: User[]
}

@Table({
  tableName: 'galeries',
})
export default class Galerie extends Model implements GalerieI {
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
  })
  name!: string;

  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  @ForeignKey(() => User)
  userId!: string;

  @BelongsToMany(() => User, () => GalerieUser)
  @Column({
    type: DataType.BIGINT,
  })
  users!: User[];

  @BelongsTo(() => User)
  user!: User;
}
