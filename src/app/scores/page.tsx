'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Button } from '@/components/ui/basic/button';
import { Badge } from '@/components/ui/basic/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/layout/tabs';
import { Plus, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';
import { ScoreForm } from '@/components/forms/employee/ScoreForm';
import { ScoreList } from '@/components/forms/employee/ScoreList';
import { ScoreStatistics } from '@/components/charts/ScoreStatistics';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/interaction/dialog';
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

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department?: string;
  position?: string;
  totalScore: number;
}

interface Statistics {
  employeeRanking: Employee[];
  overallStats: {
    totalRecords: number;
    totalPositiveScore: number;
    totalNegativeScore: number;
    avgScore: number;
  };
}

export default function ScoresPage() {
  const [activeTab, setActiveTab] = useState('records');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ScoreRecord | null>(null);
  const [records, setRecords] = useState<ScoreRecord[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 获取积分记录
  const fetchRecords = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/scores?limit=50&sortBy=recordDate&sortOrder=desc');
      const result = await response.json();
      
      if (result.success) {
        setRecords(result.data.records);
      } else {
        toast.error('获取积分记录失败');
      }
    } catch (error) {
      console.error('获取积分记录失败:', error);
      toast.error('获取积分记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取统计数据
  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/scores/statistics');
      const result = await response.json();
      
      if (result.success) {
        setStatistics(result.data);
      } else {
        toast.error('获取统计数据失败');
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
      toast.error('获取统计数据失败');
    }
  };

  // 处理表单提交
  const handleFormSubmit = async (data: Record<string, unknown>) => {
    try {
      const url = editingRecord ? `/api/scores/${editingRecord._id}` : '/api/scores';
      const method = editingRecord ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(editingRecord ? '积分记录更新成功' : '积分记录创建成功');
        setIsFormOpen(false);
        setEditingRecord(null);
        fetchRecords();
        fetchStatistics();
      } else {
        toast.error(result.error || '操作失败');
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('操作失败');
    }
  };

  // 处理删除
  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条积分记录吗？')) return;

    try {
      const response = await fetch(`/api/scores/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('积分记录删除成功');
        fetchRecords();
        fetchStatistics();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除失败:', error);
      toast.error('删除失败');
    }
  };

  // 处理编辑
  const handleEdit = (record: ScoreRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  // 页面加载时获取数据
  useEffect(() => {
    fetchRecords();
    fetchStatistics();
  }, []);

  return (
    <div className="mx-auto max-w-screen-xl space-y-8 px-6 py-8">
      {/* 页面标题 */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">积分管理</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            管理员工积分记录，查看积分统计和排行榜
          </p>
        </div>
        <Button onClick={() => setIsFormOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          录入积分
        </Button>
      </div>

      {/* 统计卡片 */}
      {statistics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总记录数</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">{statistics.overallStats.totalRecords}</div>
              <p className="mt-1 text-xs text-muted-foreground">积分记录总数</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总加分</CardTitle>
              <TrendingUp className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-success">
                +{statistics.overallStats.totalPositiveScore}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">累计加分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">总扣分</CardTitle>
              <TrendingUp className="h-4 w-4 rotate-180 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums text-destructive">
                {statistics.overallStats.totalNegativeScore}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">累计扣分</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">平均分值</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tabular-nums">
                {statistics.overallStats.avgScore.toFixed(1)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">每条记录平均分值</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 主要内容区域 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="records">积分记录</TabsTrigger>
          <TabsTrigger value="statistics">统计分析</TabsTrigger>
          <TabsTrigger value="ranking">积分排行</TabsTrigger>
        </TabsList>

        <TabsContent value="records" className="space-y-4">
          <ScoreList
            records={records}
            isLoading={isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onRefresh={fetchRecords}
          />
        </TabsContent>

        <TabsContent value="statistics" className="space-y-4">
          <ScoreStatistics />
        </TabsContent>

        <TabsContent value="ranking" className="space-y-4">
          {statistics && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  员工积分排行榜
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statistics.employeeRanking.map((employee, index) => (
                    <div
                      key={employee.employeeId}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{employee.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {employee.employeeId} • {employee.department} • {employee.position}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={employee.totalScore >= 0 ? "default" : "destructive"}
                        className="text-lg px-3 py-1"
                      >
                        {employee.totalScore >= 0 ? '+' : ''}{employee.totalScore}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* 积分录入对话框 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? '编辑积分记录' : '录入积分记录'}
            </DialogTitle>
          </DialogHeader>
          <ScoreForm
            initialData={editingRecord ? {
              ...editingRecord,
              employeeId: editingRecord.employeeId.employeeId,
              recordDate: new Date(editingRecord.recordDate),
              createdAt: new Date(editingRecord.createdAt)
            } : undefined}
            onSubmit={handleFormSubmit}
            onCancel={() => {
              setIsFormOpen(false);
              setEditingRecord(null);
            }}
            mode={editingRecord ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
