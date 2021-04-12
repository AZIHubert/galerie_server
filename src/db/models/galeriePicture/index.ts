import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Image from '../image';
import Frame from '../frame';

interface GaleriePictureI {
  coverPicture: boolean;
  cropedImageId?: string;
  id: string;
  index: number;
  originalImageId?: string;
  pendingImageId?: string;
  frameId: string;
}

@Table({
  tableName: 'galeriePicture',
})
export default class GaleriePicture extends Model implements GaleriePictureI {
  @Column({
    type: DataType.BOOLEAN,
  })
  coverPicture!: boolean;

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

  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  index!: number;

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

  @ForeignKey(() => Frame)
  @Column({
    allowNull: false,
    type: DataType.BIGINT,
  })
  frameId!: string;

  @BelongsTo(() => Image, 'cropedImageId')
  cropedImage!: Image;

  @BelongsTo(() => Image, 'originalImageId')
  originalImage!: Image;

  @BelongsTo(() => Image, 'pendingImageId')
  pendingImage!: Image;

  @BelongsTo(() => Frame)
  frame!: Frame;
}
