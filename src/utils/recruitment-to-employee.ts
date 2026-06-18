import { Employee } from '@/models';

// 根据岗位推导部门
export const getDepartmentByPosition = (position?: string) => {
  switch (position) {
    case '销售主管':
    case '销售':
      return '销售部';
    case '人事主管':
      return '人事部';
    case '运营主管':
    case '运营':
    case '客服':
    case '美工':
      return '运营部';
    default:
      return '未分配';
  }
};

// 招聘转正时同步生成员工
export const syncEmployeeFromRecruitment = async (record: {
  candidateName: string;
  city?: '宜昌' | '武汉';
  gender: 'male' | 'female';
  phone?: string | null;
  idCard?: string | null;
  arrivalDate?: Date | string | null;
  appliedPosition?: string;
  department?: string;
}) => {
  if (!record.arrivalDate) {
    throw new Error('招聘状态改为已转正前，必须先填写到岗日期');
  }

  if (!record.idCard) {
    throw new Error('招聘状态改为已转正前，必须先填写身份证号');
  }

  if (!record.phone) {
    throw new Error('招聘状态改为已转正前，必须先填写电话号码');
  }

  const existingEmployee = await Employee.findOne({
    $or: [
      { phone: record.phone },
      { idCard: record.idCard }
    ]
  });

  if (existingEmployee) {
    return {
      created: false,
      employee: existingEmployee
    };
  }

  const employee = new Employee({
    regularDate: new Date(record.arrivalDate),
    name: record.candidateName,
    city: record.city || '宜昌',
    gender: record.gender,
    phone: record.phone,
    idCard: record.idCard,
    workStatus: 'active',
    department: record.department || getDepartmentByPosition(record.appliedPosition),
    position: record.appliedPosition || '未分配',
    totalScore: 0
  });

  await employee.save();

  return {
    created: true,
    employee
  };
};
