'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/basic/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/layout/card';
import { Badge } from '@/components/ui/basic/badge';
import {
  Download,
  FileText,
  Award,
  Users,
  Eye,
  Package,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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

interface CertificateGeneratorProps {
  awards: AwardRecord[];
  selectedYear?: number;
}

const AWARD_LEVEL_LABELS = {
  special: '特等奖',
  first: '一等奖',
  second: '二等奖',
  excellent: '优秀员工'
};

const AWARD_LEVEL_COLORS = {
  special: 'border-transparent bg-foreground text-background',
  first: 'border-transparent bg-foreground/70 text-background',
  second: 'border-transparent bg-foreground/45 text-background',
  excellent: 'border-transparent bg-muted text-muted-foreground'
};

export default function CertificateGenerator({ awards, selectedYear }: CertificateGeneratorProps) {
  // 批量打开证书页面
  const handleBatchView = () => {
    if (awards.length === 0) {
      toast.error('没有可查看的证书');
      return;
    }

    awards.forEach((award, index) => {
      setTimeout(() => {
        window.open(`/certificate/${award._id}`, '_blank');
      }, index * 200); // 延迟打开，避免浏览器阻止弹窗
    });

    toast.success(`正在打开${awards.length}份证书页面`);
  };

  // 按奖项等级分组
  const groupedAwards = awards.reduce((groups, award) => {
    const level = award.awardLevel;
    if (!groups[level]) {
      groups[level] = [];
    }
    groups[level].push(award);
    return groups;
  }, {} as Record<string, AwardRecord[]>);

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            证书生成器
            {selectedYear && (
              <Badge variant="outline">{selectedYear}年度</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                共 {awards.length} 位获奖者
              </span>
            </div>

            <Button
              onClick={handleBatchView}
              disabled={awards.length === 0}
              className="flex items-center gap-2"
            >
              <Package className="h-4 w-4" />
              批量查看证书
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 获奖者列表 */}
      <div className="space-y-4">
        {Object.entries(groupedAwards).map(([level, levelAwards]) => (
          <Card key={level}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge 
                  variant="outline" 
                  className={AWARD_LEVEL_COLORS[level as keyof typeof AWARD_LEVEL_COLORS]}
                >
                  {AWARD_LEVEL_LABELS[level as keyof typeof AWARD_LEVEL_LABELS]}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  ({levelAwards.length}人)
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {levelAwards.map((award) => (
                  <div 
                    key={award._id}
                    className="border rounded-lg p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{award.employeeId.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {award.employeeId.employeeId}
                        </p>
                      </div>
                      <Badge variant="outline">
                        第{award.rank}名
                      </Badge>
                    </div>
                    
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">部门：</span>
                        <span>{award.employeeId.department}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">岗位：</span>
                        <span>{award.employeeId.position}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">得分：</span>
                        <span>{award.finalScore}分</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">奖金：</span>
                        <span className="font-medium tabular-nums">
                          ¥{award.bonusAmount.toLocaleString()}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Link
                        href={`/certificate/${award._id}`}
                        target="_blank"
                        className="flex-1"
                      >
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          查看证书
                        </Button>
                      </Link>
                      <Link
                        href={`/certificate/${award._id}`}
                        target="_blank"
                        className="flex-1"
                      >
                        <Button
                          size="sm"
                          className="w-full"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          打开页面
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>


    </div>
  );
}
