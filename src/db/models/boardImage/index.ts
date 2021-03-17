import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Image from '../image';
import Galerie from '../galerie';

interface BoardImageI {
  cropedImageId?: string;
  id: string;
  originalImageId?: string;
  pendingImageId?: string;
  galerieId: string;
}

@Table({
  tableName: 'boardImage',
})
export default class boardImage extends Model implements BoardImageI {
  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  cropedImageId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  originalImageId!: string;

  @ForeignKey(() => Image)
  @Column({
    type: DataType.BIGINT,
  })
  pendingImageId!: string;

  @ForeignKey(() => Galerie)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  galerieId!: string;
}
