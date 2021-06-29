import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Notification from '../notification';
import User from '../user';

interface NotificationUserSubscribeI {
  notificationId?: string;
  userId: string;
}

@Table({
  tableName: 'notificationUserSubscribe',
})
export default class NotificationUserSubscribe extends Model implements NotificationUserSubscribeI {
  @ForeignKey(() => Notification)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  notificationId!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
