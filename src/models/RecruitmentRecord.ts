import mongoose, { Schema, Document } from 'mongoose';
import { RecruitmentRecord as IRecruitmentRecord } from '@/types';
import { RECRUITMENT_STATUS_VALUES } from '@/constants';
import { calculateTrialDays, normalizeRecruitmentStatus } from '@/utils/recruitment';

// 扩展Document接口
export interface RecruitmentRecordDocument extends IRecruitmentRecord, Document {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
}

// 定义Schema
const RecruitmentRecordSchema = new Schema<RecruitmentRecordDocument>(
  {
    interviewDate: {
      type: Date,
      required: [true, '面试日期不能为空'],
      validate: {
        validator: function(value: Date) {
          return value <= new Date();
        },
        message: '面试日期不能晚于当前日期'
      }
    },
    candidateName: {
      type: String,
      required: [true, '应聘姓名不能为空'],
      trim: true,
      minlength: [2, '姓名至少2个字符'],
      maxlength: [20, '姓名最多20个字符'],
      validate: {
        validator: function(value: string) {
          return /^[\u4e00-\u9fa5]{2,20}$/.test(value);
        },
        message: '请输入有效的中文姓名'
      }
    },
    recruitmentChannel: {
      type: String,
      trim: true,
      default: ''
    },
    city: {
      type: String,
      trim: true,
      enum: {
        values: ['宜昌', '武汉'],
        message: '请选择有效的城市'
      },
      default: '宜昌'
    },
    gender: {
      type: String,
      required: [true, '性别不能为空'],
      enum: {
        values: ['male', 'female'],
        message: '性别只能是男或女'
      }
    },
    age: {
      type: Number,
      required: false, // 暂时设为可选，兼容现有数据
      min: [16, '年龄不能小于16岁'],
      max: [70, '年龄不能大于70岁'],
      validate: {
        validator: function(value: number) {
          if (value === undefined || value === null) return true; // 允许空值
          return Number.isInteger(value);
        },
        message: '年龄必须是整数'
      }
    },
    idCard: {
      type: String,
      required: false,
      validate: {
        validator: function(value: string) {
          if (!value) return true; // 空值时跳过验证
          return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(value);
        },
        message: '请输入有效的身份证号'
      }
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      validate: {
        validator: function(value: string) {
          if (!value) return true;
          return /^1[3-9]\d{9}$/.test(value);
        },
        message: '请输入有效的手机号码'
      }
    },
    appliedPosition: {
      type: String,
      trim: true,
      enum: {
        values: [
          '销售主管', '人事主管', '运营主管',
          '销售', '运营', '助理', '客服', '美工', '未分配'
        ],
        message: '请选择有效的应聘岗位'
      },
      default: '未分配'
    },
    department: {
      type: String,
      trim: true,
      enum: {
        values: ['销售部', '运营部', '人事部', '未分配'],
        message: '请选择有效的部门'
      },
      default: '未分配'
    },
    arrivalDate: {
      type: Date,
      validate: {
        validator: function(this: RecruitmentRecordDocument, value: Date) {
          if (value && this.interviewDate) {
            return value >= this.interviewDate;
          }
          return true;
        },
        message: '到岗日期不能早于面试日期'
      }
    },
    regularizedDate: {
      type: Date,
      validate: {
        validator: function(this: RecruitmentRecordDocument, value: Date) {
          if (value && this.arrivalDate) {
            return value >= this.arrivalDate;
          }
          return true;
        },
        message: '转正日期不能早于到岗日期'
      }
    },
    trialDays: {
      type: Number,
      min: [1, '试岗天数至少1天'],
      max: [90, '试岗天数最多90天']
    },
    resignationReason: {
      type: String,
      maxlength: [500, '备注内容最多500字'],
      trim: true
    },
    recruitmentStatus: {
      type: String,
      required: [true, '招聘状态不能为空'],
      enum: {
        values: RECRUITMENT_STATUS_VALUES,
        message: '招聘状态只能是待定、可试岗待到岗、未到岗、试岗中、已转正或已拒绝'
      },
      default: 'pending_arrival'
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: {
      transform: function(doc, ret) {
        ret.id = ret._id;
        delete (ret as { _id?: string })._id;
        return ret;
      }
    }
  }
);

// 创建索引
RecruitmentRecordSchema.index({ candidateName: 1 });
RecruitmentRecordSchema.index({ city: 1 });
RecruitmentRecordSchema.index({ interviewDate: -1 });
RecruitmentRecordSchema.index({ recruitmentStatus: 1 });
RecruitmentRecordSchema.index({ age: 1 });
RecruitmentRecordSchema.index({ appliedPosition: 1 }); // 新增应聘岗位索引
RecruitmentRecordSchema.index({ department: 1 });
RecruitmentRecordSchema.index({ idCard: 1 }); // 普通索引，提升查询性能，不强制唯一性

// 中间件：自动维护试岗流程字段
RecruitmentRecordSchema.pre('save', function(next) {
  const normalizedStatus = normalizeRecruitmentStatus(this.recruitmentStatus);
  this.recruitmentStatus = normalizedStatus;

  if (normalizedStatus === 'regularized' && !this.regularizedDate) {
    this.regularizedDate = new Date();
  }

  if (normalizedStatus !== 'regularized') {
    this.regularizedDate = undefined;
  }

  const calculatedDays = calculateTrialDays(
    this.arrivalDate,
    normalizedStatus,
    this.regularizedDate,
    this.updatedAt
  );
  if (calculatedDays) {
    this.trialDays = calculatedDays;
  }
  next();
});

// 静态方法：获取统计数据
RecruitmentRecordSchema.statics.getStatistics = async function() {
  const totalCount = await this.countDocuments();
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  
  const monthlyCount = await this.countDocuments({
    createdAt: { $gte: currentMonth }
  });
  
  const pendingArrivalCount = await this.countDocuments({ recruitmentStatus: 'pending_arrival' });
  const pendingDecisionCount = await this.countDocuments({ recruitmentStatus: 'pending_decision' });
  const noShowCount = await this.countDocuments({ recruitmentStatus: 'no_show' });
  const trialingCount = await this.countDocuments({ recruitmentStatus: 'trialing' });
  const regularizedCount = await this.countDocuments({ recruitmentStatus: 'regularized' });
  const rejectedCount = await this.countDocuments({ recruitmentStatus: 'rejected' });
  
  return {
    totalCount,
    monthlyCount,
    pendingDecisionCount,
    pendingArrivalCount,
    noShowCount,
    trialingCount,
    regularizedCount,
    rejectedCount
  };
};

// 防止重复编译
const RecruitmentRecord = mongoose.models.RecruitmentRecord || 
  mongoose.model<RecruitmentRecordDocument>('RecruitmentRecord', RecruitmentRecordSchema);

export default RecruitmentRecord;
