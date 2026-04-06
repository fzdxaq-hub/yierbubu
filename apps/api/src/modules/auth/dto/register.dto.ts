import { IsString, MinLength } from 'class-validator'

export class RegisterDto {
  @IsString()
  @MinLength(3)
  account!: string

  @IsString()
  @MinLength(2)
  displayName!: string

  @IsString()
  @MinLength(6)
  password!: string
}
