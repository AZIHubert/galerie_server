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
import Image from '../image';

interface GaleriePictureI {
  cropedImageId?: string;
  current: boolean;
  frameId: string;
  id: string;
  index: number;
  originalImageId?: string;
  pendingImageId?: string;
}

@Table({
  tableName: 'galeriePicture',
})
export default class GaleriePicture extends Model implements GaleriePictureI {
  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  cropedImageId!: string;

  // If true, this galeriePicture
  // is the cover picture of his belonging galerie.
  // Only one galeriePicture can have this
  // property to true.
  @Default(false)
  @Column({
    allowNull: false,
    type: DataType.BOOLEAN,
  })
  current!: boolean;

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

  // galeriePictures are display inside
  // a carousel. To maintain the correct
  // order desire, an index is require.
  @Default(0)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  index!: number;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  originalImageId!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  pendingImageId!: string;

  @BelongsTo(() => Image, 'cropedImageId')
  cropedImage!: Image;

  @BelongsTo(() => Image, 'originalImageId')
  originalImage!: Image;

  @BelongsTo(() => Image, 'pendingImageId')
  pendingImage!: Image;

  @BelongsTo(() => Frame)
  frame!: Frame;
}
