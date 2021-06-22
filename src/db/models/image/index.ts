import {
  Column,
  DataType,
  HasOne,
  Model,
  Table,
} from 'sequelize-typescript';

import ProfilePicture from '../profilePicture';

interface ImageI {
  bucketName: string;
  fileName: string;
  format: string;
  height: number;
  id: string;
  size: number;
  width: number;
}

@Table({
  tableName: 'image',
})
export default class Image extends Model implements ImageI {
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  bucketName!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  fileName!: string;

  // jpg/jpeg/gif/png
  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  format!: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  height!: number;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  // Size of the image (bit)
  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  size!: number;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  width!: number;

  @HasOne(() => ProfilePicture)
  cropedProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture)
  originalProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture)
  pendingProfilePicture!: ProfilePicture;
}
