import assert from 'node:assert/strict';
import { getRecruitmentRecordListSort } from '../src/utils/recruitment';

assert.deepEqual(
  getRecruitmentRecordListSort(),
  { createdAt: -1, _id: -1 },
  '招聘列表应按创建时间倒序排列，最新录入记录在最上面'
);

console.log('招聘列表创建时间排序测试通过');
