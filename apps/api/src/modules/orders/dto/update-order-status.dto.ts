import { orderStatusValues } from '@haodacai/shared'
import { IsIn, IsString } from 'class-validator'

const orderStatuses = Object.values(orderStatusValues)

export class UpdateOrderStatusDto {
  @IsString()
  @IsIn(orderStatuses)
  status!: (typeof orderStatuses)[number]
}
