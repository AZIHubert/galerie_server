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

interface GalerieBlackListI {
  autoIncrementId: number;
  createdById: string | null;
  galerieId: string;
  id: string;
  userId: string;
}

@Table({
  tableName: 'galerieBlackList',
})
export default class GalerieBlackList extends Model implements GalerieBlackListI {
  // Required to order by created at without
  // having replicate Model.
  @Column({
    allowNull: false,
    autoIncrement: true,
    type: DataType.BIGINT,
  })
  autoIncrementId!: number;

  // Id of the user who post
  // the galerieBlackList.
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  createdById!: string;

  // Id of the galerie where the
  // galerieBlackList whas posted.
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

  // Id of the user who post
  // the galerieBlackList.
  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;

  @BelongsTo(() => User, 'createdById')
  createdBy!: User;

  @BelongsTo(() => Galerie)
  galerie!: Galerie;

  @BelongsTo(() => User, 'userId')
  user!: User;
}
