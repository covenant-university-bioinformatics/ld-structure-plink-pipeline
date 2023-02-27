import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UserDoc } from '../../auth/models/user.model';
import { CreateJobDto } from '../dto/create-job.dto';
import { fileOrPathExists } from '@cubrepgwas/pgwascommon';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { LDAnalysisOptions } from '../models/ld_plink.model';

export const validateInputs = async (
  createJobDto: CreateJobDto,
  file: Express.Multer.File,
  user?: UserDoc,
) => {
  if (createJobDto.ld_analysis === LDAnalysisOptions.CLUMPING) {
    if (!file) {
      throw new BadRequestException('Please upload a file');
    }

    // if (file.mimetype !== 'text/plain') {
    //   throw new BadRequestException('Please upload a text file');
    // }

    const numberColumns = ['marker_name', 'p_value'];

    let columns;
    try {
      //change number columns to integers
      columns = numberColumns.map((column) => {
        return parseInt(createJobDto[column], 10);
      });
    } catch (e) {
      console.log(e);
      throw new BadRequestException(e.message);
    }

    //check if there are wrong column numbers
    const wrongColumn = columns.some((value) => value < 1 || value > 15);

    if (wrongColumn) {
      throw new BadRequestException('Column numbers must be between 0 and 15');
    }
    //check if there are duplicate columns
    const duplicates = new Set(columns).size !== columns.length;

    if (duplicates) {
      throw new BadRequestException('Column numbers must not have duplicates');
    }
  }

  if (!user && !createJobDto.email) {
    throw new BadRequestException(
      'Job cannot be null, check job parameters, and try again',
    );
  }

  if (user && createJobDto.email) {
    throw new BadRequestException('User signed in, no need for email');
  }

  //create jobUID
  const jobUID = uuidv4();

  //create folder with job uid and create input folder in job uid folder
  const value = await fileOrPathExists(`/pv/analysis/${jobUID}`);

  if (!value) {
    fs.mkdirSync(`/pv/analysis/${jobUID}/input`, { recursive: true });
  } else {
    throw new InternalServerErrorException();
  }

  return { jobUID };
};
