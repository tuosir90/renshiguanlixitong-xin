import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import connectDB from '@/lib/mongodb';
import { RecruitmentRecord } from '@/models';
import { RECRUITMENT_STATUS_VALUES } from '@/constants';
import {
  calculateTrialDays,
  getCompatibleRecruitmentStatuses,
  getRecruitmentRecordListSort,
  normalizeRecruitmentRecord,
  requiresArrivalDate,
} from '@/utils/recruitment';
import { syncEmployeeFromRecruitment } from '@/utils/recruitment-to-employee';
import { getZodIssueDetails, isMongoDuplicateKeyError } from '@/utils/api-errors';

// 招聘记录验证模式
const recruitmentRecordSchema = z.object({
  interviewDate: z.string().transform((str) => new Date(str)),
  candidateName: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  city: z.enum(['宜昌', '武汉'], { message: '请选择城市' }).default('宜昌'),
  gender: z.enum(['male', 'female'], { message: '性别只能是男或女' }),
  age: z.number().int('年龄必须是整数').min(16, '年龄不能小于16岁').max(70, '年龄不能大于70岁'),
  idCard: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(val);
  }, '请输入有效的身份证号'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^1[3-9]\d{9}$/.test(val.trim());
  }, '请输入有效的手机号码'),
  appliedPosition: z.enum([
    '销售主管', '人事主管', '运营主管',
    '销售', '运营', '助理', '客服', '美工', '未分配'
  ]).default('未分配'),
  department: z.enum([
    '销售部', '运营部', '人事部', '未分配'
  ]).default('未分配'),
  arrivalDate: z.string().transform((str) => str ? new Date(str) : undefined).optional(),
  resignationReason: z.string().max(500, '备注内容最多500字').optional(),
  recruitmentStatus: z.enum(RECRUITMENT_STATUS_VALUES).default('pending_arrival'),
});

// GET - 获取招聘记录列表
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const city = searchParams.get('city');
    const keyword = searchParams.get('keyword');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const query: Record<string, unknown> = {};

    if (status && status !== 'all') {
      query.recruitmentStatus = {
        $in: getCompatibleRecruitmentStatuses(status)
      };
    }

    if (city === '宜昌' || city === '武汉') {
      query.city = city;
    }

    if (keyword) {
      query.$or = [
        { candidateName: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
        { idCard: { $regex: keyword, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      query.interviewDate = {};
      if (startDate) (query.interviewDate as Record<string, Date>).$gte = new Date(startDate);
      if (endDate) (query.interviewDate as Record<string, Date>).$lte = new Date(endDate);
    }

    const skip = (page - 1) * limit;
    const [rawRecords, total] = await Promise.all([
      RecruitmentRecord.find(query)
        .sort(getRecruitmentRecordListSort())
        .skip(skip)
        .limit(limit)
        .lean(),
      RecruitmentRecord.countDocuments(query)
    ]);

    const records = rawRecords.map((record) => normalizeRecruitmentRecord(record));

    return NextResponse.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取招聘记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取招聘记录失败' },
      { status: 500 }
    );
  }
}

// POST - 创建新的招聘记录
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const validatedData = recruitmentRecordSchema.parse(body);

    const normalizedIdCard = validatedData.idCard?.trim()
      ? validatedData.idCard
      : undefined;
    const normalizedPhone = validatedData.phone?.trim()
      ? validatedData.phone.trim()
      : undefined;

    if (requiresArrivalDate(validatedData.recruitmentStatus) && !validatedData.arrivalDate) {
      return NextResponse.json(
        { success: false, error: '当前招聘状态必须填写到岗日期' },
        { status: 400 }
      );
    }

    if (normalizedIdCard) {
      const existingIdCardRecord = await RecruitmentRecord.findOne({
        idCard: normalizedIdCard
      });

      if (existingIdCardRecord) {
        return NextResponse.json(
          { success: false, error: '该身份证号已存在招聘记录' },
          { status: 400 }
        );
      }
    }

    const existingPhoneRecord = normalizedPhone
      ? await RecruitmentRecord.findOne({ phone: normalizedPhone })
      : null;

    if (existingPhoneRecord) {
      return NextResponse.json(
        { success: false, error: `手机号 ${normalizedPhone} 已存在招聘记录，应聘者：${existingPhoneRecord.candidateName}` },
        { status: 400 }
      );
    }

    const regularizedDate = validatedData.recruitmentStatus === 'regularized'
      ? new Date()
      : undefined;
    const trialDays = calculateTrialDays(
      validatedData.arrivalDate,
      validatedData.recruitmentStatus,
      regularizedDate
    );

    if (validatedData.recruitmentStatus === 'regularized') {
      await syncEmployeeFromRecruitment({
        candidateName: validatedData.candidateName,
        city: validatedData.city,
        gender: validatedData.gender,
        phone: normalizedPhone,
        idCard: normalizedIdCard,
        arrivalDate: validatedData.arrivalDate,
        appliedPosition: validatedData.appliedPosition,
        department: validatedData.department
      });
    }

    const newRecord = new RecruitmentRecord({
      ...validatedData,
      idCard: normalizedIdCard,
      phone: normalizedPhone,
      regularizedDate,
      trialDays
    });
    await newRecord.save();

    return NextResponse.json({
      success: true,
      data: normalizeRecruitmentRecord(newRecord.toObject()),
      message: '招聘记录创建成功'
    }, { status: 201 });
  } catch (error) {
    console.error('创建招聘记录失败:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: '数据验证失败',
          details: getZodIssueDetails(error)
        },
        { status: 400 }
      );
    }

    if (isMongoDuplicateKeyError(error)) {
      const mongoError = error;
      if (mongoError.keyPattern?.idCard) {
        return NextResponse.json(
          { success: false, error: '身份证号已存在' },
          { status: 400 }
        );
      }
      if (mongoError.keyPattern?.phone) {
        return NextResponse.json(
          { success: false, error: '手机号已存在' },
          { status: 400 }
        );
      }
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '创建招聘记录失败' },
      { status: 500 }
    );
  }
}
