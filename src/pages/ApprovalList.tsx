import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useApprovalStore } from '@/stores/approvalStore';
import { cn } from '@/lib/utils';
import { Check, X, ChevronRight } from 'lucide-react';

type TabKey = 'pending' | 'approved';
type RequestType = 'create' | 'update' | 'deprecate';

const typeConfig: Record<RequestType, { label: string; bg: string; text: string }> = {
  create: { label: '指标创建', bg: 'bg-success/15', text: 'text-success' },
  update: { label: '口径修订', bg: 'bg-brand/15', text: 'text-brand' },
  deprecate: { label: '规则废弃', bg: 'bg-danger/15', text: 'text-danger' },
};

export default function ApprovalList() {
  const [tab, setTab] = useState<TabKey>('pending');
  const { pendingList, approvedList } = useApprovalStore();
  const list = tab === 'pending' ? pendingList : approvedList;

  const listWithApprovedCount = useMemo(() => {
    return list.map((item) => ({
      ...item,
      approvedCount: item.approvals.reduce((acc, a) => acc + (a.status === 'approved' ? 1 : 0), 0),
    }));
  }, [list]);

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
                {t === 'pending' ? `待审批${pendingList.length > 0 ? ` (${pendingList.length})` : ''}` : '已审批'}
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
                className={cn(
                  'rounded-2xl p-4 transition-all duration-300 cursor-pointer',
                  'bg-background-card border border-white/5 hover:border-white/10',
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
                        onClick={(e) => e.stopPropagation()}
                        className="flex h-8 items-center gap-1 rounded-lg bg-danger/15 px-3 text-xs font-medium text-danger hover:bg-danger/25 transition-all"
                      >
                        <X size={13} strokeWidth={2.5} />
                        拒绝
                      </button>
                      <button
                        onClick={(e) => e.stopPropagation()}
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
