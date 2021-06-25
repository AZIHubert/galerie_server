import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import User from '../user';
import Notification from '../notification';

interface NotificationFrameLikedI {
  frameId?: string;
  notificationId?: string;
}

@Table({
  tableName: 'notificationBetaKeyUsed',
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
