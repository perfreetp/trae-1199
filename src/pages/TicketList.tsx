import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { tickets } from '@/data/mockData';
import type { AnomalyTicket } from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'pending' | 'processing' | 'completed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
];

const levelBar: Record<AnomalyTicket['level'], string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-yellow-400',
  low: 'bg-brand',
};

const levelBg: Record<AnomalyTicket['level'], string> = {
  critical: 'bg-danger/10 text-danger border-danger/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  low: 'bg-brand/10 text-brand border-brand/20',
};

const levelLabel: Record<AnomalyTicket['level'], string> = {
  critical: '严重',
  high: '高',
  medium: '中',
  low: '低',
};

const statusText: Record<AnomalyTicket['status'], { text: string; status: 'warning' | 'info' | 'success' }> = {
  pending: { text: '待认领', status: 'warning' },
  processing: { text: '处理中', status: 'info' },
  completed: { text: '已完成', status: 'success' },
};

function StatCard({ count, label, color }: { count: number; label: string; color: string }) {
  return (
    <div className={cn('flex-1 rounded-xl border p-3', color)}>
      <div className="text-xl font-bold">{count}</div>
      <div className="mt-0.5 text-[10px] opacity-70">{label}</div>
    </div>
  );
}

function TicketCard({ t, onClick }: { t: AnomalyTicket; onClick: () => void }) {
  const st = statusText[t.status];
  const handlerAvatar: AvatarItem | undefined = t.handler
    ? { id: t.handler.id, src: t.handler.avatar, name: t.handler.name }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl bg-background-card border border-white/5 text-left transition-all duration-300 ease-out hover:bg-white/5 active:scale-[0.98]"
    >
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', levelBar[t.level])} />
      <div className="p-4 pl-5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={cn('inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-semibold border', levelBg[t.level])}>
                {levelLabel[t.level]}
              </span>
              <h3 className="text-sm font-semibold text-white truncate">{t.title}</h3>
            </div>
            <div className="mt-1 text-[11px] text-white/40">指标：{t.metricName}</div>
          </div>
          <StatusBadge status={st.status} text={st.text} size="sm" showIcon={false} />
        </div>
        <div className="mt-3 flex items-center gap-3">
          <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 border border-white/5">
            <div className="text-[9px] text-white/30">当前值</div>
            <div className="text-xs font-semibold text-white">{t.snapshotValue.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-2.5 py-1.5 border border-white/5">
            <div className="text-[9px] text-white/30">期望值</div>
            <div className="text-xs font-semibold text-white/70">{t.expectedValue.toLocaleString()}</div>
          </div>
          <div className="rounded-lg bg-danger/10 px-2.5 py-1.5 border border-danger/20">
            <div className="text-[9px] text-danger/60">偏差率</div>
            <div className="text-xs font-semibold text-danger">{t.deviation > 0 ? '+' : ''}{t.deviation}%</div>
          </div>
        </div>
        {t.status === 'processing' && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
              <div className="h-full rounded-full bg-gradient-to-r from-brand to-brand/70" style={{ width: `${40 + Math.abs(t.deviation) % 50}%` }} />
            </div>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {handlerAvatar && <AvatarGroup avatars={[handlerAvatar]} max={1} size="sm" />}
            {!handlerAvatar && t.assignee && (
              <AvatarGroup avatars={[{ id: t.assignee.id, src: t.assignee.avatar, name: t.assignee.name }]} max={1} size="sm" />
            )}
            <span className="text-[10px] text-white/30">{t.createdAt.slice(5, 16)}</span>
          </div>
          {t.status === 'pending' && (
            <span className="inline-flex items-center rounded-lg bg-warning/15 px-3 py-1.5 text-[11px] font-medium text-warning border border-warning/20">
              认领
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export default function TicketList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('pending');

  const stats = useMemo(() => ({
    critical: tickets.filter((t) => t.level === 'critical').length,
    high: tickets.filter((t) => t.level === 'high').length,
    medium: tickets.filter((t) => t.level === 'medium').length,
    low: tickets.filter((t) => t.level === 'low').length,
  }), []);

  const statusCounts = useMemo(() => ({
    pending: tickets.filter((t) => t.status === 'pending').length,
    processing: tickets.filter((t) => t.status === 'processing').length,
    completed: tickets.filter((t) => t.status === 'completed').length,
  }), []);

  const list = useMemo(() => tickets.filter((t) => t.status === tab), [tab]);

  return (
    <div className="min-h-screen bg-[#0F1326]">
      <TopBar
        title="异常工单"
        showBack
        onBack={() => navigate(-1)}
        actions={['more']}
        onAction={() => {}}
      />

      <div className="mx-auto max-w-md px-4 pb-8">
        <div className="mt-4 grid grid-cols-4 gap-2">
          <StatCard count={stats.critical} label="严重" color="bg-danger/10 text-danger border-danger/20" />
          <StatCard count={stats.high} label="高" color="bg-warning/10 text-warning border-warning/20" />
          <StatCard count={stats.medium} label="中" color="bg-yellow-400/10 text-yellow-400 border-yellow-400/20" />
          <StatCard count={stats.low} label="低" color="bg-brand/10 text-brand border-brand/20" />
        </div>

        <div className="mt-5 flex gap-1 rounded-xl bg-white/5 p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'flex-1 min-h-10 rounded-lg text-xs font-medium transition-all duration-300 relative',
                tab === t.key ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/60 hover:text-white/80',
              )}
            >
              {t.label}
              <span className={cn(
                'ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-semibold',
                tab === t.key ? 'bg-white/20 text-white' : 'bg-white/10 text-white/50',
              )}>
                {statusCounts[t.key]}
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((t) => (
            <TicketCard key={t.id} t={t} onClick={() => navigate(`/tickets/${t.id}`)} />
          ))}
        </div>

        {list.length === 0 && (
          <div className="mt-20 text-center text-sm text-white/30">暂无工单</div>
        )}
      </div>
    </div>
  );
}
