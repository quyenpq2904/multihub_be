import { BaseEntity, CreateDateColumn, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { getOrder, Order } from '../decorators/order.decorator';

export abstract class AbstractEntity extends BaseEntity {
  @Order(9999)
  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  createdAt: Date;

  @Order(9999)
  @CreateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
    nullable: false,
  })
  updatedAt: Date;

  toDto<Dto>(dtoClass: new () => Dto): Dto {
    return plainToInstance(dtoClass, this);
  }

  static override useDataSource(dataSource: DataSource): void {
    BaseEntity.useDataSource.call(this, dataSource);
    const meta = dataSource.entityMetadatasMap.get(this);
    if (meta != null) {
      meta.columns = [...meta.columns].sort((x, y) => {
        const orderX = getOrder((x.target as any)?.prototype, x.propertyName);
        const orderY = getOrder((y.target as any)?.prototype, y.propertyName);
        return orderX - orderY;
      });
    }
  }
}
