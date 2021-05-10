import {
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
  // A unique code to enter
  // to register to this galerie.
  @Column({
    type: DataType.STRING,
  })
  code!: string;

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

  // How many users can use this invitation
  // to subscribe to this galerie (invitation.galerieId)
  // Every time a user subscribe to a galerie
  // using this invitation, numOfInvit decrement by 1.
  // If null, an inlimited amount of users
  // can use this invitation.
  @Column({
    type: DataType.INTEGER,
  })
  numOfInvit!: number | null;

  // The user who created this invitation.
  @ForeignKey(() => User)
  @Column({
    type: DataType.BIGINT,
  })
  userId!: string;

  // How many time this invitation is avaible.
  // If null, this invitation is avaible
  // for ever.
  @Column({
    type: DataType.INTEGER,
  })
  time!: number | null;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;
}
