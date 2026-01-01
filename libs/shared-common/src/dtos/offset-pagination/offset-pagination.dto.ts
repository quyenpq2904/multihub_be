import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { OffsetPageOptionsDto } from './page-options.dto';

export class OffsetPaginationDto {
  @ApiProperty()
  @Expose()
  readonly limit: number;

  @ApiProperty()
  @Expose()
  readonly currentPage: number;

  @ApiProperty()
  @Expose()
  readonly totalRecords: number;

  @ApiProperty()
  @Expose()
  readonly totalPages: number;

  constructor(totalRecords: number, pageOptions: OffsetPageOptionsDto) {
    this.limit = pageOptions.limit;
    this.currentPage = pageOptions.page;
    this.totalRecords = totalRecords;
    this.totalPages =
      this.limit > 0 ? Math.ceil(totalRecords / pageOptions.limit) : 0;
  }
}
