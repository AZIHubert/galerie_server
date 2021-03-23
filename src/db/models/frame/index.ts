import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  HasMany,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import GaleriePicture from '../galeriePicture';
import User from '../user';
import Like from '../like';

interface FrameI {
  galerieId?: string;
  userId?: string;
}

@Table({
  tableName: 'frame',
})
export default class Frame extends Model implements FrameI {
  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.BIGINT,
  })
  galerieId!: string;

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
