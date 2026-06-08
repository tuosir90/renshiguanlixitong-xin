import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { RecruitmentRecord } from '@/models';
import { normalizeRecruitmentRecord } from '@/utils/recruitment';

// GET - 获取招聘概览统计数据
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const query: Record<string, unknown> = {};

    if (city === '宜昌' || city === '武汉') {
      query.city = city;
    }

    const rawRecords = await RecruitmentRecord.find(query)
      .sort({ interviewDate: -1 })
      .lean();
    const records = rawRecords.map((record) => normalizeRecruitmentRecord(record));

    const totalRecruitment = records.length;
    const pendingDecisionCount = records.filter(record => record.recruitmentStatus === 'pending_decision').length;
    const pendingArrivalCount = records.filter(record => record.recruitmentStatus === 'pending_arrival').length;
    const noShowCount = records.filter(record => record.recruitmentStatus === 'no_show').length;
    const trialingCount = records.filter(record => record.recruitmentStatus === 'trialing').length;
    const regularizedCount = records.filter(record => record.recruitmentStatus === 'regularized').length;
    const rejectedCount = records.filter(record => record.recruitmentStatus === 'rejected').length;

    const overviewStats = {
      totalRecruitment: {
        value: totalRecruitment,
        label: '招聘总人数'
      },
      pendingDecisionCount: {
        value: pendingDecisionCount,
        label: '待定人数'
      },
      pendingArrivalCount: {
        value: pendingArrivalCount,
        label: '待到岗人数'
      },
      noShowCount: {
        value: noShowCount,
        label: '未到岗人数'
      },
      trialingCount: {
        value: trialingCount,
        label: '试岗中人数'
      },
      regularizedCount: {
        value: regularizedCount,
        label: '已转正人数'
      },
      rejectedCount: {
        value: rejectedCount,
        label: '已拒绝人数'
      }
    };

    return NextResponse.json({
      success: true,
      data: overviewStats
    });
  } catch (error) {
    console.error('获取招聘概览统计数据失败:', error);
    return NextResponse.json(
      { success: false, error: '获取统计数据失败' },
      { status: 500 }
    );
  }
}
