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
  cropedImageId: string;
  current: boolean;
  frameId: string;
  id: string;
  index: number;
  originalImageId: string;
  pendingHexes: string;
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

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
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

  @Column({
    type: DataType.STRING,
  })
  pendingHexes!: string;

  @ForeignKey(() => Image)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  originalImageId!: string;

  @BelongsTo(() => Image, {
    foreignKey: 'cropedImageId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  cropedImage!: Image;

  @BelongsTo(() => Image, {
    foreignKey: 'originalImageId',
    hooks: true,
    onDelete: 'CASCADE',
  })
  originalImage!: Image;

  @BelongsTo(() => Frame)
  frame!: Frame;
}
