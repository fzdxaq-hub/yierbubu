import { IsOptional, IsString, MinLength } from 'class-validator'

export class ListProductsQueryDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  shopId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string
}
