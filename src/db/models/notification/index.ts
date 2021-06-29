import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import notificationType from '@src/helpers/notification/type';

import Frame from '../frame';
import Galerie from '../galerie';
import NotificationBetaKeyUsed from '../notificationBetaKeyUsed';
import NotificationFrameLiked from '../notificationFrameLiked';
import NotificationFramePosted from '../notificationFramePosted';
import NotificationUserSubscribe from '../notificationUserSubscribe';
import User from '../user';

interface NotificationI {
  autoIncrementId: number;
  frameId: string | null;
  galerieId: string | null;
  id: string;
  num: number | null;
  role: string | null;
  seen: boolean;
  type: typeof notificationType[number];
  userId: string;
}

@Table({
  tableName: 'notification',
})
export default class Notification extends Model implements NotificationI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  @ForeignKey(() => Frame)
  @Column({
    type: DataType.UUID,
  })
  frameId!: string;

  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.UUID,
  })
  galerieId!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @Column({
    type: DataType.INTEGER,
  })
  num!: number;

  @Column({
    type: DataType.STRING,
  })
  role!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  seen!: boolean;

  @Column({
    allowNull: false,
    type: DataType.ENUM(...notificationType),
  })
  type!: typeof notificationType[number];

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Frame)
  frame!: Frame;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;

  @BelongsToMany(() => User, () => NotificationBetaKeyUsed)
  notificationsBetaKeyUsed!: Array<
  User &
  {NotificationBetaKeyUsed: NotificationBetaKeyUsed}
  >;

  @BelongsToMany(() => User, () => NotificationFrameLiked)
  notificationsFrameLiked!: Array<
  User &
  {NotificationFrameLiked: NotificationFrameLiked}
  >;

  @BelongsToMany(() => Frame, () => NotificationFramePosted)
  notificationsFramePosted!: Array<
  Frame &
  {NotificationFramePosted: NotificationFramePosted}
  >;

  @BelongsToMany(() => User, () => NotificationUserSubscribe)
  usersSubscribe!: Array<
  User &
  {NotificationUserSubscribe: NotificationUserSubscribe}
  >;
}
