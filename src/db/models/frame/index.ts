import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import GaleriePicture from '../galeriePicture';
import Like from '../like';
import User from '../user';

interface FrameI {
  galerieId?: string;
  numOfLikes: number;
  userId?: string;
}

@Table({
  tableName: 'frame',
})
export default class Frame extends Model implements FrameI {
  // Id of the belonging galerie.
  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.BIGINT,
  })
  galerieId!: string;

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

  // Id of the user who post the frame.
  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;

  @BelongsToMany(() => User, () => Like)
  likes!: User[];

  @HasMany(() => GaleriePicture)
  galeriePictures!: GaleriePicture[]
}
