import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useApprovalStore } from '@/stores/approvalStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Check, X, ChevronRight, ChevronDown, Filter } from 'lucide-react';
import { mockUsers } from '@/data/mockData';
import type { User, RevisionRequest } from '@/types';

type TabKey = 'pending' | 'approved';
type RequestType = 'create' | 'update' | 'deprecate';
type FilterType = 'all' | RequestType;
type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected' | 'published';

const typeConfig: Record<RequestType, { label: string; bg: string; text: string }> = {
  create: { label: '指标创建', bg: 'bg-success/15', text: 'text-success' },
  update: { label: '口径修订', bg: 'bg-brand/15', text: 'text-brand' },
  deprecate: { label: '规则废弃', bg: 'bg-danger/15', text: 'text-danger' },
};

const typeFilterOptions: { value: FilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'create', label: '指标创建' },
  { value: 'update', label: '口径修订' },
  { value: 'deprecate', label: '规则废弃' },
];

const statusFilterOptions: { value: FilterStatus; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'pending', label: '待审批' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'published', label: '已发布' },
];

type DropdownKey = 'type' | 'applicant' | 'status' | null;

export default function ApprovalList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('pending');
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const { pendingList, approvedList, submitApproval, loadLists } = useApprovalStore();

  const [filterType, setFilterType] = useState<FilterType>('all');
  const [filterApplicant, setFilterApplicant] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const allList = useMemo(() => [...pendingList, ...approvedList], [pendingList, approvedList]);

  const filteredList = useMemo(() => {
    return allList.filter((item) => {
      if (filterType !== 'all' && item.type !== filterType) return false;
      if (filterApplicant !== 'all' && item.applicant.id !== filterApplicant) return false;
      if (filterStatus !== 'all' && item.status !== filterStatus) return false;
      return true;
    });
  }, [allList, filterType, filterApplicant, filterStatus]);

  const list = useMemo(() => {
    return tab === 'pending'
      ? filteredList.filter((i) => i.status === 'pending')
      : filteredList.filter((i) => i.status !== 'pending');
  }, [filteredList, tab]);

  const pendingListLength = useMemo(() => filteredList.filter((i) => i.status === 'pending').length, [filteredList]);

  const listWithApprovedCount = useMemo(() => {
    return list.map((item) => ({
      ...item,
      approvedCount: item.approvals.reduce((acc, a) => acc + (a.status === 'approved' ? 1 : 0), 0),
    }));
  }, [list]);

  const selectedApplicant: User | undefined = mockUsers.find((u) => u.id === filterApplicant);

  const handleQuickApprove = (e: React.MouseEvent, item: RevisionRequest & { approvedCount: number }) => {
    e.stopPropagation();
    const idx = item.approvals.findIndex((a) => a.status === 'pending');
    if (idx < 0) {
      showToast('没有待您审批的节点', 'warning');
      return;
    }
    submitApproval(item.id, idx, true, '快捷审批通过');
    addOperationLog('通过', '审批中心', item.suggestedContent, '快捷审批');
    showToast('已通过审批', 'success');
    loadLists();
  };

  const handleQuickReject = (e: React.MouseEvent, item: RevisionRequest & { approvedCount: number }) => {
    e.stopPropagation();
    const idx = item.approvals.findIndex((a) => a.status === 'pending');
    if (idx < 0) {
      showToast('没有待您审批的节点', 'warning');
      return;
    }
    submitApproval(item.id, idx, false, '快捷审批拒绝');
    addOperationLog('拒绝', '审批中心', item.suggestedContent, '快捷审批');
    showToast('已拒绝审批', 'warning');
    loadLists();
  };

  const toggleDropdown = (key: DropdownKey) => {
    setOpenDropdown((prev) => (prev === key ? null : key));
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="审批中心" showBack actions={[]} />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/60">待我审批</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-3xl font-bold text-white">{pendingList.length}</span>
                <span className="text-xs text-white/40 pb-1">项</span>
              </div>
            </div>
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand/20">
              <Check size={28} strokeWidth={2} className="text-brand" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 pt-4" ref={dropdownRef}>
        <div className="rounded-2xl bg-background-card border border-white/5 p-3 space-y-2">
          <div className="flex items-center gap-1.5 mb-1">
            <Filter size={14} className="text-brand" />
            <span className="text-xs font-medium text-white/70">筛选条件</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap relative">
            <div className="relative">
              <button
                onClick={() => toggleDropdown('type')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                  filterType !== 'all'
                    ? 'bg-brand/15 text-brand border-brand/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20',
                )}
              >
                <span>类型：{typeFilterOptions.find((o) => o.value === filterType)?.label}</span>
                <ChevronDown size={12} className={cn('transition-transform', openDropdown === 'type' && 'rotate-180')} />
              </button>
              {openDropdown === 'type' && (
                <div className="absolute top-full left-0 mt-1 z-40 w-36 rounded-xl bg-[#1A1F36] border border-white/10 shadow-xl shadow-black/30 overflow-hidden animate-fade-in">
                  {typeFilterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterType(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-xs transition-all flex items-center justify-between',
                        filterType === opt.value ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5',
                      )}
                    >
                      <span>{opt.label}</span>
                      {filterType === opt.value && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('applicant')}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                  filterApplicant !== 'all'
                    ? 'bg-brand/15 text-brand border-brand/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20',
                )}
              >
                {selectedApplicant ? (
                  <>
                    <img src={selectedApplicant.avatar} alt="" className="h-4 w-4 rounded-full bg-white/10" />
                    <span>提交人：{selectedApplicant.name}</span>
                  </>
                ) : (
                  <span>提交人：全部</span>
                )}
                <ChevronDown size={12} className={cn('transition-transform', openDropdown === 'applicant' && 'rotate-180')} />
              </button>
              {openDropdown === 'applicant' && (
                <div className="absolute top-full left-0 mt-1 z-40 w-48 rounded-xl bg-[#1A1F36] border border-white/10 shadow-xl shadow-black/30 overflow-hidden animate-fade-in">
                  <button
                    onClick={() => {
                      setFilterApplicant('all');
                      setOpenDropdown(null);
                    }}
                    className={cn(
                      'w-full px-3 py-2.5 text-left text-xs transition-all flex items-center justify-between',
                      filterApplicant === 'all' ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5',
                    )}
                  >
                    <span>全部</span>
                    {filterApplicant === 'all' && <Check size={12} />}
                  </button>
                  {mockUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        setFilterApplicant(u.id);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-xs transition-all flex items-center gap-2',
                        filterApplicant === u.id ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5',
                      )}
                    >
                      <img src={u.avatar} alt="" className="h-5 w-5 rounded-full bg-white/10 shrink-0" />
                      <div className="flex-1 min-w-0 flex items-center justify-between">
                        <div className="min-w-0">
                          <p className="truncate">{u.name}</p>
                          <p className="text-[10px] text-white/40">{u.department}</p>
                        </div>
                        {filterApplicant === u.id && <Check size={12} className="shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <button
                onClick={() => toggleDropdown('status')}
                className={cn(
                  'flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all border',
                  filterStatus !== 'all'
                    ? 'bg-brand/15 text-brand border-brand/30'
                    : 'bg-white/5 text-white/70 border-white/10 hover:border-white/20',
                )}
              >
                <span>状态：{statusFilterOptions.find((o) => o.value === filterStatus)?.label}</span>
                <ChevronDown size={12} className={cn('transition-transform', openDropdown === 'status' && 'rotate-180')} />
              </button>
              {openDropdown === 'status' && (
                <div className="absolute top-full left-0 mt-1 z-40 w-32 rounded-xl bg-[#1A1F36] border border-white/10 shadow-xl shadow-black/30 overflow-hidden animate-fade-in">
                  {statusFilterOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilterStatus(opt.value);
                        setOpenDropdown(null);
                      }}
                      className={cn(
                        'w-full px-3 py-2.5 text-left text-xs transition-all flex items-center justify-between',
                        filterStatus === opt.value ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5',
                      )}
                    >
                      <span>{opt.label}</span>
                      {filterStatus === opt.value && <Check size={12} />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {(filterType !== 'all' || filterApplicant !== 'all' || filterStatus !== 'all') && (
              <button
                onClick={() => {
                  setFilterType('all');
                  setFilterApplicant('all');
                  setFilterStatus('all');
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-[11px] text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
              >
                <X size={12} />
                重置
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="sticky top-14 z-30 mt-4 glass border-b border-white/5">
        <div className="mx-auto max-w-md px-4">
          <div className="flex items-center gap-1 py-2">
            {(['pending', 'approved'] as TabKey[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300',
                  tab === t
                    ? 'bg-brand text-white shadow-lg shadow-brand/20'
                    : 'text-white/50 hover:text-white/80',
                )}
              >
                {t === 'pending' ? `待审批${pendingListLength > 0 ? ` (${pendingListLength})` : ''}` : '已审批'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4 space-y-3">
        {listWithApprovedCount.length === 0 ? (
          <Empty />
        ) : (
          listWithApprovedCount.map((item) => {
            const cfg = typeConfig[item.type];
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/approvals/${item.id}`)}
                className={cn(
                  'rounded-2xl p-4 transition-all duration-300 cursor-pointer',
                  'bg-background-card border border-white/5 hover:border-white/10 active:scale-[0.99]',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', cfg.bg, cfg.text)}>
                        {cfg.label}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-white truncate">{item.suggestedContent}</h3>
                    <p className="mt-1 text-xs text-white/50 line-clamp-2">{item.reason}</p>
                  </div>
                  {tab === 'approved' && (
                    <StatusBadge
                      status={item.status === 'rejected' ? 'danger' : item.status === 'published' ? 'success' : 'info'}
                      text={item.status === 'rejected' ? '已拒绝' : item.status === 'published' ? '已发布' : '已通过'}
                      size="sm"
                      showIcon={false}
                    />
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.applicant.avatar}
                      alt={item.applicant.name}
                      className="h-6 w-6 rounded-full bg-white/10"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white/80 truncate">{item.applicant.name}</p>
                      <p className="text-[11px] text-white/30">{item.createdAt}</p>
                    </div>
                  </div>
                  {tab === 'pending' ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={(e) => handleQuickReject(e, item)}
                        className="flex h-8 items-center gap-1 rounded-lg bg-danger/15 px-3 text-xs font-medium text-danger hover:bg-danger/25 transition-all"
                      >
                        <X size={13} strokeWidth={2.5} />
                        拒绝
                      </button>
                      <button
                        onClick={(e) => handleQuickApprove(e, item)}
                        className="flex h-8 items-center gap-1 rounded-lg bg-success px-3 text-xs font-medium text-background hover:bg-success/90 transition-all"
                      >
                        <Check size={13} strokeWidth={2.5} />
                        同意
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-white/30">
                      <span>{item.approvedCount}/{item.approvals.length}节点</span>
                      <ChevronRight size={14} strokeWidth={2} />
                    </div>
                  )}
                </div>

                {tab === 'approved' && item.approvals.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/5">
                    <p className="text-[11px] text-white/40 line-clamp-1">
                      审批意见：{item.approvals[item.approvals.length - 1].opinion || '无'}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      <BottomNav activeTab="approval" />
    </div>
  );
}
