import { SandboxedJob } from 'bullmq';
import * as fs from 'fs';
import {
  JobStatus,
  LDPlinkJobsModel,
} from '../jobs/models/ld_plink.jobs.model';
import {
  LDAnalysisOptions,
  LDPlinkDoc,
  LDPlinkModel,
} from '../jobs/models/ld_plink.model';
import appConfig from '../config/app.config';
import { spawnSync } from 'child_process';
import connectDB, { closeDB } from '../mongoose';

import {
  deleteFileorFolder,
  fileOrPathExists,
  writeLDFile,
} from '@cubrepgwas/pgwascommon';

function sleep(ms) {
  console.log('sleeping');
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJobParameters(
  ld_analysis: LDAnalysisOptions,
  parameters: LDPlinkDoc,
) {
  switch (ld_analysis) {
    case LDAnalysisOptions.PAIRWISE:
      return [
        String(parameters.population),
        String(parameters.ld_analysis),
        String(parameters.pairwise_snp1),
        String(parameters.pairwise_snp2),
      ];
    case LDAnalysisOptions.ALLLDVALUES:
      return [
        String(parameters.population),
        String(parameters.ld_analysis),
        String(parameters.allLDValues_snp1),
        String(parameters.allLDValues_ld_window_kb),
        String(parameters.allLDValues_ld_window),
        String(parameters.allLDValues_ld_window_r2),
      ];
    case LDAnalysisOptions.CLUMPING:
      return [
        String(parameters.population),
        String(parameters.ld_analysis),
        String(parameters.clumping_clump_p1),
        String(parameters.clumping_clump_p2),
        String(parameters.clumping_clump_r2),
        String(parameters.clumping_clump_kb),
        String(parameters.clumping_allow_overlap),
        String(parameters.clumping_use_gene_region_file),
        String(parameters.clumping_clump_range),
        String(parameters.clumping_range_border),
      ];
  }
  return [String(parameters.population)];
}

export default async (job: SandboxedJob) => {
  //executed for each job
  console.log(
    'Worker ' +
      ' processing job ' +
      JSON.stringify(job.data.jobId) +
      ' Job name: ' +
      JSON.stringify(job.data.jobName),
  );

  await connectDB();
  await sleep(2000);

  //fetch job parameters from database
  const parameters = await LDPlinkModel.findOne({
    job: job.data.jobId,
  }).exec();

  const jobParams = await LDPlinkJobsModel.findById(job.data.jobId).exec();

  let jobParameters;

  if (parameters.ld_analysis === LDAnalysisOptions.CLUMPING) {
    //create input file and folder
    let filename;

    //extract file name
    const name = jobParams.inputFile.split(/(\\|\/)/g).pop();

    filename = `/pv/analysis/${jobParams.jobUID}/input/${name}`;

    //write the exact columns needed by the analysis
    writeLDFile(jobParams.inputFile, filename, {
      marker_name: parameters.marker_name - 1,
      p: parameters.p_value - 1,
    });

    deleteFileorFolder(jobParams.inputFile).then(() => {
      console.log('deleted ', jobParams.inputFile);
    });

    await LDPlinkJobsModel.findByIdAndUpdate(job.data.jobId, {
      inputFile: filename,
    });

    //assemble job parameters
    jobParameters = getJobParameters(parameters.ld_analysis, parameters);
    jobParameters.splice(2, 0, filename);
  } else {
    jobParameters = getJobParameters(parameters.ld_analysis, parameters);
  }

  const pathToOutputDir = `/pv/analysis/${job.data.jobUID}/${appConfig.appName}/output`;
  jobParameters.unshift(pathToOutputDir);

  console.log(jobParameters);
  //make output directory
  fs.mkdirSync(pathToOutputDir, { recursive: true });

  // save in mongo database
  await LDPlinkJobsModel.findByIdAndUpdate(
    job.data.jobId,
    {
      status: JobStatus.RUNNING,
    },
    { new: true },
  );

  await sleep(3000);
  //spawn process
  const jobSpawn = spawnSync(
    // './pipeline_scripts/pascal.sh &>/dev/null',
    './pipeline_scripts/LD.sh',
    jobParameters,
    { maxBuffer: 1024 * 1024 * 1024 },
  );

  console.log('Spawn command log');
  console.log(jobSpawn?.stdout?.toString());
  console.log('=====================================');
  console.log('Spawn error log');
  const error_msg = jobSpawn?.stderr?.toString();
  console.log(error_msg);

  let answer: boolean;

  if (parameters.ld_analysis === LDAnalysisOptions.PAIRWISE) {
    answer = await fileOrPathExists(`${pathToOutputDir}/LD.out2`);
  } else if (parameters.ld_analysis === LDAnalysisOptions.ALLLDVALUES) {
    answer = await fileOrPathExists(`${pathToOutputDir}/LD.out2`);
  } else if (parameters.ld_analysis === LDAnalysisOptions.CLUMPING) {
    answer = await fileOrPathExists(`${pathToOutputDir}/LD.out2.clumped`);
  } else {
    answer = false;
  }

  //close database connection
  closeDB();

  console.log(answer);

  if (answer) {
    return true;
  } else {
    throw new Error(error_msg || 'Job failed to successfully complete');
  }

  return true;
};
