import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateJobDto } from '../dto/create-job.dto';
import { LDPlinkJobsModel, JobStatus } from '../models/ld_plink.jobs.model';
import { LDAnalysisOptions, LDPlinkModel } from '../models/ld_plink.model';
import { LdPlinkJobQueue } from '../../jobqueue/queue/ld_plink.queue';
import { UserDoc } from '../../auth/models/user.model';
import { GetJobsDto } from '../dto/getjobs.dto';
import {
  findAllJobs,
  removeManyUserJobs,
  removeUserJob,
  fileSizeMb,
  deleteFileorFolder,
} from '@cubrepgwas/pgwascommon';
import { validateInputs } from './service.util';

//production
// const testPath =
//   '/local/datasets/pgwas_test_files/eqtl/UKB_bv_height_SMR_0.05.txt';
//development
// const testPath = '/local/datasets/data/eqtl/UKB_small.txt';
// const testPath = '/local/datasets/data/eqtl/UKB_bv_height_SMR_0.05.txt';

@Injectable()
export class JobsLDPlinkService {
  constructor(
    @Inject(LdPlinkJobQueue)
    private jobQueue: LdPlinkJobQueue,
  ) {}

  async create(
    createJobDto: CreateJobDto,
    file: Express.Multer.File,
    user?: UserDoc,
  ) {
    const { jobUID } = await validateInputs(createJobDto, file, user);

    // console.log(createJobDto);
    console.log(jobUID);
    // console.log(file);
    const session = await LDPlinkJobsModel.startSession();
    const sessionTest = await LDPlinkModel.startSession();
    session.startTransaction();
    sessionTest.startTransaction();

    try {
      // console.log('DTO: ', createJobDto);
      const opts = { session };
      const optsTest = { session: sessionTest };

      // const filepath = createJobDto.useTest === 'true' ? testPath : file.path;
      //determine if it will be a long job
      // const fileSize = await fileSizeMb(filepath);

      let longJob = false;

      //save job parameters, folder path, filename in database
      let newJob;
      console.log(createJobDto.ld_analysis);
      if (user) {
        if (createJobDto.ld_analysis === LDAnalysisOptions.CLUMPING) {
          const fileSize = await fileSizeMb(file.path);
          longJob = fileSize > 1;
          longJob = false;
          newJob = await LDPlinkJobsModel.build({
            job_name: createJobDto.job_name,
            jobUID,
            inputFile: file.path,
            status: JobStatus.QUEUED,
            user: user.id,
            longJob,
          });
        } else {
          newJob = await LDPlinkJobsModel.build({
            job_name: createJobDto.job_name,
            jobUID,
            status: JobStatus.QUEUED,
            user: user.id,
            longJob,
          });
        }
      }

      if (createJobDto.email) {
        if (createJobDto.ld_analysis === LDAnalysisOptions.CLUMPING) {
          const fileSize = await fileSizeMb(file.path);
          // longJob = fileSize > 1;
          longJob = false;
          newJob = await LDPlinkJobsModel.build({
            job_name: createJobDto.job_name,
            jobUID,
            inputFile: file.path,
            status: JobStatus.QUEUED,
            email: createJobDto.email,
            longJob,
          });
        } else {
          newJob = await LDPlinkJobsModel.build({
            job_name: createJobDto.job_name,
            jobUID,
            status: JobStatus.QUEUED,
            email: createJobDto.email,
            longJob,
          });
        }
      }

      if (!newJob) {
        throw new BadRequestException(
          'Job cannot be null, check job parameters',
        );
      }

      //let the models be created per specific analysis
      const ldplink = await LDPlinkModel.build({
        ...createJobDto,
        job: newJob.id,
      });

      await ldplink.save(optsTest);
      await newJob.save(opts);

      //add job to queue
      if (user) {
        await this.jobQueue.addJob({
          jobId: newJob.id,
          jobName: newJob.job_name,
          jobUID: newJob.jobUID,
          username: user.username,
          email: user.email,
          noAuth: false,
        });
      }

      if (createJobDto.email) {
        await this.jobQueue.addJob({
          jobId: newJob.id,
          jobName: newJob.job_name,
          jobUID: newJob.jobUID,
          username: 'User',
          email: createJobDto.email,
          noAuth: true,
        });
      }

      await session.commitTransaction();
      await sessionTest.commitTransaction();
      return {
        success: true,
        jobId: newJob.id,
      };
    } catch (e) {
      if (e.code === 11000) {
        throw new ConflictException(e.message);
      }
      await session.abortTransaction();
      await sessionTest.abortTransaction();
      deleteFileorFolder(`/pv/analysis/${jobUID}`).then(() => {
        // console.log('deleted');
      });
      throw new BadRequestException(e.message);
    } finally {
      session.endSession();
      sessionTest.endSession();
    }
  }

  async findAll(getJobsDto: GetJobsDto, user: UserDoc) {
    return await findAllJobs(getJobsDto, user, LDPlinkJobsModel);
  }

  async getJobByID(id: string, user: UserDoc) {
    const job = await LDPlinkJobsModel.findById(id)
      .populate('ldplink_params')
      .populate('user')
      .exec();

    if (!job) {
      throw new NotFoundException();
    }

    if (job?.user?.username !== user.username) {
      throw new ForbiddenException(
        'Access not allowed. Please sign in with correct credentials',
      );
    }

    return job;
  }

  async getJobByIDNoAuth(id: string) {
    const job = await LDPlinkJobsModel.findById(id)
      .populate('ldplink_params')
      .populate('user')
      .exec();

    if (!job) {
      throw new NotFoundException();
    }

    if (job?.user?.username) {
      throw new ForbiddenException(
        'Access not allowed. Please sign in with correct credentials',
      );
    }

    return job;
  }

  async removeJob(id: string, user: UserDoc) {
    const job = await this.getJobByID(id, user);

    return await removeUserJob(id, job);
  }

  async removeJobNoAuth(id: string) {
    const job = await this.getJobByIDNoAuth(id);

    return await removeUserJob(id, job);
  }

  async deleteManyJobs(user: UserDoc) {
    return await removeManyUserJobs(user, LDPlinkJobsModel);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
