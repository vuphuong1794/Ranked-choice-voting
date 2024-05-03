import { IsInt, IsNotEmpty, IsString, Length, Max, Min } from 'class-validator';

export class CreatePollDto {
  @IsString()
  @Length(1, 100)
  @IsNotEmpty()
  topic: string;

  @IsInt()
  @Min(1)
  @Max(5)
  votesPerVoter: number;

  @IsString()
  @Length(1, 25)
  name: string;
}

export class JoinPollDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  pollID: string;

  @IsString()
  @IsNotEmpty()
  @Length(1, 25)
  name: string;
}

export class NominationDto {
  @IsString()
  @Length(1, 100)
  text: string;
}
