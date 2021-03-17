import {
  BelongsToMany,
  Column,
  DataType,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';
import GalerieUser from '../galerieUser';

interface GalerieI {
  id: string;
  name: string;
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

  @BelongsToMany(() => User, () => GalerieUser)
  @Column({
    type: DataType.BIGINT,
  })
  users!: User[];
}
