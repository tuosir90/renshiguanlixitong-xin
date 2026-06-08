'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/interaction/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form/form';
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
import { toast } from 'sonner';

// 表单验证模式
const awardFormSchema = z.object({
  year: z.string().min(1, '请选择年份'),
  employeeId: z.string().min(1, '请选择员工'),
  finalScore: z.string().min(1, '请输入最终得分'),
  rank: z.string().min(1, '请输入排名'),
  awardLevel: z.string().min(1, '请选择奖项等级'),
  bonusAmount: z.string().min(1, '请输入奖金金额')
});

type AwardFormData = z.infer<typeof awardFormSchema>;

interface Employee {
  _id: string;
  employeeId: string;
  name: string;
  department: string;
  position: string;
  totalScore: number;
}

interface AwardFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: any;
}

// 奖项等级配置
const AWARD_LEVELS = [
  { value: 'special', label: '特等奖', color: 'bg-foreground' },
  { value: 'first', label: '一等奖', color: 'bg-foreground/70' },
  { value: 'second', label: '二等奖', color: 'bg-foreground/45' },
  { value: 'excellent', label: '优秀员工', color: 'bg-foreground/25' }
];

// 奖金金额配置
const BONUS_AMOUNTS = {
  special: 5000,
  first: 3000,
  second: 2000,
  excellent: 1000
};

export default function AwardForm({ open, onOpenChange, onSuccess, editData }: AwardFormProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AwardFormData>({
    resolver: zodResolver(awardFormSchema),
    defaultValues: {
      year: new Date().getFullYear().toString(),
      employeeId: '',
      finalScore: '',
      rank: '',
      awardLevel: '',
      bonusAmount: ''
    }
  });

  // 获取员工列表
  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/employees?limit=1000&workStatus=active');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setEmployees(result.data.employees);
        }
      }
    } catch (error) {
      console.error('获取员工列表失败:', error);
      toast.error('获取员工列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchEmployees();
      
      // 如果是编辑模式，填充表单数据
      if (editData) {
        form.reset({
          year: editData.year.toString(),
          employeeId: editData.employeeId.employeeId || editData.employeeId,
          finalScore: editData.finalScore.toString(),
          rank: editData.rank.toString(),
          awardLevel: editData.awardLevel,
          bonusAmount: editData.bonusAmount.toString()
        });
      } else {
        form.reset({
          year: new Date().getFullYear().toString(),
          employeeId: '',
          finalScore: '',
          rank: '',
          awardLevel: '',
          bonusAmount: ''
        });
      }
    }
  }, [open, editData, form]);

  // 监听奖项等级变化，自动填充奖金金额
  const watchAwardLevel = form.watch('awardLevel');
  useEffect(() => {
    if (watchAwardLevel && BONUS_AMOUNTS[watchAwardLevel as keyof typeof BONUS_AMOUNTS]) {
      form.setValue('bonusAmount', BONUS_AMOUNTS[watchAwardLevel as keyof typeof BONUS_AMOUNTS].toString());
    }
  }, [watchAwardLevel, form]);

  const onSubmit = async (data: AwardFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        year: parseInt(data.year),
        employeeId: data.employeeId,
        finalScore: parseFloat(data.finalScore),
        rank: parseInt(data.rank),
        awardLevel: data.awardLevel,
        bonusAmount: parseInt(data.bonusAmount)
      };

      const url = editData ? `/api/awards/${editData._id || editData.id}` : '/api/awards';
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || `年度评优记录${editData ? '更新' : '创建'}成功`);
        onSuccess();
      } else {
        toast.error(result.error || `${editData ? '更新' : '创建'}年度评优记录失败`);
      }
    } catch (error) {
      console.error('提交失败:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedEmployee = employees.find(emp => emp.employeeId === form.watch('employeeId'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {editData ? '编辑年度评优记录' : '新增年度评优记录'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {/* 年份 */}
              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年份 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择年份" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 员工选择 */}
              <FormField
                control={form.control}
                name="employeeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>员工 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoading ? "加���中..." : "选择员工"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {employees.map((employee) => (
                          <SelectItem key={employee.employeeId} value={employee.employeeId}>
                            {employee.name} ({employee.employeeId})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* 员工信息显示 */}
            {selectedEmployee && (
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{selectedEmployee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedEmployee.department} • {selectedEmployee.position}
                    </p>
                  </div>
                  <Badge variant="outline">
                    总积分: {selectedEmployee.totalScore}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* 最终得分 */}
              <FormField
                control={form.control}
                name="finalScore"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>最终得分 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="输入最终得分" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 排名 */}
              <FormField
                control={form.control}
                name="rank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>排名 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="输入排名" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* 奖项等级 */}
              <FormField
                control={form.control}
                name="awardLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>奖项等级 *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="选择奖项等级" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AWARD_LEVELS.map((level) => (
                          <SelectItem key={level.value} value={level.value}>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${level.color}`}></div>
                              {level.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* 奖金金额 */}
              <FormField
                control={form.control}
                name="bonusAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>奖金金额 *</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="输入奖金金额" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                取消
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : (editData ? '更新' : '创建')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
