import assert from 'node:assert/strict';
import RecruitmentRecord from '../src/models/RecruitmentRecord';
import { RECRUITMENT_STATUS_LABELS } from '../src/constants';
import {
  getCompatibleRecruitmentStatuses,
  normalizeRecruitmentStatus,
  requiresArrivalDate,
} from '../src/utils/recruitment';

assert.equal(
  normalizeRecruitmentStatus('pending_decision'),
  'pending_decision',
  '待定状态应保留为 pending_decision'
);

assert.equal(
  requiresArrivalDate('pending_decision'),
  false,
  '待定状态不应强制要求填写到岗日期'
);

assert.equal(
  getCompatibleRecruitmentStatuses('pending_decision').includes('pending_decision'),
  true,
  '待定状态筛选结果至少应命中自身'
);

assert.equal(
  (RECRUITMENT_STATUS_LABELS as Record<string, string>).pending_decision,
  '待定',
  '待定状态应提供中文标签'
);

const record = new RecruitmentRecord({
  interviewDate: new Date('2026-04-01'),
  candidateName: '李测试',
  city: '宜昌',
  gender: 'male',
  age: 25,
  phone: '13800138000',
  appliedPosition: '销售',
  department: '销售部',
  recruitmentStatus: 'pending_decision',
});

const validationError = record.validateSync();

assert.equal(
  validationError,
  undefined,
  '待定状态应通过招聘记录模型校验'
);

const recordWithoutPhone = new RecruitmentRecord({
  interviewDate: new Date('2026-04-01'),
  candidateName: '王测试',
  city: '宜昌',
  gender: 'female',
  age: 26,
  appliedPosition: '运营',
  department: '运营部',
  recruitmentStatus: 'pending_decision',
});

const noPhoneValidationError = recordWithoutPhone.validateSync();

assert.equal(
  noPhoneValidationError,
  undefined,
  '招聘记录不填写电话号码时应通过模型校验'
);

console.log('招聘状态待定回归测试通过');
