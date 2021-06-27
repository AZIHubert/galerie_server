import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Notification from '../notification';
import User from '../user';

interface NotificationFrameLikedI {
  userId?: string;
  notificationId?: string;
}

@Table({
  tableName: 'notificationFrameLiked',
})
export default class NotificationFrameLiked extends Model implements NotificationFrameLikedI {
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
