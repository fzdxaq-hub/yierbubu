import { IsString, MinLength } from 'class-validator'

export class CartItemIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string
}
