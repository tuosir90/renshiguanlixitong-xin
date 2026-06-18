import type { RecruitmentStatus } from '@/constants';

// 招聘记录类型定义
export interface RecruitmentRecord {
  _id?: string;
  interviewDate: Date;
  candidateName: string;
  recruitmentChannel?: string;
  city?: '宜昌' | '武汉';
  gender: 'male' | 'female';
  age: number;
  idCard?: string;
  phone?: string;
  appliedPosition?: string; // 新增：应聘岗位
  department?: string;
  arrivalDate?: Date;
  regularizedDate?: Date;
  trialDate?: Date; // 兼容旧数据
  hasTrial?: boolean; // 兼容旧数据
  trialDays?: number;
  trialStatus?: 'excellent' | 'good' | 'average' | 'poor'; // 兼容旧数据
  resignationReason?: string;
  recruitmentStatus: RecruitmentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

// 员工信息类型定义
export interface Employee {
  _id?: string;
  employeeId: string;
  regularDate: Date;
  name: string;
  city?: '宜昌' | '武汉';
  gender: 'male' | 'female';
  phone: string;
  idCard: string;
  workingDays: number;
  workStatus: 'active' | 'resigned' | 'leave';
  resignationDate?: Date;
  department?: string;
  position?: string;
  totalScore: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// 积分记录类型定义
export interface ScoreRecord {
  _id?: string;
  employeeId: string;
  recordDate: Date;
  behaviorType: string;
  scoreChange: number;
  reason: string;
  recordedBy: string;
  evidence?: string;
  createdAt?: Date;
}

// 年度评优类型定义
export interface AnnualAward {
  _id?: string;
  year: number;
  employeeId: string;
  finalScore: number;
  rank: number;
  awardLevel: 'special' | 'first' | 'second' | 'excellent';
  bonusAmount: number;
  createdAt?: Date;
}

// 积分行为类型定义
export interface ScoreBehavior {
  type: string;
  score: number;
  category: 'deduction' | 'addition';
  description: string;
}

// API响应类型定义
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页参数类型定义
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// 分页响应类型定义
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 筛选参数类型定义
export interface FilterParams {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  department?: string;
  position?: string;
  keyword?: string;
}
