import { Transform } from 'class-transformer'
import { ArrayMinSize, IsArray, IsBoolean, IsString } from 'class-validator'

const normalizeBoolean = (value: unknown) => {
  if (value === 'true' || value === '1' || value === 'onShelf') {
    return true
  }

  if (value === 'false' || value === '0' || value === 'offShelf') {
    return false
  }

  return value
}

export class BatchUpdateProductStatusDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  ids!: string[]

  @Transform(({ value }) => normalizeBoolean(value))
  @IsBoolean()
  isOnline!: boolean
}
