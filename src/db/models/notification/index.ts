import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import Galerie from '../galerie';
import NotificationUser from '../notificationUser';
import User from '../user';

interface NotificationI {
  frameId?: string;
  galerieId?: string;
  id: string;
  type: 'frame' | 'invitation';
  userId: string;
}

@Table({
  tableName: 'notification',
})
export default class Notification extends Model implements NotificationI {
  // Required only if type === 'frame'.
  @ForeignKey(() => Frame)
  @Column({
    type: DataType.BIGINT,
  })
  frameId!: string;

  @ForeignKey(() => Galerie)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  galerieId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  // If type === 'frame':
  // it means that a/many user(s) likes
  // a frame posted by the user.
  // ------------------------------
  // If type === 'invitation':
  // it mean that a/many users(s) has(ve) subscribe
  // to a galerie where the user is the creator/admin.
  @Column({
    type: DataType.STRING,
  })
  type!: 'frame' | 'invitation';

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => Frame)
  frame!: Frame;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;

  // can include multiple users.
  // Exemple:
  // 'user1/user2/user3 likes your frame'.
  @BelongsToMany(() => User, () => NotificationUser)
  users!: User[];
}
