'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/interaction/dialog';
import { PageContainer } from '@/components/layout';
import RecruitmentForm from '@/components/forms/business/RecruitmentForm';
import RecruitmentList from '@/components/forms/business/RecruitmentList';
import { RecruitmentRecord } from '@/types';

interface PaginatedResponse {
  records: RecruitmentRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function RecruitmentPage() {
  const [records, setRecords] = useState<RecruitmentRecord[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<RecruitmentRecord | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filters, setFilters] = useState<any>({});

  // 获取招聘记录列表
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchKeyword && { keyword: searchKeyword }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status }),
        ...(filters.city && filters.city !== 'all' && { city: filters.city }),
      });

      const response = await fetch(`/api/recruitment?${params}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data.records);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.error || '获取招聘记录失败');
      }
    } catch (error) {
      console.error('获取招聘记录失败:', error);
      toast.error('获取招聘记录失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 创建招聘记录
  const handleCreate = async (data: any) => {
    try {
      const response = await fetch('/api/recruitment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('招聘记录创建成功');
        setIsFormOpen(false);
        fetchRecords();
      } else {
        toast.error(result.error || '创建失败');
      }
    } catch (error) {
      console.error('创建招聘记录失败:', error);
      toast.error('创建招聘记录失败');
    }
  };

  // 更新招聘记录
  const handleUpdate = async (data: any) => {
    if (!editingRecord?._id) return;

    console.log('=== 页面层更新请求数据 ===');
    console.log('appliedPosition:', data.appliedPosition);
    console.log('完整数据:', data);

    try {
      const response = await fetch(`/api/recruitment/${editingRecord._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      console.log('=== 更新API响应结果 ===');
      console.log('appliedPosition:', result.data?.appliedPosition);
      console.log('完整响应:', result);

      if (result.success) {
        toast.success('招聘记录更新成功');
        setIsFormOpen(false);
        setEditingRecord(null);
        
        console.log('=== 准备刷新列表 ===');
        await fetchRecords();
        console.log('=== 列表刷新完成 ===');
      } else {
        toast.error(result.error || '更新失败');
      }
    } catch (error) {
      console.error('更新招聘记录失败:', error);
      toast.error('更新招聘记录失败');
    }
  };

  // 快速更新招聘状态
  const handleStatusUpdate = async (
    id: string,
    data: { recruitmentStatus: RecruitmentRecord['recruitmentStatus']; arrivalDate?: string }
  ) => {
    try {
      const response = await fetch(`/api/recruitment/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('招聘状态更新成功');
        await fetchRecords();
        return true;
      }

      toast.error(result.error || '状态更新失败');
      return false;
    } catch (error) {
      console.error('更新招聘状态失败:', error);
      toast.error('更新招聘状态失败');
      return false;
    }
  };

  // 删除招聘记录
  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/recruitment/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('招聘记录删除成功');
        fetchRecords();
      } else {
        toast.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('删除招聘记录失败:', error);
      toast.error('删除招聘记录失败');
    }
  };

  // 处理编辑
  const handleEdit = (record: RecruitmentRecord) => {
    setEditingRecord(record);
    setIsFormOpen(true);
  };

  // 处理新增
  const handleAdd = () => {
    setEditingRecord(null);
    setIsFormOpen(true);
  };

  // 处理搜索
  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理筛选
  const handleFilter = (newFilters: any) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // 处理分页
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  // 关闭表单
  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingRecord(null);
  };

  // 初始加载和依赖更新
  useEffect(() => {
    fetchRecords();
  }, [pagination.page, searchKeyword, filters]);

  return (
    <PageContainer
      title="招聘记录管理"
      description="管理面试记录、试岗情况、招聘状态等信息"
    >
      <RecruitmentList
        records={records}
        total={pagination.total}
        page={pagination.page}
        limit={pagination.limit}
        onPageChange={handlePageChange}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onStatusUpdate={handleStatusUpdate}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAdd={handleAdd}
        isLoading={isLoading}
      />

      {/* 表单弹窗 */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRecord ? '编辑招聘记录' : '新增招聘记录'}
            </DialogTitle>
          </DialogHeader>
          <RecruitmentForm
            initialData={editingRecord || undefined}
            onSubmit={editingRecord ? handleUpdate : handleCreate}
            onCancel={handleCloseForm}
            mode={editingRecord ? 'edit' : 'create'}
          />
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
