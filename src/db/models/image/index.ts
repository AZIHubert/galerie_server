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
  size: number;
  width: number;
  signedUrl?: string;
}

@Table({
  defaultScope: {
    attributes: { exclude: ['deletedAt'] },
  },
  paranoid: true,
  tableName: 'image',
})
export default class Image extends Model implements ImageI {
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
  bucketName!: string;

  @Column({
    allowNull: false,
    type: DataType.STRING,
  })
  fileName!: string;

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
    type: DataType.INTEGER,
  })
  size!: number;

  @Column({
    type: DataType.STRING,
  })
  signedUrl!: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  width!: number;

  @HasOne(() => ProfilePicture)
  originalProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture)
  cropedProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture)
  pendingProfilePicture!: ProfilePicture;
}
