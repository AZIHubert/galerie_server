import {
  Column,
  DataType,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '@src/db/models/galeries';

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'users',
})
export default class Chef extends Model {
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
  passwordd!: string;

  @HasMany(() => Galerie)
  galeries!: Galerie[];
}
