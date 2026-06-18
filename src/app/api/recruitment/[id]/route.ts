import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import mongoose from 'mongoose';
import connectDB from '@/lib/mongodb';
import { RecruitmentRecord } from '@/models';
import { RECRUITMENT_STATUS_VALUES } from '@/constants';
import {
  calculateTrialDays,
  getArrivalDate,
  normalizeRecruitmentRecord,
  normalizeRecruitmentStatus,
  requiresArrivalDate,
} from '@/utils/recruitment';
import { syncEmployeeFromRecruitment } from '@/utils/recruitment-to-employee';
import { getZodIssueDetails, isMongoDuplicateKeyError } from '@/utils/api-errors';

// 招聘记录更新验证模式
const updateRecruitmentRecordSchema = z.object({
  interviewDate: z.string().transform((str) => new Date(str)).optional(),
  candidateName: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符').optional(),
  city: z.enum(['宜昌', '武汉'], { message: '请选择城市' }).optional(),
  gender: z.enum(['male', 'female'], { message: '性别只能是男或女' }).optional(),
  age: z.union([
    z.number().int('年龄必须是整数').min(16, '年龄不能小于16岁').max(70, '年龄不能大于70岁'),
    z.string().refine((val) => {
      const num = parseInt(val);
      return !isNaN(num) && num >= 16 && num <= 70 && num.toString() === val;
    }, '年龄必须是16-70之间的整数').transform(val => parseInt(val))
  ]).optional(),
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
  ]).optional(),
  department: z.enum([
    '销售部', '运营部', '人事部', '未分配'
  ]).optional(),
  arrivalDate: z.string().transform((str) => str ? new Date(str) : undefined).optional(),
  resignationReason: z.string().max(500, '备注内容最多500字').optional(),
  recruitmentStatus: z.enum(RECRUITMENT_STATUS_VALUES).optional(),
});

// GET - 获取单个招聘记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: '无效的记录ID' },
        { status: 400 }
      );
    }

    const record = await RecruitmentRecord.findById(id);
    if (!record) {
      return NextResponse.json(
        { success: false, error: '招聘记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: normalizeRecruitmentRecord(record.toObject())
    });
  } catch (error) {
    console.error('获取招聘记录失败:', error);
    return NextResponse.json(
      { success: false, error: '获取招聘记录失败' },
      { status: 500 }
    );
  }
}

// PUT - 更新招聘记录
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: '无效的记录ID' },
        { status: 400 }
      );
    }

    const existingRecord = await RecruitmentRecord.findById(id);
    if (!existingRecord) {
      return NextResponse.json(
        { success: false, error: '招聘记录不存在' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const validatedData = updateRecruitmentRecordSchema.parse(body);

    const normalizedIdCard = validatedData.idCard?.trim()
      ? validatedData.idCard
      : undefined;
    const hasPhoneField = Object.prototype.hasOwnProperty.call(validatedData, 'phone');
    const normalizedPhone = validatedData.phone?.trim()
      ? validatedData.phone.trim()
      : undefined;

    if (normalizedIdCard && normalizedIdCard !== existingRecord.idCard) {
      const duplicateRecord = await RecruitmentRecord.findOne({
        idCard: normalizedIdCard,
        _id: { $ne: id }
      });

      if (duplicateRecord) {
        return NextResponse.json(
          { success: false, error: '该身份证号已存在其他招聘记录' },
          { status: 400 }
        );
      }
    }

    if (normalizedPhone && normalizedPhone !== existingRecord.phone) {
      const duplicatePhone = await RecruitmentRecord.findOne({
        phone: normalizedPhone,
        _id: { $ne: id }
      });

      if (duplicatePhone) {
        return NextResponse.json(
          { success: false, error: '该手机号已存在其他招聘记录' },
          { status: 400 }
        );
      }
    }

    const nextStatus = normalizeRecruitmentStatus(
      validatedData.recruitmentStatus || existingRecord.recruitmentStatus
    );
    const nextArrivalDate = validatedData.arrivalDate ?? getArrivalDate(existingRecord.toObject());
    const nextPhone = hasPhoneField ? normalizedPhone : existingRecord.phone;

    if (requiresArrivalDate(nextStatus) && !nextArrivalDate) {
      return NextResponse.json(
        { success: false, error: '当前招聘状态必须填写到岗日期' },
        { status: 400 }
      );
    }

    const { phone, ...validatedDataWithoutPhone } = validatedData;
    void phone;

    const updateData = {
      ...validatedDataWithoutPhone,
      idCard: normalizedIdCard,
      ...(normalizedPhone ? { phone: normalizedPhone } : {}),
      recruitmentStatus: nextStatus,
      arrivalDate: nextArrivalDate,
      regularizedDate: nextStatus === 'regularized'
        ? (existingRecord.regularizedDate || new Date())
        : undefined,
      trialDays: calculateTrialDays(
        nextArrivalDate,
        nextStatus,
        nextStatus === 'regularized'
          ? (existingRecord.regularizedDate || new Date())
          : undefined
      )
    };

    if (nextStatus === 'regularized') {
      await syncEmployeeFromRecruitment({
        candidateName: validatedData.candidateName || existingRecord.candidateName,
        city: validatedData.city || existingRecord.city || '宜昌',
        gender: validatedData.gender || existingRecord.gender,
        phone: nextPhone,
        idCard: normalizedIdCard ?? existingRecord.idCard,
        arrivalDate: nextArrivalDate,
        appliedPosition: validatedData.appliedPosition || existingRecord.appliedPosition,
        department: validatedData.department || existingRecord.department
      });
    }

    const updatedRecord = await RecruitmentRecord.findByIdAndUpdate(
      id,
      hasPhoneField && !normalizedPhone
        ? { $set: updateData, $unset: { phone: '' } }
        : { $set: updateData },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      data: normalizeRecruitmentRecord(updatedRecord?.toObject() || updateData),
      message: '招聘记录更新成功'
    });
  } catch (error) {
    console.error('更新招聘记录失败:', error);

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
      return NextResponse.json(
        { success: false, error: '身份证号或手机号已存在' },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: '更新招聘记录失败' },
      { status: 500 }
    );
  }
}

// DELETE - 删除招聘记录
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: '无效的记录ID' },
        { status: 400 }
      );
    }

    const deletedRecord = await RecruitmentRecord.findByIdAndDelete(id);
    if (!deletedRecord) {
      return NextResponse.json(
        { success: false, error: '招聘记录不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '招聘记录删除成功'
    });
  } catch (error) {
    console.error('删除招聘记录失败:', error);
    return NextResponse.json(
      { success: false, error: '删除招聘记录失败' },
      { status: 500 }
    );
  }
}
