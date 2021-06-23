import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import notificationType from '@src/helpers/notificationTypes';

import Galerie from '../galerie';
import User from '../user';

interface NotificationI {
  galerieId?: string;
  id: string;
  num?: number;
  type: typeof notificationType[number];
  userId: string;
}

@Table({
  tableName: 'notification',
})
export default class Notification extends Model implements NotificationI {
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
}
