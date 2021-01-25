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
  cropedProfilePicture: ProfilePicture;
  fileName: string;
  format: string;
  height: number;
  id: string;
  originalProfilePicture: ProfilePicture;
  pendingProfilePicture: ProfilePicture;
  signedUrl?: string;
  size: number;
  width: number;
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
    type: DataType.STRING,
  })
  bucketName!: string;

  @HasOne(() => ProfilePicture)
  cropedProfilePicture!: ProfilePicture;

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
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  size!: number;

  @HasOne(() => ProfilePicture)
  originalProfilePicture!: ProfilePicture;

  @HasOne(() => ProfilePicture)
  pendingProfilePicture!: ProfilePicture;

  @Column({
    type: DataType.STRING,
  })
  signedUrl!: string;

  @Column({
    allowNull: false,
    type: DataType.INTEGER,
  })
  width!: number;
}
