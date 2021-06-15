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
  adminId?: string;
  id: string;
  reason: string;
  time?: Date;
  updatedById?: string;
  userId: string;
}

@Table({
  tableName: 'blackList',
})
export default class BlackList extends Model implements BlackListI {
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

  // Id of the user who update this blackList
  // (set active to false manually).
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  // Id of the baned user.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  updatedById!: string;

  @BelongsTo(() => User, 'adminId')
  admin!: User;

  @BelongsTo(() => User, 'updatedById')
  updatedBy!: User;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
