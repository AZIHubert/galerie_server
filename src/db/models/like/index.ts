import {
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Frame from '../frame';
import User from '../user';

interface LikeI {
  frameId: string;
  id: string;
  userId: string;
}

@Table({
  tableName: 'like',
})
export default class Like extends Model implements LikeI {
  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  frameId!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

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
