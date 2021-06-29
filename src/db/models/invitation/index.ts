import {
  BelongsTo,
  Column,
  DataType,
  Default,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import User from '../user';

interface InvitationI {
  autoIncrementId: number;
  code: string;
  galerieId: string;
  id: string;
  numOfInvits: number | null;
  time: Date | null;
  userId: string;
}

@Table({
  tableName: 'invitation',
})
export default class Invitation extends Model implements InvitationI {
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  // A unique code to enter
  // to register to this galerie.
  @Column({
    allowNull: false,
    type: DataType.STRING,
    unique: true,
  })
  code!: string;

  // The galerie where this invitation is posted.
  @ForeignKey(() => Galerie)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  galerieId!: string;

  @Default(DataType.UUIDV4)
  @Column({
    allowNull: false,
    primaryKey: true,
    type: DataType.UUID,
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
  numOfInvits!: number | null;

  // How many time this invitation is avaible.
  // If null, this invitation is avaible
  // for ever.
  @Column({
    type: DataType.DATE,
  })
  time!: Date;

  // The user who created this invitation.
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User)
  user!: User;
}
