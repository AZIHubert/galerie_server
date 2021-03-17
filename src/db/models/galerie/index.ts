import {
  BelongsTo,
  BelongsToMany,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import BoardImage from '../boardImage';
import GalerieUser from '../galerieUser';
import User from '../user';

interface GalerieI {
  coverPictureId?: string;
  id: string;
  name: string;
  users: User[];
}

@Table({
  tableName: 'galeries',
})
export default class Galerie extends Model implements GalerieI {
  @ForeignKey(() => BoardImage)
  @Column({
    type: DataType.BIGINT,
  })
  coverPictureId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  name!: string;

  @BelongsToMany(() => User, () => GalerieUser)
  @Column({
    type: DataType.BIGINT,
  })
  users!: User[];

  @BelongsTo(() => BoardImage)
  coverPicture!: BoardImage
}
