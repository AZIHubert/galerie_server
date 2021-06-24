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
  galerieId?: string;
  hasNewFrames: boolean;
  notificationHasBeenSend: boolean;
  role?: string;
  userId?: string;
}

@Table({
  tableName: 'galerieUser',
})
export default class GalerieUser extends Model implements GalerieUserI {
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

  @Column({
    allowNull: false,
    defaultValue: false,
    type: DataType.BOOLEAN,
  })
  notificationHasBeenSend!: boolean;

  // Allow different action based on
  // the role of the user on this galerie.
  @Column({
    allowNull: false,
    type: DataType.ENUM('creator', 'admin', 'user'),
  })
  role!: 'creator' | 'admin' | 'user';

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
