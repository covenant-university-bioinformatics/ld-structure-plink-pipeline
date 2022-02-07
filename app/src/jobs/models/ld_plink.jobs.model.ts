import * as mongoose from 'mongoose';
import { UserDoc } from '../../auth/models/user.model';
import { LDPlinkDoc } from './ld_plink.model';

export enum JobStatus {
  COMPLETED = 'completed',
  RUNNING = 'running',
  FAILED = 'failed',
  ABORTED = 'aborted',
  NOTSTARTED = 'not-started',
  QUEUED = 'queued',
}

//Interface that describe the properties that are required to create a new job
interface JobsAttrs {
  jobUID: string;
  job_name: string;
  status: JobStatus;
  user?: string;
  email?: string;
  inputFile?: string;
  longJob: boolean;
}

// An interface that describes the extra properties that a model has
//collection level methods
interface JobsModel extends mongoose.Model<LDPlinkJobsDoc> {
  build(attrs: JobsAttrs): LDPlinkJobsDoc;
}

//An interface that describes a properties that a document has
export interface LDPlinkJobsDoc extends mongoose.Document {
  id: string;
  jobUID: string;
  job_name: string;
  inputFile: string;
  status: JobStatus;
  user?: UserDoc;
  email?: string;
  failed_reason: string;
  longJob: boolean;
  ldplink_params: LDPlinkDoc;
  LDPairwiseFile: string;
  LDAllFile: string;
  LDClumpFile: string;
  version: number;
  completionTime: Date;
}

const LDPlinkJobSchema = new mongoose.Schema<LDPlinkJobsDoc, JobsModel>(
  {
    jobUID: {
      type: String,
      required: [true, 'Please add a Job UID'],
      unique: true,
      trim: true,
    },

    job_name: {
      type: String,
      required: [true, 'Please add a name'],
    },

    inputFile: {
      type: String,
      // required: [true, 'Please add a input filename'],
      trim: true,
    },

    LDPairwiseFile: {
      type: String,
      trim: true,
    },
    LDAllFile: {
      type: String,
      trim: true,
    },
    LDClumpFile: {
      type: String,
      trim: true,
    },

    failed_reason: {
      type: String,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        JobStatus.COMPLETED,
        JobStatus.NOTSTARTED,
        JobStatus.RUNNING,
        JobStatus.FAILED,
        JobStatus.ABORTED,
        JobStatus.QUEUED,
      ],
      default: JobStatus.NOTSTARTED,
    },
    longJob: {
      type: Boolean,
      default: false,
    },
    completionTime: {
      type: Date,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      // required: true,
    },
    email: {
      type: String,
      trim: true,
    },
    version: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: 'version',
    toObject: { virtuals: true },
    toJSON: {
      virtuals: true,
      transform(doc, ret) {
        ret.id = ret._id;
        // delete ret._id;
        // delete ret.__v;
      },
    },
  },
);

//increments version when document updates
// jobsSchema.set("versionKey", "version");

//collection level methods
LDPlinkJobSchema.statics.build = (attrs: JobsAttrs) => {
  return new LDPlinkJobsModel(attrs);
};

//Cascade delete main job parameters when job is deleted
LDPlinkJobSchema.pre('remove', async function (next) {
  console.log('Job parameters being removed!');
  await this.model('LDPlink').deleteMany({
    job: this.id,
  });
  next();
});

//reverse populate jobs with main job parameters
LDPlinkJobSchema.virtual('ldplink_params', {
  ref: 'LDPlink',
  localField: '_id',
  foreignField: 'job',
  required: true,
  justOne: true,
});

LDPlinkJobSchema.set('versionKey', 'version');

//create mongoose model
const LDPlinkJobsModel = mongoose.model<LDPlinkJobsDoc, JobsModel>(
  'LDPlinkJob',
  LDPlinkJobSchema,
  'ldplinkjobs',
);

export { LDPlinkJobsModel };
