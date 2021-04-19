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
  userId: string;
}

@Table({
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
  // Id of the admin who created the black list.
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

  // Reason why the user has been baned.
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  reason!: string;

  // How many time the user is baned.
  // If null, the ban is illimited.
  @Column({
    type: DataType.INTEGER,
  })
  time!: number;

  // Id of the baned user.
  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => User, 'adminId')
  admin!: User;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
