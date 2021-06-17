import {
  Column,
  DataType,
  ForeignKey,
  Model,
  Table,
} from 'sequelize-typescript';

import Galerie from '../galerie';
import User from '../user';

interface GalerieBlackListI {
  adminId?: string;
  galerieId: string;
  id: string;
  userId: string;
}

@Table({
  tableName: 'galerieBlackList',
})
export default class GalerieBlackList extends Model implements GalerieBlackListI {
  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
  })
  adminId!: string;

  @ForeignKey(() => Galerie)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  galerieId!: string;

  @Column({
    allowNull: false,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
    type: DataType.UUID,
  })
  id!: string;

  @ForeignKey(() => User)
  @Column({
    allowNull: false,
    type: DataType.UUID,
  })
  userId!: string;
}
