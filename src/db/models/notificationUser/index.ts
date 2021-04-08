import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Notification from '../notification';
import User from '../user';

interface NotificationUserI {
  notificationId?: string;
  userId?: string;
}

@Table({
  tableName: 'notificationUser',
})
export default class NotificationUser extends Model implements NotificationUserI {
  @ForeignKey(() => Notification)
  @Column({
    type: DataType.BIGINT,
  })
  notificationId!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;
}
