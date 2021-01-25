import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface BlackListI {
  adminId: string;
  id: string;
  reason: string;
  time?: number;
}

@Table({
  paranoid: true,
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  adminId!: string;

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
  reason!: string;

  @Column({
    type: DataType.INTEGER,
  })
  time!: number;

  @BelongsTo(() => User)
  admin!: User;
}
