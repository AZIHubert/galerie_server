import {
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import User from '../user';

interface GalerieUserI {
  allowNotification: boolean;
  galerieId: string;
  hasNewFrames: boolean;
  notificationHasBeenSend: boolean;
  role: 'admin' | 'moderator' | 'user';
  userId: string;
}

@Table({
  tableName: 'galerieUser',
})
export default class GalerieUser extends Model implements GalerieUserI {
  @Default(true)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  allowNotification!: boolean;

  @ForeignKey(() => Galerie)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  galerieId!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  hasNewFrames!: boolean;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  notificationHasBeenSend!: boolean;

  // Allow different action based on
  // the role of the user on this galerie.
  @Column({
    allowNull: false,
    type: DataType.ENUM('admin', 'moderator', 'user'),
  })
  role!: 'admin' | 'moderator' | 'user';

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
