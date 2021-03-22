import {
  AllowNull,
  BelongsTo,
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import User from '../user';

interface InvitationI {
  code: string;
  galerieId: string;
  id: string;
  numOfInvit: number | null;
  time: number | null;
  userId: string;
}

@Table({
  tableName: 'invitation',
})
export default class Invitation extends Model implements InvitationI {
  @ForeignKey(() => Galerie)
  @Column({
    type: DataType.BIGINT,
  })
  galerieId!: string;

  @Column({
    allowNull: false,
    autoIncrement: true,
    primaryKey: true,
    type: DataType.BIGINT,
  })
  id!: string;

  @AllowNull
  @Column({
    type: DataType.INTEGER,
  })
  numOfInvit!: number | null;

  @Column({
    type: DataType.STRING,
  })
  code!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  @AllowNull
  @Column({
    type: DataType.INTEGER,
  })
  time!: number | null;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;
}
