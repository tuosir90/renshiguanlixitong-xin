export const RECRUITMENT_STATUS = {
  PENDING_DECISION: 'pending_decision',
  PENDING_ARRIVAL: 'pending_arrival',
  NO_SHOW: 'no_show',
  TRIALING: 'trialing',
  REGULARIZED: 'regularized',
  REJECTED: 'rejected',
} as const;

export type RecruitmentStatus =
  (typeof RECRUITMENT_STATUS)[keyof typeof RECRUITMENT_STATUS];

export const RECRUITMENT_STATUS_VALUES = [
  RECRUITMENT_STATUS.PENDING_DECISION,
  RECRUITMENT_STATUS.PENDING_ARRIVAL,
  RECRUITMENT_STATUS.NO_SHOW,
  RECRUITMENT_STATUS.TRIALING,
  RECRUITMENT_STATUS.REGULARIZED,
  RECRUITMENT_STATUS.REJECTED,
] as const;

export const RECRUITMENT_STATUS_LABELS: Record<RecruitmentStatus, string> = {
  [RECRUITMENT_STATUS.PENDING_DECISION]: '待定',
  [RECRUITMENT_STATUS.PENDING_ARRIVAL]: '可试岗待到岗',
  [RECRUITMENT_STATUS.NO_SHOW]: '未到岗',
  [RECRUITMENT_STATUS.TRIALING]: '试岗中',
  [RECRUITMENT_STATUS.REGULARIZED]: '已转正',
  [RECRUITMENT_STATUS.REJECTED]: '已拒绝',
};

export const RECRUITMENT_STATUS_BADGE_CLASS_NAMES: Record<
  RecruitmentStatus,
  string
> = {
  [RECRUITMENT_STATUS.PENDING_DECISION]:
    'border-transparent bg-muted text-muted-foreground',
  [RECRUITMENT_STATUS.PENDING_ARRIVAL]:
    'border-transparent bg-foreground/10 text-foreground',
  [RECRUITMENT_STATUS.NO_SHOW]:
    'border-transparent bg-muted text-muted-foreground',
  [RECRUITMENT_STATUS.TRIALING]:
    'border-transparent bg-warning/15 text-warning',
  [RECRUITMENT_STATUS.REGULARIZED]:
    'border-transparent bg-success/15 text-success',
  [RECRUITMENT_STATUS.REJECTED]:
    'border-transparent bg-destructive/15 text-destructive',
};

export const ARRIVAL_DATE_OPTIONAL_RECRUITMENT_STATUSES = [
  RECRUITMENT_STATUS.PENDING_DECISION,
  RECRUITMENT_STATUS.NO_SHOW,
  RECRUITMENT_STATUS.REJECTED,
] as const satisfies readonly RecruitmentStatus[];
