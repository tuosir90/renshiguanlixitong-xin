'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/basic/button';
import { Input } from '@/components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/layout/table';
import { Badge } from '@/components/ui/basic/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/layout/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/interaction/dialog';
import { IdCardDisplay } from '@/components/ui/form/id-card-display';
import { PasswordVerification } from '@/components/ui/form/password-verification';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Users,
  UserCheck,
  UserX,
  Clock
} from 'lucide-react';
import { RecruitmentRecord } from '@/types';
import {
  CITIES,
  GENDER_LABELS,
  RECRUITMENT_STATUS_BADGE_CLASS_NAMES,
  RECRUITMENT_STATUS_LABELS,
} from '@/constants';
import { formatDate } from '@/utils';
import { exportToExcel, formatRecruitmentDataForExport } from '@/utils/export';
import { calculateTrialDays, requiresArrivalDate } from '@/utils/recruitment';
import { toast } from 'sonner';

interface RecruitmentListProps {
  records: RecruitmentRecord[];
  total: number;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  onSearch: (keyword: string) => void;
  onFilter: (filters: { status?: string; city?: string }) => void;
  onStatusUpdate: (
    id: string,
    data: { recruitmentStatus: RecruitmentRecord['recruitmentStatus']; arrivalDate?: string }
  ) => Promise<boolean>;
  onEdit: (record: RecruitmentRecord) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
  isLoading?: boolean;
}

interface OverviewStat {
  value: number;
  label: string;
  unit?: string;
}

interface OverviewStats {
  totalRecruitment: OverviewStat;
  pendingDecisionCount: OverviewStat;
  pendingArrivalCount: OverviewStat;
  noShowCount: OverviewStat;
  trialingCount: OverviewStat;
  regularizedCount: OverviewStat;
  rejectedCount: OverviewStat;
}

interface StatConfig {
  key: keyof OverviewStats;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}

