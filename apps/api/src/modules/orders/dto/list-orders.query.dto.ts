import { orderStatusValues } from '@haodacai/shared'
import { IsIn, IsOptional, IsString } from 'class-validator'

const orderStatuses = Object.values(orderStatusValues)
const orderScopes = ['admin', 'user'] as const

export class ListOrdersQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(orderStatuses)
  status?: (typeof orderStatuses)[number]

  @IsOptional()
  @IsString()
  @IsIn(orderScopes)
  scope?: (typeof orderScopes)[number]
}
