import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';

interface BlackListI {
  active: boolean;
  adminId?: string;
  id: string;
  reason: string;
  time?: Date;
  userId: string;
}

@Table({
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
  // Only the active black list
  // Is used to check if a user is blackListed.
  // Non active black lists are considered as expired.
  @Default(true)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  active!: boolean;

  // Id of the admin who created the black list.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  adminId!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
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
    type: DataType.DATE,
  })
  time!: Date;

  // Id of the baned user.
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User, 'adminId')
  admin!: User;

  @BelongsTo(() => User, 'updatedById')
  updatedBy!: User;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
