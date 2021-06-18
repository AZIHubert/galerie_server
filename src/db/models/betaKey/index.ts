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
  code: string;
  createdById?: string;
  usedAt?: Date;
  userId: string;
}

@Table({
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  code!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  createdById!: string;

  @Column({
    allowNull: false,
    type: DataType.DATE,
  })
  usedAt!: Date;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
