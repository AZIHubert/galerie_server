import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Notification from '../notification';
import User from '../user';

interface NotificationBetaKeyUsedI {
  notificationId: string;
  userId: string;
}

@Table({
  tableName: 'notificationBetaKeyUsed',
})
export default class NotificationBetaKeyUsed extends Model implements NotificationBetaKeyUsedI {
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
