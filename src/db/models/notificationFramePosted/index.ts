import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import Notification from '../notification';

interface NotificationFramePostedI {
  frameId?: string;
  notificationId?: string;
}

@Table({
  tableName: 'notificationFramePosted',
})
export default class NotificationFramePosted extends Model implements NotificationFramePostedI {
  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  frameId!: string;

  @ForeignKey(() => Notification)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  notificationId!: string;
}
