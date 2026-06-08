import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { useApprovalStore } from '@/stores/approvalStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { X, Check, Clock, User } from 'lucide-react';
import type { RevisionRequest, ApprovalNode } from '@/types';

type ReqType = 'create' | 'update' | 'deprecate';
type NodeStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

const typeConfig: Record<ReqType, { label: string; bg: string; text: string }> = {
  create: { label: '指标创建', bg: 'bg-success/15', text: 'text-success' },
  update: { label: '口径修订', bg: 'bg-brand/15', text: 'text-brand' },
  deprecate: { label: '规则废弃', bg: 'bg-danger/15', text: 'text-danger' },
};

const nodeStatusConfig: Record<NodeStatus, { dot: string; line: string; label: string; labelClass: string }> = {
  pending: { dot: 'bg-warning border-warning', line: 'bg-white/10', label: '待审批', labelClass: 'text-warning' },
  approved: { dot: 'bg-success border-success', line: 'bg-success/50', label: '已通过', labelClass: 'text-success' },
  rejected: { dot: 'bg-danger border-danger', line: 'bg-danger/50', label: '已拒绝', labelClass: 'text-danger' },
  skipped: { dot: 'bg-white/20 border-white/20', line: 'bg-white/10', label: '已跳过', labelClass: 'text-white/40' },
};

const defaultOldContent = `数据源：订单中心ODS层 → 销售明细DWS层 → 月度汇总ADS层
统计范围：线上电商平台、线下门店、分销渠道
维度：时间、地区、渠道（电商/门店/分销）、产品线、客户类型`;

const defaultNewContent = `数据源：订单中心ODS层 + 跨境订单表 → 销售明细DWS层（含跨境） → 月度汇总ADS层
统计范围：线上电商平台、线下门店、分销渠道、跨境电商
维度：时间、地区、渠道（电商/门店/分销/跨境）、产品线、客户类型`;

