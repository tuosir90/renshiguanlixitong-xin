'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/basic/button';
import { Input } from '@/components/ui/form/input';
import { Badge } from '@/components/ui/basic/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/layout/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/layout/dropdown-menu';
import { Search, Filter, MoreHorizontal, Edit, Trash2, RefreshCw, Download } from 'lucide-react';
import { SCORE_BEHAVIORS } from '@/constants';
import { exportToExcel, formatScoreDataForExport } from '@/utils/export';
import { toast } from 'sonner';

interface ScoreRecord {
  _id: string;
  employeeId: {
    _id: string;
    employeeId: string;
    name: string;
    department?: string;
    position?: string;
  };
  recordDate: string;
  behaviorType: string;
  scoreChange: number;
  reason: string;
  recordedBy: string;
  evidence?: string;
  createdAt: string;
}

interface ScoreListProps {
  records: ScoreRecord[];
  isLoading: boolean;
  onEdit: (record: ScoreRecord) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

export function ScoreList({
  records,
  isLoading,
  onEdit,
  onDelete,
  onRefresh
}: ScoreListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [behaviorFilter, setBehaviorFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');

  // 获取行为类型的描述
  const getBehaviorDescription = (behaviorType: string) => {
    const allBehaviors = [...SCORE_BEHAVIORS.DEDUCTIONS, ...SCORE_BEHAVIORS.ADDITIONS];
    const behavior = allBehaviors.find(b => b.type === behaviorType);
    return behavior?.description || behaviorType;
  };

  // 获取行为类型的分值
  const getBehaviorScore = (behaviorType: string) => {
    const allBehaviors = [...SCORE_BEHAVIORS.DEDUCTIONS, ...SCORE_BEHAVIORS.ADDITIONS];
    const behavior = allBehaviors.find(b => b.type === behaviorType);
    return behavior?.score || 0;
  };

  // 导出功能
  const handleExport = () => {
    try {
      const formattedData = formatScoreDataForExport(filteredRecords);
      const success = exportToExcel(
        formattedData,
        `积分记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`,
        '积分记录'
      );

      if (success) {
        toast.success('积分记录导出成功');
      } else {
        toast.error('导出失败，请重试');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  // 过滤记录
  const filteredRecords = records.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employeeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employeeId.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.reason.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesBehavior = !behaviorFilter || behaviorFilter === 'all' || record.behaviorType === behaviorFilter;

    const matchesScore = !scoreFilter || scoreFilter === 'all' ||
      (scoreFilter === 'positive' && record.scoreChange > 0) ||
      (scoreFilter === 'negative' && record.scoreChange < 0);

    return matchesSearch && matchesBehavior && matchesScore;
  });

  // 格式化日期
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy/MM/dd');
    } catch {
      return dateString;
    }
  };

  // 获取所有行为类型选项
  const getAllBehaviorOptions = () => {
    const allBehaviors = [...SCORE_BEHAVIORS.DEDUCTIONS, ...SCORE_BEHAVIORS.ADDITIONS];
    return allBehaviors.map(b => ({
      value: b.type,
      label: b.description,
      score: b.score
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>积分记录列表</span>
            <Badge variant="outline">{filteredRecords.length} 条记录</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              刷新
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              导出Excel
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="搜索员工姓名、员工ID或记录原因..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Select value={behaviorFilter} onValueChange={setBehaviorFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="行为类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部行为</SelectItem>
                {getAllBehaviorOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={scoreFilter} onValueChange={setScoreFilter}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="分值类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="positive">加分</SelectItem>
                <SelectItem value="negative">扣分</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 数据表格 */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>员工信息</TableHead>
                <TableHead>行为类型</TableHead>
                <TableHead>分值变化</TableHead>
                <TableHead>记录原因</TableHead>
                <TableHead>记录日期</TableHead>
                <TableHead>记录人</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : filteredRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    暂无数据
                  </TableCell>
                </TableRow>
              ) : (
                filteredRecords.map((record) => (
                  <TableRow key={record._id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{record.employeeId.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {record.employeeId.employeeId}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.employeeId.department} • {record.employeeId.position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {getBehaviorDescription(record.behaviorType)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {record.behaviorType}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={record.scoreChange > 0 ? "default" : "destructive"}
                        className={record.scoreChange > 0 ? "border-transparent bg-success/15 text-success" : ""}
                      >
                        {record.scoreChange > 0 ? '+' : ''}{record.scoreChange}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={record.reason}>
                        {record.reason}
                      </div>
                    </TableCell>
                    <TableCell>
                      {formatDate(record.recordDate)}
                    </TableCell>
                    <TableCell>
                      {record.recordedBy}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => onEdit(record)}>
                            <Edit className="h-4 w-4 mr-2" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => onDelete(record._id)}
                            className="text-destructive"
                          >
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
  );
}
