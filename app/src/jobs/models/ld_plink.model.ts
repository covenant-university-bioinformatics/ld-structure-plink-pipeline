import * as mongoose from 'mongoose';

export enum Populations {
  AFR = 'afr',
  AMR = 'amr',
  EUR = 'eur',
  EAS = 'eas',
  SAS = 'sas',
}

export enum YesNoOptions {
  YES = 'Yes',
  NO = 'No',
}

export enum LDAnalysisOptions {
  PAIRWISE = 'pairwise',
  ALLLDVALUES = 'all_LD_values',
  CLUMPING = 'clumping',
}

//Interface that describe the properties that are required to create a new job
interface LDPlinkAttrs {
  job: string;
  useTest: string;
  marker_name?: string;
  p_value?: string;
  population: string;
  ld_analysis: string;
  pairwise_snp1?: string;
  pairwise_snp2?: string;
  allLDValues_snp1?: string;
  allLDValues_ld_window_kb?: string;
  allLDValues_ld_window?: string;
  allLDValues_ld_window_r2?: string;
  clumping_clump_p1?: string;
  clumping_clump_p2?: string;
  clumping_clump_r2?: string;
  clumping_clump_kb?: string;
  clumping_allow_overlap?: string;
  clumping_use_gene_region_file?: string;
  clumping_clump_range?: string;
  clumping_range_border?: string;
}

// An interface that describes the extra properties that a eqtl model has
//collection level methods
interface LDPlinkModel extends mongoose.Model<LDPlinkDoc> {
  build(attrs: LDPlinkAttrs): LDPlinkDoc;
}

//An interface that describes a properties that a document has
export interface LDPlinkDoc extends mongoose.Document {
  id: string;
  version: number;
  useTest: boolean;
  marker_name: number;
  p_value: number;
  population: string;
  ld_analysis: LDAnalysisOptions;
  pairwise_snp1: string;
  pairwise_snp2: string;
  allLDValues_snp1: string;
  allLDValues_ld_window_kb: number;
  allLDValues_ld_window: number;
  allLDValues_ld_window_r2: number;
  clumping_clump_p1: number;
  clumping_clump_p2: number;
  clumping_clump_r2: number;
  clumping_clump_kb: number;
  clumping_allow_overlap: string;
  clumping_use_gene_region_file: string;
  clumping_clump_range: string;
  clumping_range_border: number;
}

const LDPlinkSchema = new mongoose.Schema<LDPlinkDoc, LDPlinkModel>(
  {
    useTest: {
      type: Boolean,
      trim: true,
    },
    marker_name: {
      type: Number,
      trim: true,
    },
    p_value: {
      type: Number,
      trim: true,
    },
    population: {
      type: String,
      enum: [
        Populations.AFR,
        Populations.AMR,
        Populations.EUR,
        Populations.EAS,
        Populations.SAS,
      ],
      trim: true,
    },
    ld_analysis: {
      type: String,
      enum: [
        LDAnalysisOptions.PAIRWISE,
        LDAnalysisOptions.ALLLDVALUES,
        LDAnalysisOptions.CLUMPING,
      ],
      trim: true,
      default: LDAnalysisOptions.PAIRWISE,
    },
    pairwise_snp1: {
      type: String,
      trim: true,
    },
    pairwise_snp2: {
      type: String,
      trim: true,
    },
    allLDValues_snp1: {
      type: String,
      trim: true,
    },
    allLDValues_ld_window_kb: {
      type: Number,
      trim: true,
    },
    allLDValues_ld_window: {
      type: Number,
      trim: true,
    },
    allLDValues_ld_window_r2: {
      type: Number,
      trim: true,
    },
    // clumping_gwas_summary: {
    //   type: String,
    //   trim: true,
    // },
    clumping_clump_p1: {
      type: Number,
      trim: true,
    },
    clumping_clump_p2: {
      type: Number,
      trim: true,
    },
    clumping_clump_r2: {
      type: Number,
      trim: true,
    },
    clumping_clump_kb: {
      type: Number,
      trim: true,
    },
    clumping_allow_overlap: {
      type: String,
      enum: [YesNoOptions.YES, YesNoOptions.NO],
      trim: true,
      // default: YesNoOptions.NO,
    },
    clumping_use_gene_region_file: {
      type: String,
      enum: [YesNoOptions.YES, YesNoOptions.NO],
      trim: true,
      // default: YesNoOptions.NO,
    },
    clumping_clump_range: {
      type: String,
      trim: true,
    },
    clumping_range_border: {
      type: Number,
      trim: true,
    },
    job: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LDPlinkJob',
      required: true,
    },
    version: {
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: 'version',
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id;
        // delete ret._id;
        // delete ret.__v;
      },
    },
  },
);

//increments version when document updates
LDPlinkSchema.set('versionKey', 'version');

//collection level methods
LDPlinkSchema.statics.build = (attrs: LDPlinkAttrs) => {
  return new LDPlinkModel(attrs);
};

//create mongoose model
const LDPlinkModel = mongoose.model<LDPlinkDoc, LDPlinkModel>(
  'LDPlink',
  LDPlinkSchema,
  'ldplinks',
);

export { LDPlinkModel };
