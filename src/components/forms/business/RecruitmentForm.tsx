'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Button } from '@/components/ui/basic/button';
import { Input } from '@/components/ui/form/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/form/select';
import { Textarea } from '@/components/ui/form/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form/form';
import { RecruitmentRecord } from '@/types';
import {
  CITIES,
  DEPARTMENTS,
  GENDER_LABELS,
  POSITIONS,
  RECRUITMENT_STATUS_LABELS,
  RECRUITMENT_STATUS_VALUES,
} from '@/constants';
import {
  calculateTrialDays,
  getArrivalDate,
  normalizeRecruitmentStatus,
  requiresArrivalDate
} from '@/utils/recruitment';

// 表单验证模式
const formSchema = z.object({
  interviewDate: z.string().min(1, '面试日期不能为空'),
  candidateName: z.string().min(2, '姓名至少2个字符').max(20, '姓名最多20个字符'),
  city: z.enum(['宜昌', '武汉'], { message: '请选择城市' }),
  gender: z.enum(['male', 'female'], { message: '请选择性别' }),
  age: z.string().min(1, '年龄不能为空').refine((val) => {
    const num = parseInt(val);
    return !isNaN(num) && num >= 16 && num <= 70 && num.toString() === val;
  }, '年龄必须是16-70之间的整数'),
  idCard: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(val);
  }, '请输入有效的身份证号'),
  phone: z.string().optional().refine((val) => {
    if (!val || val.trim() === '') return true;
    return /^1[3-9]\d{9}$/.test(val.trim());
  }, '请输入有效的手机号码'),
  appliedPosition: z.string().min(1, '请选择应聘岗位'),
  department: z.enum(['销售部', '运营部', '人事部', '未分配'], { message: '请选择部门' }),
  arrivalDate: z.string().optional(),
  resignationReason: z.string().max(500, '备注内容最多500字').optional(),
  recruitmentStatus: z.enum(RECRUITMENT_STATUS_VALUES),
}).superRefine((data, ctx) => {
  if (requiresArrivalDate(data.recruitmentStatus) && !data.arrivalDate) {
    ctx.addIssue({
      code: 'custom',
      path: ['arrivalDate'],
      message: '当前招聘状态必须填写到岗日期',
    });
  }
});

type RecruitmentFormValues = z.input<typeof formSchema>;
type RecruitmentSubmitData = Omit<RecruitmentFormValues, 'age' | 'phone'> & {
  age: number;
  phone?: string;
};

interface RecruitmentFormProps {
  initialData?: Partial<RecruitmentRecord>;
  onSubmit: (data: RecruitmentSubmitData) => Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
  mode?: 'create' | 'edit';
}

export default function RecruitmentForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create'
}: RecruitmentFormProps) {
  const form = useForm<RecruitmentFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      interviewDate: initialData?.interviewDate
        ? format(new Date(initialData.interviewDate), 'yyyy-MM-dd')
        : '',
      candidateName: initialData?.candidateName || '',
      city: initialData?.city || '宜昌',
      gender: initialData?.gender || 'male',
      age: initialData?.age?.toString() || '',
      idCard: initialData?.idCard || '',
      phone: initialData?.phone || '',
      appliedPosition: initialData?.appliedPosition || '未分配',
      department: (initialData?.department as RecruitmentFormValues['department']) || '未分配',
      arrivalDate: getArrivalDate(initialData || {})
        ? format(new Date(getArrivalDate(initialData || {})!), 'yyyy-MM-dd')
        : '',
      resignationReason: initialData?.resignationReason || '',
      recruitmentStatus: normalizeRecruitmentStatus(initialData?.recruitmentStatus),
    },
  });

  const watchRecruitmentStatus = form.watch('recruitmentStatus');
  const watchArrivalDate = form.watch('arrivalDate');
  const calculatedTrialDays = watchArrivalDate
    ? calculateTrialDays(
        watchArrivalDate,
        watchRecruitmentStatus,
        watchRecruitmentStatus === 'regularized' ? new Date() : undefined
      )
    : undefined;

  const handleSubmit = async (data: RecruitmentFormValues) => {
    try {
      const submissionData = {
        ...data,
        age: parseInt(data.age),
        phone: data.phone?.trim() || ''
      };
      await onSubmit(submissionData);
    } catch (error) {
      console.error('提交表单失败:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? '新增招聘记录' : '编辑招聘记录'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField<RecruitmentFormValues, 'interviewDate'>
                control={form.control}
                name="interviewDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>面试日期 *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'candidateName'>
                control={form.control}
                name="candidateName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>应聘姓名 *</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入应聘者姓名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'gender'>
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>性别 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择性别" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(GENDER_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'city'>
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>城市 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择城市" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city} value={city}>
                            {city}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'age'>
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>年龄 *</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="请输入年龄"
                        min="16"
                        max="70"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'idCard'>
                control={form.control}
                name="idCard"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>身份证号</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入18位身份证号（可选）" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'phone'>
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>电话号码</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入11位手机号（可选）" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'appliedPosition'>
                control={form.control}
                name="appliedPosition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>应聘岗位</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择应聘岗位" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="未分配">未分配</SelectItem>
                        {POSITIONS.map((position) => (
                          <SelectItem key={position} value={position}>
                            {position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'department'>
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>所属部门 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择所属部门" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="未分配">未分配</SelectItem>
                        {DEPARTMENTS.map((department) => (
                          <SelectItem key={department} value={department}>
                            {department}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField<RecruitmentFormValues, 'recruitmentStatus'>
                control={form.control}
                name="recruitmentStatus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>招聘状态 *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择招聘状态" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(RECRUITMENT_STATUS_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {requiresArrivalDate(watchRecruitmentStatus) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/50">
                <FormField<RecruitmentFormValues, 'arrivalDate'>
                  control={form.control}
                  name="arrivalDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>到岗日期 *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <p className="text-sm font-medium">自动统计试岗天数</p>
                  <div className="rounded-md border bg-background px-3 py-2 text-sm">
                    {calculatedTrialDays ? `${calculatedTrialDays} 天` : '填写到岗日期后自动计算'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    状态为“试岗中”或“已转正”时，系统会根据到岗日期自动计算试岗天数。
                  </p>
                </div>
              </div>
            )}

            <FormField<RecruitmentFormValues, 'resignationReason'>
              control={form.control}
              name="resignationReason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注内容</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="请填写相关备注信息（最多500字）"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-4">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel}>
                  取消
                </Button>
              )}
              <Button type="submit" disabled={isLoading}>
                {isLoading ? '提交中...' : mode === 'create' ? '创建' : '更新'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
