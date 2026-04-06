import { Transform, Type } from 'class-transformer'
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength
} from 'class-validator'

const normalizeBoolean = (value: unknown) => {
  if (value === 'true' || value === '1' || value === 'onShelf') {
    return true
  }

  if (value === 'false' || value === '0' || value === 'offShelf') {
    return false
  }

  return value
}

const normalizeTags = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(/[，,]/)
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  shopId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  categoryId?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string

  @IsOptional()
  @IsString()
  badge?: string

  @IsOptional()
  @IsString()
  cover?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  price?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sales?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stock?: number

  @IsOptional()
  @Transform(({ value }) => normalizeBoolean(value))
  @IsBoolean()
  isOnline?: boolean

  @IsOptional()
  @Transform(({ value }) => normalizeTags(value))
  @IsArray()
  @IsString({ each: true })
  tags?: string[]

  @IsOptional()
  @IsString()
  thumbTone?: string

  @IsOptional()
  @IsString()
  thumbAccent?: string
}
