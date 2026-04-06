import { IsString, MinLength } from 'class-validator'

export class OrderIdParamDto {
  @IsString()
  @MinLength(1)
  id!: string
}
