'use client';

import { useState } from 'react';
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
import { Button } from '@/components/ui/basic/button';
import { Badge } from '@/components/ui/basic/badge';
import { Checkbox } from '@/components/ui/form/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { 
  Trophy, 
  Medal, 
  Award, 
  Star, 
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

// 表单验证模式
const generateFormSchema = z.object({
  year: z.string().min(1, '请选择年份'),
  forceRegenerate: z.boolean()
});

type GenerateFormValues = z.input<typeof generateFormSchema>;
type GenerateFormData = z.output<typeof generateFormSchema>;

interface AwardGenerateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

interface GenerateResult {
  awards: Array<{
    _id: string;
    year: number;
    employeeId: {
      name: string;
      department: string;
      position: string;
    };
    finalScore: number;
    rank: number;
    awardLevel: string;
    bonusAmount: number;
    evaluationDetails: {
      yearlyScore: number;
      totalScore: number;
      recordCount: number;
    };
  }>;
  statistics: {
    totalEmployees: number;
    qualifiedEmployees: number;
    awardedEmployees: number;
    totalBonusAmount: number;
    awardLevelCounts: {
      special: number;
      first: number;
      second: number;
      excellent: number;
    };
  };
}

// 奖项等级配置
const AWARD_LEVELS = {
  special: { label: '特等奖', icon: Trophy, color: 'text-foreground', bgColor: 'bg-muted' },
  first: { label: '一等奖', icon: Medal, color: 'text-foreground', bgColor: 'bg-muted' },
  second: { label: '二等奖', icon: Award, color: 'text-foreground', bgColor: 'bg-muted' },
  excellent: { label: '优秀员工', icon: Star, color: 'text-foreground', bgColor: 'bg-muted' }
};

export default function AwardGenerate({ open, onOpenChange, onSuccess }: AwardGenerateProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generateResult, setGenerateResult] = useState<GenerateResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const form = useForm<GenerateFormValues, undefined, GenerateFormData>({
    resolver: zodResolver(generateFormSchema),
    defaultValues: {
      year: new Date().getFullYear().toString(),
      forceRegenerate: false
    }
  });

  const onSubmit = async (data: GenerateFormData) => {
    try {
      setIsSubmitting(true);

      const submitData = {
        year: parseInt(data.year),
        forceRegenerate: data.forceRegenerate
      };

      const response = await fetch('/api/awards/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      const result = await response.json();

      if (result.success) {
        setGenerateResult(result.data);
        setShowPreview(true);
        toast.success(result.message || '年度评优生成成功');
      } else {
        toast.error(result.error || '生成年度评优失败');
      }
    } catch (error) {
      console.error('生成失败:', error);
      toast.error('操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirm = () => {
    onSuccess();
    setShowPreview(false);
    setGenerateResult(null);
    form.reset();
  };

  const handleCancel = () => {
    setShowPreview(false);
    setGenerateResult(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    setShowPreview(false);
    setGenerateResult(null);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showPreview ? '年度评优生成结果' : '生成年度评优'}
          </DialogTitle>
        </DialogHeader>

        {!showPreview ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                {/* 年份选择 */}
                <FormField<GenerateFormValues, 'year'>
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>评优年份 *</FormLabel>
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

                {/* 强制重新生成 */}
                <FormField<GenerateFormValues, 'forceRegenerate'>
                  control={form.control}
                  name="forceRegenerate"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          强制重新生成
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          如果该年度已有评优记录，勾选此项将删除原有记录并重新生成
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                {/* 评优规则说明 */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      评优规则说明
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-sm space-y-2">
                      <p><strong>评分计算：</strong>自动统计在职员工最高积分的前三名</p>
                      <p><strong>参与条件：</strong>最终得分 ≥ 0分的在职员工</p>
                      <p><strong>奖项配额：</strong></p>
                      <div className="grid grid-cols-1 gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          <Trophy className="h-4 w-4 text-muted-foreground" />
                          <span>特等奖：1名 (¥5,000) - 积分第1名</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Medal className="h-4 w-4 text-muted-foreground" />
                          <span>一等奖：1名 (¥3,000) - 积分第2名</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Award className="h-4 w-4 text-muted-foreground" />
                          <span>二等奖：1名 (¥2,000) - 积分第3名</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  取消
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? '生成中...' : '开始生成'}
                </Button>
              </div>
            </form>
          </Form>
        ) : (
          generateResult && (
            <div className="space-y-6">
              {/* 生成统计 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">总员工数</p>
                        <p className="text-2xl font-bold">{generateResult.statistics.totalEmployees}</p>
                      </div>
                      <Users className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">符合条件</p>
                        <p className="text-2xl font-bold">{generateResult.statistics.qualifiedEmployees}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">获奖人数</p>
                        <p className="text-2xl font-bold">{generateResult.statistics.awardedEmployees}</p>
                      </div>
                      <Trophy className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">总奖金</p>
                        <p className="text-2xl font-bold">¥{generateResult.statistics.totalBonusAmount.toLocaleString()}</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 获奖名单 */}
              <Card>
                <CardHeader>
                  <CardTitle>获奖名单</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {generateResult.awards.map((award, index) => {
                      const config = AWARD_LEVELS[award.awardLevel as keyof typeof AWARD_LEVELS];
                      const IconComponent = config.icon;
                      
                      return (
                        <div key={award._id} className={`p-3 rounded-lg border ${config.bgColor}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant="outline" className="font-mono">
                                #{award.rank}
                              </Badge>
                              <div>
                                <div className="font-medium">{award.employeeId.name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {award.employeeId.department} • {award.employeeId.position}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`flex items-center gap-1 ${config.color} font-medium`}>
                                <IconComponent className="h-4 w-4" />
                                {config.label}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {award.finalScore.toFixed(1)}分 • ¥{award.bonusAmount.toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  重新生成
                </Button>
                <Button onClick={handleConfirm}>
                  确认保存
                </Button>
              </div>
            </div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
