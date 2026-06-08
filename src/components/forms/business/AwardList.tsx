'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/layout/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/form/select';
import { Input } from '@/components/ui/form/input';
import { Button } from '@/components/ui/basic/button';
import { Badge } from '@/components/ui/basic/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/layout/dropdown-menu';
import {
  Search,
  MoreHorizontal,
  Edit,
  Trash2,
  Trophy,
  Medal,
  Award,
  Star,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import AwardForm from './AwardForm';
import { exportToExcel, formatAwardDataForExport } from '@/utils/export';

interface AwardRecord {
  _id: string;
  year: number;
  employeeId: {
    _id: string;
    employeeId: string;
    name: string;
    department: string;
    position: string;
  };
  finalScore: number;
  rank: number;
  awardLevel: string;
  bonusAmount: number;
  createdAt: string;
}

interface AwardListProps {
  refreshTrigger: number;
}

// 奖项等级配置
const AWARD_LEVELS = {
  special: { label: '特等奖', icon: Trophy, color: 'bg-foreground text-background' },
  first: { label: '一等奖', icon: Medal, color: 'bg-foreground/70 text-background' },
  second: { label: '二等奖', icon: Award, color: 'bg-foreground/45 text-background' },
  excellent: { label: '优秀员工', icon: Star, color: 'bg-muted text-muted-foreground' }
};

export default function AwardList({ refreshTrigger }: AwardListProps) {
  const [awards, setAwards] = useState<AwardRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedAwardLevel, setSelectedAwardLevel] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingAward, setEditingAward] = useState<AwardRecord | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const limit = 10;

  // 获取年度评优列表
  const fetchAwards = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: limit.toString(),
      });

      if (selectedYear && selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedAwardLevel && selectedAwardLevel !== 'all') params.append('awardLevel', selectedAwardLevel);
      if (selectedDepartment && selectedDepartment !== 'all') params.append('department', selectedDepartment);

      const response = await fetch(`/api/awards?${params}`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          let filteredAwards = result.data.awards;

          // 前端搜索过滤
          if (searchTerm) {
            filteredAwards = filteredAwards.filter((award: AwardRecord) =>
              award.employeeId.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              award.employeeId.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
              award.employeeId.department.toLowerCase().includes(searchTerm.toLowerCase())
            );
          }

          setAwards(filteredAwards);
          setTotal(result.data.pagination.total);
          setTotalPages(result.data.pagination.totalPages);
        }
      }
    } catch (error) {
      console.error('获取年度评优列表失败:', error);
      toast.error('获取年度评优列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAwards();
  }, [currentPage, selectedYear, selectedAwardLevel, selectedDepartment, refreshTrigger]);

  // 搜索处理
  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentPage === 1) {
        fetchAwards();
      } else {
        setCurrentPage(1);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // 删除年度评优记录
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条年度评优记录吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/awards/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      if (result.success) {
        toast.success('年度评优记录删除成功');
        fetchAwards();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  // 导出功能
  const handleExport = () => {
    try {
      const formattedData = formatAwardDataForExport(awards);
      const success = exportToExcel(
        formattedData,
        `年度评优记录_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}`,
        '年度评优记录'
      );

      if (success) {
        toast.success('年度评优记录导出成功');
      } else {
        toast.error('导出失败，请重试');
      }
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败，请重试');
    }
  };

  // 编辑年度评优记录
  const handleEdit = (award: AwardRecord) => {
    setEditingAward(award);
    setIsFormOpen(true);
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setEditingAward(null);
    fetchAwards();
  };

  // 获取奖项等级显示
  const getAwardLevelDisplay = (level: string) => {
    const config = AWARD_LEVELS[level as keyof typeof AWARD_LEVELS];
    if (!config) return { label: level, icon: Star, color: 'bg-muted text-muted-foreground' };
    return config;
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="mb-4 h-10 rounded bg-muted"></div>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 rounded bg-muted"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="搜索员工姓名、员工ID或部门..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="年份" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部年份</SelectItem>
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <SelectItem key={year} value={year.toString()}>
                    {year}年
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <Select value={selectedAwardLevel} onValueChange={setSelectedAwardLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="奖项等级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部等级</SelectItem>
              <SelectItem value="special">特等奖</SelectItem>
              <SelectItem value="first">一等奖</SelectItem>
              <SelectItem value="second">二等奖</SelectItem>
              <SelectItem value="excellent">优秀员工</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="部门" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部部门</SelectItem>
              <SelectItem value="销售部">销售部</SelectItem>
              <SelectItem value="运营部">运营部</SelectItem>
              <SelectItem value="人事部">人事部</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 统计信息和操作 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          共 {total} 条记录
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          导出Excel
        </Button>
      </div>

      {/* 表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>排名</TableHead>
              <TableHead>员工信息</TableHead>
              <TableHead>年份</TableHead>
              <TableHead>奖项等级</TableHead>
              <TableHead>最终得分</TableHead>
              <TableHead>奖金金额</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead>操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {awards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              awards.map((award) => {
                const awardConfig = getAwardLevelDisplay(award.awardLevel);
                const IconComponent = awardConfig.icon;
                
                return (
                  <TableRow key={award._id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        #{award.rank}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{award.employeeId.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {award.employeeId.employeeId}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {award.employeeId.department} • {award.employeeId.position}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{award.year}年</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={awardConfig.color}>
                        <IconComponent className="mr-1 h-3 w-3" />
                        {awardConfig.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        {award.finalScore.toFixed(1)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium tabular-nums">
                        ¥{award.bonusAmount.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell>
                      {new Date(award.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(award)}>
                            <Edit className="mr-2 h-4 w-4" />
                            编辑
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(award._id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 分页 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </Button>
          <span className="flex items-center px-4">
            第 {currentPage} 页，共 {totalPages} 页
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </Button>
        </div>
      )}

      {/* 编辑表单 */}
      <AwardForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSuccess={handleFormSuccess}
        editData={editingAward}
      />
    </div>
  );
}
