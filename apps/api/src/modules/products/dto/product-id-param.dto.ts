import { IsString, MinLength } from 'class-validator'

export class ProductIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string
}
