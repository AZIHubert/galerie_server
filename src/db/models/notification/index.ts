import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import notificationType from '@src/helpers/notificationTypes';

import Frame from '../frame';
import Galerie from '../galerie';
import User from '../user';

interface NotificationI {
  frameId?: string;
  galerieId?: string;
  id: string;
  num?: number;
  role?: string;
  type: typeof notificationType[number];
  userId: string;
}

@Table({
  tableName: 'notification',
})
export default class Notification extends Model implements NotificationI {
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

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
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
}