export default function ApprovalDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [opinion, setOpinion] = useState('');
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const { pendingList, approvedList, submitApproval, publishChange, loadLists } = useApprovalStore();

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  const allRequests = useMemo(() => [...pendingList, ...approvedList], [pendingList, approvedList]);
  const req: RevisionRequest | undefined = useMemo(() => allRequests.find((r) => r.id === id), [allRequests, id]);

  if (!req) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <TopBar title="审批详情" showBack actions={[]} />
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <p className="text-white/50">申请不存在或已被删除</p>
          <button
            onClick={() => navigate('/approvals')}
            className="mt-4 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white"
          >
            返回列表
          </button>
        </div>
        <BottomNav activeTab="approval" />
      </div>
    );
  }

  const cfg = typeConfig[req.type];
  const currentNodeIdx = req.approvals.findIndex((a) => a.status === 'pending');
  const isMyTurn = currentNodeIdx >= 0;
  const allApproved = req.approvals.every((a) => a.status === 'approved');

  const oldContent = defaultOldContent;
  const newContent = defaultNewContent;

  const handleApprove = () => {
    if (currentNodeIdx < 0) return;
    submitApproval(req.id, currentNodeIdx, true, opinion || '同意');
    addOperationLog('通过', '审批中心', req.suggestedContent, opinion || '审批通过');
    setOpinion('');
    showToast('审批已通过', 'success');
  };

  const handleReject = () => {
    if (currentNodeIdx < 0) return;
    submitApproval(req.id, currentNodeIdx, false, opinion || '不同意');
    addOperationLog('拒绝', '审批中心', req.suggestedContent, opinion || '审批拒绝');
    setOpinion('');
    showToast('审批已拒绝', 'warning');
  };

  const handlePublish = () => {
    publishChange(req.id);
    addOperationLog('发布', '审批中心', req.suggestedContent, '变更已发布');
    showToast('变更已发布生效', 'success');
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar title="审批详情" showBack actions={[]} />

      <div className="mx-auto max-w-md px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium', cfg.bg, cfg.text)}>
                {cfg.label}
              </span>
              <h2 className="mt-2 text-base font-semibold text-white">{req.suggestedContent}</h2>
              <p className="mt-1 text-xs text-white/40">申请单号：{req.id.toUpperCase()}-{req.createdAt.slice(2, 10).replace(/-/g, '')}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-white/5 p-3">
            <img src={req.applicant.avatar} alt={req.applicant.name} className="h-10 w-10 rounded-full bg-white/10" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-white">{req.applicant.name}</p>
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/50">{req.applicant.department}</span>
              </div>
              <p className="text-[11px] text-white/40 mt-0.5">申请时间：{req.createdAt}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">变更原因</h3>
          <p className="text-sm text-white/70 leading-relaxed">{req.reason}</p>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <h3 className="text-sm font-semibold text-white mb-3">变更对比</h3>
          <div className="space-y-3">
            <div className="rounded-xl bg-danger/5 border border-danger/15 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-danger/20 text-danger text-xs font-bold">-</span>
                <span className="text-xs font-medium text-danger/80">修改前</span>
              </div>
              <pre className="text-xs text-white/60 whitespace-pre-wrap font-sans leading-relaxed">{oldContent}</pre>
            </div>
            <div className="rounded-xl bg-success/5 border border-success/15 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-success/20 text-success text-xs font-bold">+</span>
                <span className="text-xs font-medium text-success/80">修改后</span>
              </div>
              <pre className="text-xs text-white/70 whitespace-pre-wrap font-sans leading-relaxed">{newContent}</pre>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <h3 className="text-sm font-semibold text-white mb-4">审批流程</h3>
          <div className="relative pl-2">
            {req.approvals.map((node, idx) => {
              const ncfg = nodeStatusConfig[node.status];
              const isLast = idx === req.approvals.length - 1;
              return (
                <div key={node.id} className={cn('relative', !isLast && 'pb-6')}>
                  <div className="absolute left-0 top-0 bottom-0 w-px -translate-x-[7px]" style={{ height: isLast ? '20px' : 'calc(100% - 8px)' }}>
                    <div className={cn('h-full w-full', ncfg.line)} />
                  </div>
                  <div className={cn('absolute left-0 top-1 h-4 w-4 -translate-x-[7px] rounded-full border-2', ncfg.dot)}>
                    {node.status === 'approved' && <Check size={10} strokeWidth={3} className="text-white m-auto mt-[1px]" />}
                    {node.status === 'rejected' && <X size={10} strokeWidth={3} className="text-white m-auto mt-[1px]" />}
                    {node.status === 'pending' && <Clock size={9} strokeWidth={2.5} className="text-white m-auto mt-[2px]" />}
                  </div>
                  <div className="ml-5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {node.approver.avatar ? (
                          <img src={node.approver.avatar} alt="" className="h-6 w-6 rounded-full bg-white/10" />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10">
                            <User size={12} strokeWidth={2} className="text-white/40" />
                          </div>
                        )}
                        <span className="text-sm font-medium text-white">{node.approver.name}</span>
                        <span className={cn('text-[11px] font-medium', ncfg.labelClass)}>{ncfg.label}</span>
                      </div>
                      {node.operatedAt && <span className="text-[11px] text-white/30">{node.operatedAt.slice(5)}</span>}
                    </div>
                    {node.opinion && (
                      <div className="mt-2 rounded-xl bg-white/5 p-3">
                        <p className="text-xs text-white/60">{node.opinion}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {isMyTurn && (
          <div className="rounded-2xl bg-background-card border border-white/5 p-4">
            <h3 className="text-sm font-semibold text-white mb-3">审批意见</h3>
            <textarea
              value={opinion}
              onChange={(e) => setOpinion(e.target.value)}
              placeholder="请输入审批意见（可选）"
              rows={4}
              className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand/40 resize-none transition-all"
            />
          </div>
        )}
      </div>

      {(isMyTurn || allApproved) && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass pb-safe">
          <div className="mx-auto max-w-md px-4 py-3 flex gap-2">
            {isMyTurn && (
              <button
                onClick={handleReject}
                className="flex-1 rounded-xl bg-danger/10 border border-danger/20 py-3.5 text-sm font-semibold text-danger transition-all hover:bg-danger/20 active:scale-[0.98]"
              >
                拒绝
              </button>
            )}
            <button
              onClick={isMyTurn ? handleApprove : handlePublish}
              className="flex-1 rounded-xl bg-success py-3.5 text-sm font-semibold text-background shadow-lg shadow-success/20 transition-all hover:bg-success/90 active:scale-[0.98]"
            >
              {allApproved ? '通过并发布' : '通过'}
            </button>
          </div>
        </div>
      )}

      <BottomNav activeTab="approval" />
    </div>
  );
}
