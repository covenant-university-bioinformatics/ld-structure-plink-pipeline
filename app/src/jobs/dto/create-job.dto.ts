import {
  IsNumberString,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsBooleanString,
} from 'class-validator';
import {
  Populations,
  LDAnalysisOptions,
  YesNoOptions,
} from '../models/ld_plink.model';

export class CreateJobDto {
  @IsString()
  @MinLength(5)
  @MaxLength(20)
  job_name: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsBooleanString()
  useTest: string;

  @IsNumberString()
  @IsOptional()
  marker_name: string;

  @IsNumberString()
  @IsOptional()
  p_value: string;

  @IsNotEmpty()
  @IsEnum(Populations)
  population: Populations;

  @IsNotEmpty()
  @IsEnum(LDAnalysisOptions)
  ld_analysis: LDAnalysisOptions;

  @IsString()
  @IsOptional()
  pairwise_snp1: string;

  @IsString()
  @IsOptional()
  pairwise_snp2: string;

  @IsString()
  @IsOptional()
  allLDValues_snp1: string;

  @IsString()
  @IsOptional()
  allLDValues_ld_window_kb: string;

  @IsString()
  @IsOptional()
  allLDValues_ld_window: string;

  @IsString()
  @IsOptional()
  allLDValues_ld_window_r2: string;

  @IsNumberString()
  @IsOptional()
  clumping_clump_p1: string;

  @IsNumberString()
  @IsOptional()
  clumping_clump_p2: string;

  @IsNumberString()
  @IsOptional()
  clumping_clump_r2: string;

  @IsNumberString()
  @IsOptional()
  clumping_clump_kb: string;

  @IsOptional()
  @IsEnum(YesNoOptions)
  clumping_allow_overlap: YesNoOptions;

  @IsOptional()
  @IsEnum(YesNoOptions)
  clumping_use_gene_region_file: YesNoOptions;

  @IsString()
  @IsOptional()
  clumping_clump_range: string;

  @IsNumberString()
  @IsOptional()
  clumping_range_border: string;
}
