import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Clock, AlertTriangle, FileText, Users, Target } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { useTicketStore } from '@/stores/ticketStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { mockTickets, departments } from '@/data/mockData';
import type { AnomalyTicket } from '@/types';
import { cn } from '@/lib/utils';

const levelConfig: Record<AnomalyTicket['level'], { bg: string; border: string; text: string; label: string }> = {
  critical: { bg: 'bg-danger/15', border: 'border-danger/30', text: 'text-danger', label: '严重' },
  high: { bg: 'bg-warning/15', border: 'border-warning/30', text: 'text-warning', label: '高' },
  medium: { bg: 'bg-yellow-400/15', border: 'border-yellow-400/30', text: 'text-yellow-400', label: '中' },
  low: { bg: 'bg-brand/15', border: 'border-brand/30', text: 'text-brand', label: '低' },
};

const statusConf: Record<AnomalyTicket['status'], { text: string; status: 'warning' | 'info' | 'success' }> = {
  pending: { text: '待处理', status: 'warning' },
  processing: { text: '处理中', status: 'info' },
  completed: { text: '已完成', status: 'success' },
};

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">{icon}</div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

export default function TicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const tickets = useTicketStore((s) => s.tickets);
  const claimTicket = useTicketStore((s) => s.claimTicket);

  const fallbackTicket = mockTickets.find((x) => x.id === id) ?? mockTickets[0];
  const t = useMemo(() => {
    const found = tickets.find((x) => x.id === id);
    return found ?? fallbackTicket;
  }, [tickets, id, fallbackTicket]);

  const lc = levelConfig[t.level];
  const sc = statusConf[t.status];
  const dept = departments.find((d) => d.id === t.departmentId);
  const assigneeAvatar: AvatarItem | undefined = t.assignee
    ? { id: t.assignee.id, src: t.assignee.avatar, name: t.assignee.name }
    : undefined;

  const handleClaim = () => {
    claimTicket(t.id);
    addOperationLog('认领', '异常工单', t.title, '一键认领并开始处理');
    showToast('工单已认领，状态变为处理中', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0F1326] pb-28">
      <TopBar
        title="工单详情"
        showBack
        onBack={() => navigate(-1)}
        actions={[]}
        onAction={() => {}}
      />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className={cn('rounded-2xl border p-4', lc.bg, lc.border)}>
          <div className="flex items-start gap-3">
            <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', lc.bg, 'border', lc.border)}>
              <AlertTriangle size={22} className={lc.text} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn('inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold border', lc.bg, lc.border, lc.text)}>
                  {lc.label}
                </span>
                <StatusBadge status={sc.status} text={sc.text} size="sm" showIcon={false} />
              </div>
              <h1 className="mt-1.5 text-base font-bold text-white leading-snug">{t.title}</h1>
              <p className="mt-1.5 text-xs text-white/60 leading-relaxed line-clamp-2">{t.description}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
              <div className="text-[9px] text-white/40">当前值</div>
              <div className={cn('text-sm font-bold mt-0.5', lc.text)}>{t.snapshotValue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
              <div className="text-[9px] text-white/40">期望值</div>
              <div className="text-sm font-bold text-white/70 mt-0.5">{t.expectedValue.toLocaleString()}</div>
            </div>
            <div className="rounded-lg bg-black/20 p-2.5 border border-white/5">
              <div className="text-[9px] text-white/40">偏差</div>
              <div className="text-sm font-bold text-danger mt-0.5">{t.deviation > 0 ? '+' : ''}{t.deviation}%</div>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-[10px] text-white/40">
            <Clock size={11} />
            检测时间：{t.detectedAt}
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle icon={<Target size={14} />} title="影响范围" />
          <div className="rounded-xl bg-background-card border border-white/5 p-4 space-y-3">
            <div>
              <div className="text-[11px] font-medium text-white/40 mb-2">受影响部门</div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center rounded-md bg-brand/10 px-2.5 py-1 text-[11px] text-brand border border-brand/20">
                  {dept?.name ?? '相关部门'}
                </span>
                <span className="inline-flex items-center rounded-md bg-white/5 px-2.5 py-1 text-[11px] text-white/60 border border-white/5">
                  数据中心
                </span>
              </div>
            </div>
            <div>
              <div className="text-[11px] font-medium text-white/40 mb-2">关联指标</div>
              <div className="inline-flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 border border-white/5">
                <FileText size={12} className="text-brand shrink-0" />
                <span className="text-xs text-white/70">{t.metricName}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle icon={<Users size={14} />} title="处理时间线" />
          <div className="relative rounded-xl bg-background-card border border-white/5 p-4 pl-6">
            <div className="absolute left-3.5 top-5 bottom-5 w-px bg-white/10" />
            {t.timestamps.map((ts, i) => {
              const isLast = i === t.timestamps.length - 1;
              const userAvatar: AvatarItem = { id: ts.operator.id, src: ts.operator.avatar, name: ts.operator.name };
              return (
                <div key={i} className="relative pb-5 last:pb-0">
                  <div className={cn(
                    'absolute -left-3.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-background-card',
                    isLast ? 'bg-brand' : i === 0 ? 'bg-danger' : 'bg-success',
                  )}>
                    <div className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <AvatarGroup avatars={[userAvatar]} max={1} size="sm" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-white">{ts.action}</div>
                      {ts.remark && <div className="text-[10px] text-white/40 mt-0.5">{ts.remark}</div>}
                    </div>
                    <div className="text-[10px] text-white/30 shrink-0">{ts.timestamp.slice(5, 16)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {t.status === 'completed' && (
          <div className="mt-5">
            <SectionTitle icon={<FileText size={14} />} title="处理结果" />
            <div className="rounded-xl bg-background-card border border-white/5 p-4 space-y-3">
              <div>
                <div className="text-[11px] font-medium text-white/40 mb-1.5">根因分析</div>
                <p className="text-xs text-white/70 leading-relaxed">{t.rootCause ?? '待填写'}</p>
              </div>
              <div>
                <div className="text-[11px] font-medium text-white/40 mb-1.5">解决方案</div>
                <p className="text-xs text-white/70 leading-relaxed">{t.resolution ?? '待填写'}</p>
              </div>
              {t.evidences.length > 0 && (
                <div>
                  <div className="text-[11px] font-medium text-white/40 mb-2">证据截图</div>
                  <div className="grid grid-cols-3 gap-2">
                    {t.evidences.map((e, i) => (
                      <div key={i} className="aspect-square rounded-lg bg-white/5 border border-white/5 overflow-hidden">
                        {e.startsWith('http') || e.startsWith('data:') ? (
                          <img src={e} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-brand/20 to-white/5 flex items-center justify-center">
                            <FileText size={20} className="text-white/30" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0F1326]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-md">
          {t.status === 'pending' && (
            <button
              type="button"
              onClick={handleClaim}
              className="w-full min-h-12 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
            >
              一键认领
            </button>
          )}
          {t.status === 'processing' && (
            <button
              type="button"
              onClick={() => navigate(`/tickets/${t.id}/handle`)}
              className="w-full min-h-12 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
            >
              填写处理结果
            </button>
          )}
          {t.status === 'completed' && (
            <div className="flex items-center justify-center gap-2 min-h-12 rounded-xl bg-success/10 border border-success/20 text-sm font-medium text-success">
              工单已完成
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
