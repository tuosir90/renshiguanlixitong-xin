import {
  ARRIVAL_DATE_OPTIONAL_RECRUITMENT_STATUSES,
  RECRUITMENT_STATUS,
} from '@/constants';
import type { RecruitmentStatus } from '@/constants';

export const getRecruitmentRecordListSort = () => ({
  createdAt: -1,
  _id: -1,
} as const);

// 兼容旧状态值，统一映射到新流程状态
export const normalizeRecruitmentStatus = (status?: string): RecruitmentStatus => {
  switch (status) {
    case 'pending':
    case '待定':
      return RECRUITMENT_STATUS.PENDING_DECISION;
    case 'interviewing':
      return RECRUITMENT_STATUS.PENDING_ARRIVAL;
    case 'trial':
      return RECRUITMENT_STATUS.TRIALING;
    case 'hired':
      return RECRUITMENT_STATUS.REGULARIZED;
    case RECRUITMENT_STATUS.PENDING_DECISION:
    case RECRUITMENT_STATUS.PENDING_ARRIVAL:
    case RECRUITMENT_STATUS.NO_SHOW:
    case RECRUITMENT_STATUS.TRIALING:
    case RECRUITMENT_STATUS.REGULARIZED:
    case RECRUITMENT_STATUS.REJECTED:
      return status;
    default:
      return RECRUITMENT_STATUS.PENDING_ARRIVAL;
  }
};

// 筛选时同时兼容旧状态值
export const getCompatibleRecruitmentStatuses = (status?: string): string[] => {
  const normalizedStatus = normalizeRecruitmentStatus(status);
  switch (normalizedStatus) {
    case RECRUITMENT_STATUS.PENDING_DECISION:
      return [RECRUITMENT_STATUS.PENDING_DECISION, 'pending', '待定'];
    case RECRUITMENT_STATUS.PENDING_ARRIVAL:
      return [RECRUITMENT_STATUS.PENDING_ARRIVAL, 'interviewing'];
    case RECRUITMENT_STATUS.TRIALING:
      return [RECRUITMENT_STATUS.TRIALING, 'trial'];
    case RECRUITMENT_STATUS.REGULARIZED:
      return [RECRUITMENT_STATUS.REGULARIZED, 'hired'];
    default:
      return [normalizedStatus];
  }
};

// 待定、未到岗、已拒绝不要求到岗日期，其余流程状态需要到岗日期
export const requiresArrivalDate = (status?: string): boolean => {
  const normalizedStatus = normalizeRecruitmentStatus(status);
  const optionalStatuses: readonly RecruitmentStatus[] =
    ARRIVAL_DATE_OPTIONAL_RECRUITMENT_STATUSES;
  return !optionalStatuses.includes(normalizedStatus);
};

// 根据到岗日期自动计算试岗天数
export const calculateTrialDays = (
  arrivalDate?: Date | string | null,
  status?: string,
  regularizedDate?: Date | string | null,
  updatedAt?: Date | string | null
): number | undefined => {
  if (!arrivalDate) {
    return undefined;
  }

  const normalizedStatus = normalizeRecruitmentStatus(status);
  if (
    normalizedStatus !== RECRUITMENT_STATUS.TRIALING &&
    normalizedStatus !== RECRUITMENT_STATUS.REGULARIZED
  ) {
    return undefined;
  }

  const start = new Date(arrivalDate);
  const end = normalizedStatus === RECRUITMENT_STATUS.REGULARIZED
    ? new Date(regularizedDate || updatedAt || new Date())
    : new Date();

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
    return undefined;
  }

  const diffDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays + 1;
};

// 兼容旧字段，优先读取新到岗日期
export const getArrivalDate = (record: {
  arrivalDate?: Date | string | null;
  trialDate?: Date | string | null;
}) => {
  return record.arrivalDate || record.trialDate || undefined;
};

type RecruitmentNormalizationFields = {
  recruitmentStatus?: string;
  arrivalDate?: Date | string | null;
  trialDate?: Date | string | null;
  regularizedDate?: Date | string | null;
  updatedAt?: Date | string | null;
  trialDays?: number;
};

// 输出给前端前统一格式，兼容旧状态和旧字段
export const normalizeRecruitmentRecord = <T extends Record<string, unknown>>(record: T) => {
  const normalizedRecord = record as T & RecruitmentNormalizationFields;
  const recruitmentStatus = normalizeRecruitmentStatus(normalizedRecord.recruitmentStatus);
  const arrivalDate = getArrivalDate(normalizedRecord);
  const trialDays = calculateTrialDays(
    arrivalDate,
    recruitmentStatus,
    normalizedRecord.regularizedDate,
    normalizedRecord.updatedAt
  );

  return {
    ...record,
    recruitmentStatus,
    arrivalDate,
    trialDays,
  };
};
