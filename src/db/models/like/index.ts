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
  userId: string;
}

@Table({
  tableName: 'like',
})
export default class Like extends Model implements LikeI {
  @ForeignKey(() => Frame)
  @Column({
    type: DataType.INTEGER,
  })
  frameId!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.INTEGER,
  })
  userId!: string;

  @BelongsTo(() => Frame)
  frame!: Frame;

  @BelongsTo(() => User)
  user!: User;
}
