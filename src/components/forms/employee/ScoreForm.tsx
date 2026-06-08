'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/basic/button';
import { Input } from '@/components/ui/form/input';
import { Textarea } from '@/components/ui/form/textarea';
import { Label } from '@/components/ui/form/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { Badge } from '@/components/ui/basic/badge';
import { SCORE_BEHAVIORS } from '@/constants';
import { ScoreRecord } from '@/types';

// 表单验证模式
const formSchema = z.object({
  employeeId: z.string().min(1, '请选择员工'),
  recordDate: z.string().min(1, '记录日期不能为空'),
  behaviorType: z.string().min(1, '请选择行为类型'),
  reason: z.string().min(2, '记录原因至少2个字符').max(500, '记录原因最多500字符'),
  recordedBy: z.string().min(1, '记录人不能为空'),
  evidence: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department?: string;
  position?: string;
  totalScore: number;
}

interface ScoreFormProps {
  initialData?: Partial<ScoreRecord>;
  onSubmit: (data: FormData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export function ScoreForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: ScoreFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedBehavior, setSelectedBehavior] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: initialData?.employeeId || '',
      recordDate: initialData?.recordDate 
        ? format(new Date(initialData.recordDate), 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd'),
      behaviorType: initialData?.behaviorType || '',
      reason: initialData?.reason || '',
      recordedBy: initialData?.recordedBy || '管理员',
      evidence: initialData?.evidence || '',
    },
  });

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      const response = await fetch('/api/employees?limit=100&workStatus=active');
      const result = await response.json();
      
      if (result.success) {
        setEmployees(result.data.employees);
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
    }
  };

  // 获取所有行为类型
  const getAllBehaviors = () => {
    return [
      ...SCORE_BEHAVIORS.DEDUCTIONS.map(b => ({ ...b, category: 'deduction' })),
      ...SCORE_BEHAVIORS.ADDITIONS.map(b => ({ ...b, category: 'addition' }))
    ];
  };

  // 获取选中行为的详细信息
  const getSelectedBehaviorInfo = () => {
    const allBehaviors = getAllBehaviors();
    return allBehaviors.find(b => b.type === selectedBehavior);
  };

  const handleSubmit = async (data: FormData) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('提交失败:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    if (initialData?.behaviorType) {
      setSelectedBehavior(initialData.behaviorType);
    }
  }, [initialData]);

  const behaviorInfo = getSelectedBehaviorInfo();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '录入积分记录' : '编辑积分记录'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 基础信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>选择员工 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择员工" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee._id} value={employee.employeeId}>
                            <div className="flex items-center justify-between w-full">
                              <span>{employee.name} ({employee.employeeId})</span>
                              <Badge variant="outline" className="ml-2">
                                {employee.totalScore}分
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="recordDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>记录日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 行为类型选择 */}
            <FormField
              control={form.control}
              name="behaviorType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>行为类型 *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedBehavior(value);
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="请选择行为类型" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <div className="p-2">
                        <div className="mb-2 text-sm font-medium text-success">加分项目</div>
                        {SCORE_BEHAVIORS.ADDITIONS.map((behavior) => (
                          <SelectItem key={behavior.type} value={behavior.type}>
                            <div className="flex w-full items-center justify-between">
                              <span>{behavior.description}</span>
                              <Badge variant="default" className="ml-2 border-transparent bg-success/15 text-success">
                                +{behavior.score}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                      <div className="border-t p-2">
                        <div className="mb-2 text-sm font-medium text-destructive">扣分项目</div>
                        {SCORE_BEHAVIORS.DEDUCTIONS.map((behavior) => (
                          <SelectItem key={behavior.type} value={behavior.type}>
                            <div className="flex items-center justify-between w-full">
                              <span>{behavior.description}</span>
                              <Badge variant="destructive" className="ml-2">
                                {behavior.score}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </div>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                  {behaviorInfo && (
                    <div className="mt-2 p-3 bg-muted rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{behaviorInfo.description}</span>
                        <Badge 
                          variant={behaviorInfo.category === 'addition' ? 'default' : 'destructive'}
                          className={behaviorInfo.category === 'addition' ? 'border-transparent bg-success/15 text-success' : ''}
                        >
                          {behaviorInfo.score > 0 ? '+' : ''}{behaviorInfo.score}分
                        </Badge>
                      </div>
                    </div>
                  )}
                </FormItem>
              )}
            />

            {/* 记录原因 */}
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>记录原因 *</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="请详细描述具体情况..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* 记录人和证据 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="recordedBy"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>记录人 *</FormLabel>
                    <FormControl>
                      <Input placeholder="记录人姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="evidence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>证据附件</FormLabel>
                    <FormControl>
                      <Input placeholder="图片URL（可选）" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-end space-x-2">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? '提交中...' : (mode === 'create' ? '创建' : '更新')}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