export default function RecruitmentList({
  records,
  total,
  page,
  limit,
  onPageChange,
  onSearch,
  onFilter,
  onStatusUpdate,
  onEdit,
  onDelete,
  onAdd,
  isLoading = false
}: RecruitmentListProps) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [detailRecord, setDetailRecord] = useState<RecruitmentRecord | null>(null);
  const [detailStatus, setDetailStatus] = useState<RecruitmentRecord['recruitmentStatus']>('pending_arrival');
  const [detailArrivalDate, setDetailArrivalDate] = useState('');
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    type: 'edit' | 'delete';
    record: RecruitmentRecord;
  } | null>(null);

  const totalPages = Math.ceil(total / limit);

  const fetchOverviewStats = async () => {
    setStatsLoading(true);
    try {
      const params = new URLSearchParams({
        ...(cityFilter !== 'all' && { city: cityFilter }),
      });
      const response = await fetch(`/api/recruitment/overview?${params}`);
      const result = await response.json();
      if (result.success) {
        setOverviewStats(result.data);
      }
    } catch (error) {
      console.error('获取概览统计失败:', error);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewStats();
  }, [cityFilter]);

  useEffect(() => {
    if (!detailRecord) {
      return;
    }
    setDetailStatus(detailRecord.recruitmentStatus);
    setDetailArrivalDate(
      detailRecord.arrivalDate
        ? new Date(detailRecord.arrivalDate).toISOString().slice(0, 10)
        : ''
    );
  }, [detailRecord]);

  const handleSearch = () => {
    onSearch(searchKeyword);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    onFilter({ status, city: cityFilter });
  };

  const handleCityFilter = (city: string) => {
    setCityFilter(city);
    onFilter({ status: statusFilter, city });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleEditClick = (record: RecruitmentRecord) => {
    setPendingAction({ type: 'edit', record });
    setShowPasswordDialog(true);
  };

  const handleDeleteClick = (record: RecruitmentRecord) => {
    setPendingAction({ type: 'delete', record });
    setShowPasswordDialog(true);
  };

  const handlePasswordSuccess = () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'edit') {
      onEdit(pendingAction.record);
    } else {
      onDelete(pendingAction.record._id!);
    }
    setPendingAction(null);
  };

  const handlePasswordClose = () => {
    setShowPasswordDialog(false);
    setPendingAction(null);
  };

  const handleRowClick = (record: RecruitmentRecord) => {
    setDetailRecord(record);
  };

  const handleDetailClose = () => {
    setDetailRecord(null);
    setIsStatusUpdating(false);
  };

  const handleStatusSubmit = async () => {
    if (!detailRecord?._id) {
      return;
    }

    if (requiresArrivalDate(detailStatus) && !detailArrivalDate) {
      toast.error('当前招聘状态必须填写到岗日期');
      return;
    }

    setIsStatusUpdating(true);
    const success = await onStatusUpdate(detailRecord._id, {
      recruitmentStatus: detailStatus,
      arrivalDate: detailArrivalDate || undefined,
    });
    setIsStatusUpdating(false);

    if (success) {
      handleDetailClose();
    }
  };

  const handleExport = () => {
    try {
      const formattedData = formatRecruitmentDataForExport(records);
      const success = exportToExcel(
        formattedData,
        `招聘记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`,
        '招聘记录'
      );

      if (success) {
        toast.success('招聘记录导出成功');
      } else {
        toast.error('导出失败，请重试');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  const statsConfig: StatConfig[] = [
    {
      key: 'totalRecruitment',
      title: '招聘总人数',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      key: 'pendingDecisionCount',
      title: '待定人数',
      icon: MoreHorizontal,
      color: 'text-slate-600',
      bgColor: 'bg-slate-100'
    },
    {
      key: 'pendingArrivalCount',
      title: '待到岗人数',
      icon: UserCheck,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      key: 'noShowCount',
      title: '未到岗人数',
      icon: UserX,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      key: 'trialingCount',
      title: '试岗中人数',
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      key: 'regularizedCount',
      title: '已转正人数',
      icon: UserCheck,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      key: 'rejectedCount',
      title: '已拒绝人数',
      icon: UserX,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100'
    }
  ];

  const detailTrialDays = detailArrivalDate
    ? calculateTrialDays(
        detailArrivalDate,
        detailStatus,
        detailStatus === 'regularized' ? new Date() : undefined
      )
    : undefined;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3">
        {statsConfig.map((statConfig) => {
          const Icon = statConfig.icon;
          const statData = overviewStats?.[statConfig.key];

          return (
            <Card key={statConfig.key}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-muted-foreground leading-tight">
                      {statConfig.title}
                    </p>
                    <div className="mt-1 flex items-baseline gap-1">
                      <p className="text-xl font-bold leading-none">
                        {statsLoading ? '...' : (statData?.value || '0')}
                      </p>
                      {statData?.unit && (
                        <span className="text-xs text-muted-foreground">{statData.unit}</span>
                      )}
                    </div>
                  </div>
                  <div className={`shrink-0 p-2 rounded-full ${statConfig.bgColor} ${statConfig.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>招聘记录管理</CardTitle>
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                导出Excel
              </Button>
              <Button onClick={onAdd}>
                <Plus className="h-4 w-4 mr-2" />
                新增记录
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜索姓名、手机号或身份证号..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
              />
              <Button onClick={handleSearch} variant="outline">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex gap-2">
              <Select value={cityFilter} onValueChange={handleCityFilter}>
                <SelectTrigger className="w-[132px]">
                  <SelectValue placeholder="公司" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部公司</SelectItem>
                  {CITIES.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}公司
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  {Object.entries(RECRUITMENT_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>姓名</TableHead>
                  <TableHead>城市</TableHead>
                  <TableHead>性别</TableHead>
                  <TableHead>年龄</TableHead>
                  <TableHead>身份证号</TableHead>
                  <TableHead>电话</TableHead>
                  <TableHead>应聘岗位</TableHead>
                  <TableHead>面试日期</TableHead>
                  <TableHead>到岗日期</TableHead>
                  <TableHead>试岗天数</TableHead>
                  <TableHead>备注内容</TableHead>
                  <TableHead>招聘状态</TableHead>
                  <TableHead>创建时间</TableHead>
                  <TableHead>操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : records.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={14} className="text-center py-8 text-muted-foreground">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  records.map((record) => (
                    <TableRow
                      key={record._id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleRowClick(record)}
                    >
                      <TableCell className="font-medium">{record.candidateName}</TableCell>
                      <TableCell>{record.city || '宜昌'}</TableCell>
                      <TableCell>{GENDER_LABELS[record.gender]}</TableCell>
                      <TableCell className="text-center">
                        {record.age ? <span className="font-medium text-blue-600">{record.age}岁</span> : '-'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        {record.idCard ? <IdCardDisplay idCard={record.idCard} /> : <span className="text-gray-400 text-sm">未填写</span>}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{record.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{record.appliedPosition || '未分配'}</Badge>
                      </TableCell>
                      <TableCell>{formatDate(record.interviewDate)}</TableCell>
                      <TableCell>{record.arrivalDate ? formatDate(record.arrivalDate) : '-'}</TableCell>
                      <TableCell className="text-center">
                        {record.trialDays ? `${record.trialDays} 天` : '-'}
                      </TableCell>
                      <TableCell className="max-w-48 min-w-32">
                        <div className="whitespace-normal break-words text-sm leading-relaxed">
                          {record.resignationReason || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={RECRUITMENT_STATUS_BADGE_CLASS_NAMES[record.recruitmentStatus]}>
                          {RECRUITMENT_STATUS_LABELS[record.recruitmentStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {record.createdAt ? formatDate(record.createdAt) : '-'}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(record)}>
                              <Edit className="h-4 w-4 mr-2" />
                              编辑
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteClick(record)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            共 {total} 条记录，第 {page} 页，共 {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
            >
              上一页
            </Button>
            <Button
              variant="outline"
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
            >
              下一页
            </Button>
          </div>
        </div>
      )}

      <PasswordVerification
        isOpen={showPasswordDialog}
        onClose={handlePasswordClose}
        onSuccess={handlePasswordSuccess}
        title={pendingAction?.type === 'edit' ? '编辑验证' : '删除验证'}
        description={
          pendingAction?.type === 'edit'
            ? '为保护数据安全，请输入编辑密码'
          : '为保护数据安全，请输入删除密码'
        }
      />

      <Dialog open={!!detailRecord} onOpenChange={(open) => !open && handleDetailClose()}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>招聘记录详情与状态更新</DialogTitle>
          </DialogHeader>
          {detailRecord && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">姓名</p>
                  <p className="font-medium">{detailRecord.candidateName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">城市</p>
                  <p className="font-medium">{detailRecord.city || '宜昌'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">电话</p>
                  <p className="font-medium">{detailRecord.phone || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">应聘岗位</p>
                  <p className="font-medium">{detailRecord.appliedPosition || '未分配'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">所属部门</p>
                  <p className="font-medium">{detailRecord.department || '未分配'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">面试日期</p>
                  <p className="font-medium">{formatDate(detailRecord.interviewDate)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">招聘状态</p>
                  <Select value={detailStatus} onValueChange={(value) => setDetailStatus(value as RecruitmentRecord['recruitmentStatus'])}>
                    <SelectTrigger>
                      <SelectValue placeholder="请选择招聘状态" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(RECRUITMENT_STATUS_LABELS).map(([value, label]) => (
                        <SelectItem key={value} value={value}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {requiresArrivalDate(detailStatus) && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">到岗日期</p>
                    <Input
                      type="date"
                      value={detailArrivalDate}
                      onChange={(e) => setDetailArrivalDate(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 text-sm">
                <p className="font-medium mb-2">自动统计</p>
                <p>试岗天数：{detailTrialDays ? `${detailTrialDays} 天` : '暂无'}</p>
              </div>

              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={handleDetailClose}>
                  关闭
                </Button>
                <Button onClick={handleStatusSubmit} disabled={isStatusUpdating}>
                  {isStatusUpdating ? '保存中...' : '保存状态'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
