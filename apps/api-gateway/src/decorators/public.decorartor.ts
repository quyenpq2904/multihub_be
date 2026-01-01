import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC } from '@multihub/shared-common';

export const Public = () => SetMetadata(IS_PUBLIC, true);
