import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import GaleriePicture from '../galeriePicture';
import Like from '../like';
import Notification from '../notification';
import NotificationFramePosted from '../notificationFramePosted';
import User from '../user';

interface FrameI {
  autoIncrementId: number;
  description: string | null;
  galerieId: string;
  id: string;
  notificationHasBeenSend: boolean;
  numOfLikes: number;
  userId: string;
}

@Table({
  tableName: 'frame',
})
export default class Frame extends Model implements FrameI {
  // Required to order by created at without
  // having replicate Model.
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  // The description to the frame.
  @Column({
    type: DataType.STRING,
  })
  description!: string;

  // Id of the galerie where this frame
  // was posted.
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

  // If true, all user who are subscribe
  // to the galerie where the frame was posted
  // have receive a notification.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  notificationHasBeenSend!: boolean;

  // Each time someone like this frame,
  // increment by one.
  // Each time someone unlike this frame,
  // decrement by one.
  // numOfLikes prevent to fetch all users
  // who likes this frames to display the length
  // of all this users.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  numOfLikes!: number;

  // Id of the user who post this frame.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Galerie, {
    onDelete: 'CASCADE',
  })
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;

  @BelongsToMany(() => Notification, () => NotificationFramePosted)
  notificationsFramePosted!: Array<
  Notification &
  {NotificationFramePosted: NotificationFramePosted}
  >;

  @HasMany(() => GaleriePicture, {
    hooks: true,
    onDelete: 'CASCADE',
  })
  galeriePictures!: GaleriePicture[];

  @HasOne(() => Notification)
  notification!: Notification;

  @HasMany(() => Like)
  likes!: Like[];
}
