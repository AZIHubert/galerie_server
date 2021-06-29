import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import User from '../user';

interface LikeI {
  autoIncrementId: number;
  frameId: string;
  id: string;
  notificationHasBeenSend: boolean;
  userId: string;
}

@Table({
  tableName: 'like',
})
export default class Like extends Model implements LikeI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  frameId!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  notificationHasBeenSend!: boolean;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Frame)
  frame!: Frame;

  @BelongsTo(() => User)
  user!: User;
}
