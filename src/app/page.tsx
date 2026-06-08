'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/layout/card';
import { Button } from '@/components/ui/basic/button';
import { SystemStatus } from '@/components/home/SystemStatus';
import { UserPlus, Award, ArrowRight, Check } from 'lucide-react';

const moduleCards = [
  {
    title: '招聘记录管理系统',
    description: '管理面试记录、试岗情况、招聘状态等信息，提供数据统计和分析功能',
    icon: UserPlus,
    href: '/recruitment',
    features: ['面试记录管理', '试岗状态跟踪', '招聘数据统计', '月度趋势分析'],
  },
  {
    title: '员工贡献评估系统',
    description: '管理员工信息、积分评估、年度评优等功能，激励员工积极性',
    icon: Award,
    href: '/employees',
    features: ['员工档案管理', '积分评估系统', '年度评优管理', '数据可视化'],
  },
];

const valueSections = [
  {
    title: '招聘记录管理系统',
    icon: UserPlus,
    purpose: '规范招聘流程，提升人才筛选效率',
    points: [
      '标准化面试流程，减少主观判断偏差',
      '数据化试岗管理，量化员工适岗能力',
      '招聘漏斗分析，优化人才获取渠道',
      '降低招聘成本，提高人岗匹配度',
    ],
  },
  {
    title: '员工贡献评估系统',
    icon: Award,
    purpose: '激发员工潜能，构建公平激励机制',
    points: [
      '量化工作贡献，建立透明评价体系',
      '积分制管理，实时反馈员工表现',
      '年度评优机制，树立榜样激励团队',
      '数据驱动决策，优化人力资源配置',
    ],
  },
];

export default function HomePage() {
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [healthLoading, setHealthLoading] = useState(true);

  useEffect(() => {
    const fetchSystemHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const result = await response.json();
        if (result.success) {
          setSystemHealth(result.data);
        }
      } catch (error) {
        console.error('Failed to fetch system health:', error);
      } finally {
        setHealthLoading(false);
      }
    };

    fetchSystemHealth();

    // 每30秒刷新一次系统状态
    const interval = setInterval(() => {
      fetchSystemHealth();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mx-auto max-w-screen-xl px-6 py-12">
      {/* 页头 */}
      <header className="mb-10 max-w-2xl">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          呈尚策划 · 人事管理系统
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground text-balance sm:text-4xl">
          数字化人事管理，提升企业运营效率
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground text-pretty">
          一体化的招聘、员工、积分与评优管理平台，帮助团队规范流程、量化贡献、数据驱动决策。
        </p>
      </header>

      {/* 系统状态监控 */}
      {!healthLoading && systemHealth && (
        <div className="mb-12">
          <SystemStatus health={systemHealth} />
        </div>
      )}

      {/* 核心模块入口 */}
      <section className="mb-12">
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">核心模块</h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {moduleCards.map((module) => {
            const Icon = module.icon;
            return (
              <Card
                key={module.title}
                className="group transition-colors hover:border-foreground/20"
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="space-y-1.5">
                      <CardTitle className="text-base">{module.title}</CardTitle>
                      <CardDescription className="leading-relaxed">
                        {module.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                    {module.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-center gap-2 text-sm text-muted-foreground"
                      >
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-foreground" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button asChild className="w-full sm:w-auto">
                    <Link href={module.href}>
                      进入系统
                      <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* 系统价值介绍 */}
      <section>
        <h2 className="mb-4 text-sm font-medium text-muted-foreground">系统价值</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {valueSections.map((section) => {
            const Icon = section.icon;
            return (
              <div
                key={section.title}
                className="rounded-lg border border-border bg-card p-6"
              >
                <div className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-muted text-foreground">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-foreground">
                    {section.title}
                  </h3>
                </div>
                <p className="mb-4 text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">目的：</span>
                  {section.purpose}
                </p>
                <p className="mb-3 text-sm font-medium text-foreground">核心价值</p>
                <ul className="space-y-2.5">
                  {section.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                    >
                      <Check className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-foreground" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
