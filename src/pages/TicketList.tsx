import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, Megaphone } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { departments, currentUser } from '@/data/mockData';
import { useTicketStore, type SLAInfoExtended } from '@/stores/ticketStore';
import type { AnomalyTicket } from '@/types';
import { cn } from '@/lib/utils';

type TabKey = 'pending' | 'processing' | 'completed';
type LevelKey = AnomalyTicket['level'];
type TimeoutKey = 'all' | 'overdue' | '1h' | '4h' | 'safe' | 'on-time' | 'overdue-completed';
type HandlerKey = 'all' | 'mine' | 'unclaimed';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'completed', label: '已完成' },
];

const LEVELS: { key: LevelKey; label: string }[] = [
  { key: 'critical', label: '严重' },
  { key: 'high', label: '高' },
  { key: 'medium', label: '中' },
  { key: 'low', label: '低' },
];

const ALL_TIMEOUT_OPTIONS: { key: TimeoutKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'overdue', label: '已超时' },
  { key: '1h', label: '1小时内' },
  { key: '4h', label: '4小时内' },
  { key: 'safe', label: '无风险' },
  { key: 'on-time', label: '按时完成' },
  { key: 'overdue-completed', label: '超时完成' },
];

const HANDLER_OPTIONS: { key: HandlerKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'mine', label: '我认领的' },
  { key: 'unclaimed', label: '待认领' },
];

const levelBar: Record<LevelKey, string> = {
  critical: 'bg-danger',
  high: 'bg-warning',
  medium: 'bg-yellow-400',
  low: 'bg-brand',
};

const levelBg: Record<LevelKey, string> = {
  critical: 'bg-danger/10 text-danger border-danger/20',
  high: 'bg-warning/10 text-warning border-warning/20',
  medium: 'bg-yellow-400/10 text-yellow-400 border-yellow-400/20',
  low: 'bg-brand/10 text-brand border-brand/20',
};

const levelLabel: Record<LevelKey, string> = {
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

type SLAStatus = 'overdue' | 'warning-1h' | 'warning-4h' | 'safe';

interface SLAInfo {
  status: SLAStatus;
  remainingSeconds: number;
  remainingText: string;
}

function calcSLA(deadlineStr: string): SLAInfo {
  const now = new Date().getTime();
  const deadline = new Date(deadlineStr.replace(/-/g, '/')).getTime();
  const remainingSeconds = Math.floor((deadline - now) / 1000);

  let status: SLAStatus;
  if (remainingSeconds < 0) {
    status = 'overdue';
  } else if (remainingSeconds < 3600) {
    status = 'warning-1h';
  } else if (remainingSeconds < 14400) {
    status = 'warning-4h';
  } else {
    status = 'safe';
  }

  const absSec = Math.abs(remainingSeconds);
  const hours = Math.floor(absSec / 3600);
  const minutes = Math.floor((absSec % 3600) / 60);
  let remainingText: string;
  if (status === 'overdue') {
    if (hours > 0) remainingText = `已超时${hours}h${minutes}m`;
    else remainingText = `已超时${minutes}m`;
  } else {
    if (hours > 0) remainingText = `剩余${hours}h${minutes}m`;
    else remainingText = `剩余${minutes}m`;
  }

  return { status, remainingSeconds, remainingText };
}

const slaBadgeStyle: Record<SLAStatus, string> = {
  overdue: 'bg-danger/15 text-danger border-danger/30',
  'warning-1h': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'warning-4h': 'bg-yellow-400/15 text-yellow-300 border-yellow-400/30',
  safe: 'bg-white/5 text-white/40 border-white/10',
};

interface SLAWithCompleted {
  basic: SLAInfo;
  extended: SLAInfoExtended;
}

function matchesTimeout(key: TimeoutKey, t: AnomalyTicket, slaMap: SLAWithCompleted): boolean {
  switch (key) {
    case 'all': return true;
    case 'overdue': return slaMap.basic.status === 'overdue';
    case '1h': return slaMap.basic.status === 'warning-1h';
    case '4h': return slaMap.basic.status === 'warning-4h';
    case 'safe': return slaMap.basic.status === 'safe';
    case 'on-time':
      if (t.status !== 'completed') return false;
      return slaMap.extended.completedInfo?.overdueCompleted === false;
    case 'overdue-completed':
      if (t.status !== 'completed') return false;
      return slaMap.extended.completedInfo?.overdueCompleted === true;
  }
}

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
  const sla = calcSLA(t.slaDeadline);
  const handlerAvatar: AvatarItem | undefined = t.handler
    ? { id: t.handler.id, src: t.handler.avatar, name: t.handler.name }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      className="relative w-full overflow-hidden rounded-2xl bg-background-card border border-white/5 text-left transition-all duration-300 ease-out hover:bg-white/5 active:scale-[0.98]"
    >
      {t.urgedCount > 0 && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1 rounded-full bg-danger px-2 py-0.5 text-[9px] font-bold text-white shadow-lg shadow-danger/30">
          <Megaphone size={10} strokeWidth={2.5} />
          催办{t.urgedCount}
        </div>
      )}
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
        <div className="mt-3 flex items-center gap-3 flex-wrap">
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
          <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium', slaBadgeStyle[sla.status])}>
            {sla.remainingText}
          </span>
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
  const tickets = useTicketStore((s) => s.tickets);
  const getTicketCounts = useTicketStore((s) => s.getTicketCounts);
  const storeStatusFilter = useTicketStore((s) => s.statusFilter);
  const setStatusFilter = useTicketStore((s) => s.setStatusFilter);
  const storeListTab = useTicketStore((s) => s.listTab);
  const setListTab = useTicketStore((s) => s.setListTab);
  const getSLAInfo = useTicketStore((s) => s.getSLAInfo);

  const validTabs: TabKey[] = ['pending', 'processing', 'completed'];
  const initialTab: TabKey = validTabs.includes(storeListTab as TabKey) ? (storeListTab as TabKey) : 'pending';

  const [tab, setTab] = useState<TabKey>(initialTab);
  const [selectedLevels, setSelectedLevels] = useState<LevelKey[]>([]);
  const [deptId, setDeptId] = useState<string>('d0');
  const [timeoutFilter, setTimeoutFilter] = useState<TimeoutKey>('all');
  const [handlerFilter, setHandlerFilter] = useState<HandlerKey>('all');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showTimeoutDropdown, setShowTimeoutDropdown] = useState(false);
  const [showHandlerDropdown, setShowHandlerDropdown] = useState(false);

  useEffect(() => {
    if (storeStatusFilter !== 'all' && storeStatusFilter !== tab && validTabs.includes(storeStatusFilter as TabKey)) {
      setTab(storeStatusFilter as TabKey);
    }
  }, []);

  const updateTab = (newTab: TabKey) => {
    setTab(newTab);
    setListTab(newTab);
    setStatusFilter(newTab);
  };

  const statusCounts = useMemo(() => getTicketCounts(), [tickets, getTicketCounts]);

  const stats = useMemo(() => ({
    critical: tickets.filter((t) => t.level === 'critical').length,
    high: tickets.filter((t) => t.level === 'high').length,
    medium: tickets.filter((t) => t.level === 'medium').length,
    low: tickets.filter((t) => t.level === 'low').length,
  }), [tickets]);

  const TIMEOUT_OPTIONS = useMemo(() => {
    if (tab === 'completed') {
      return ALL_TIMEOUT_OPTIONS;
    }
    return ALL_TIMEOUT_OPTIONS.filter((o) => o.key !== 'on-time' && o.key !== 'overdue-completed');
  }, [tab]);

  const slaCache = useMemo(() => {
    const map = new Map<string, SLAWithCompleted>();
    tickets.forEach((t) => {
      map.set(t.id, {
        basic: calcSLA(t.slaDeadline),
        extended: getSLAInfo(t.id),
      });
    });
    return map;
  }, [tickets, getSLAInfo]);

  const list = useMemo(() => {
    return tickets.filter((t) => {
      if (t.status !== tab) return false;
      if (selectedLevels.length > 0 && !selectedLevels.includes(t.level)) return false;
      if (deptId !== 'd0' && t.departmentId !== deptId) return false;
      const sla = slaCache.get(t.id);
      if (!sla) return false;
      if (!matchesTimeout(timeoutFilter, t, sla)) return false;
      if (handlerFilter === 'mine') {
        if (!t.handler || t.handler.id !== currentUser.id) return false;
      } else if (handlerFilter === 'unclaimed') {
        if (t.status !== 'pending' || t.handler) return false;
      }
      return true;
    });
  }, [tickets, tab, selectedLevels, deptId, timeoutFilter, handlerFilter, slaCache]);

  const toggleLevel = (lv: LevelKey) => {
    setSelectedLevels((prev) =>
      prev.includes(lv) ? prev.filter((l) => l !== lv) : [...prev, lv]
    );
  };

  const deptName = departments.find((d) => d.id === deptId)?.name ?? '全部';
  const timeoutLabel = TIMEOUT_OPTIONS.find((o) => o.key === timeoutFilter)?.label ?? '全部';
  const handlerLabel = HANDLER_OPTIONS.find((o) => o.key === handlerFilter)?.label ?? '全部';

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
              onClick={() => updateTab(t.key)}
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

        <div className="mt-4 rounded-2xl bg-background-card border border-white/5 p-3 space-y-3">
          <div className="flex items-center gap-2">
            <Filter size={14} strokeWidth={2} className="text-white/40 shrink-0" />
            <span className="text-[11px] font-medium text-white/60">筛选条件</span>
          </div>

          <div>
            <div className="text-[10px] text-white/30 mb-1.5">严重等级</div>
            <div className="flex gap-1.5 flex-wrap">
              {LEVELS.map((lv) => {
                const active = selectedLevels.includes(lv.key);
                return (
                  <button
                    key={lv.key}
                    type="button"
                    onClick={() => toggleLevel(lv.key)}
                    className={cn(
                      'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                      active
                        ? levelBg[lv.key]
                        : 'bg-white/[0.03] text-white/40 border-white/10 hover:text-white/60 hover:border-white/20'
                    )}
                  >
                    {lv.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <div className="text-[10px] text-white/30 mb-1.5">部门</div>
              <button
                type="button"
                onClick={() => {
                  setShowDeptDropdown(!showDeptDropdown);
                  setShowTimeoutDropdown(false);
                  setShowHandlerDropdown(false);
                }}
                className="w-full flex items-center justify-between gap-1 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white/70 hover:border-white/20 transition-all"
              >
                <span className="truncate">{deptName}</span>
                <ChevronDown size={12} strokeWidth={2} className={cn('text-white/40 transition-transform', showDeptDropdown && 'rotate-180')} />
              </button>
              {showDeptDropdown && (
                <div className="absolute z-30 mt-1 w-full rounded-xl bg-background-card border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                  {departments.filter((d) => d.id !== 'd0' || d.id === 'd0').map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => { setDeptId(d.id); setShowDeptDropdown(false); }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-[11px] transition-all',
                        deptId === d.id ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5'
                      )}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="text-[10px] text-white/30 mb-1.5">超时</div>
              <button
                type="button"
                onClick={() => {
                  setShowTimeoutDropdown(!showTimeoutDropdown);
                  setShowDeptDropdown(false);
                  setShowHandlerDropdown(false);
                }}
                className="w-full flex items-center justify-between gap-1 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white/70 hover:border-white/20 transition-all"
              >
                <span className="truncate">{timeoutLabel}</span>
                <ChevronDown size={12} strokeWidth={2} className={cn('text-white/40 transition-transform', showTimeoutDropdown && 'rotate-180')} />
              </button>
              {showTimeoutDropdown && (
                <div className="absolute z-30 mt-1 w-full rounded-xl bg-background-card border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                  {TIMEOUT_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => { setTimeoutFilter(o.key); setShowTimeoutDropdown(false); }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-[11px] transition-all',
                        timeoutFilter === o.key ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative">
              <div className="text-[10px] text-white/30 mb-1.5">处理人</div>
              <button
                type="button"
                onClick={() => {
                  setShowHandlerDropdown(!showHandlerDropdown);
                  setShowDeptDropdown(false);
                  setShowTimeoutDropdown(false);
                }}
                className="w-full flex items-center justify-between gap-1 rounded-lg bg-white/[0.03] border border-white/10 px-2 py-1.5 text-[11px] text-white/70 hover:border-white/20 transition-all"
              >
                <span className="truncate">{handlerLabel}</span>
                <ChevronDown size={12} strokeWidth={2} className={cn('text-white/40 transition-transform', showHandlerDropdown && 'rotate-180')} />
              </button>
              {showHandlerDropdown && (
                <div className="absolute z-30 mt-1 w-full rounded-xl bg-background-card border border-white/10 shadow-2xl shadow-black/40 overflow-hidden">
                  {HANDLER_OPTIONS.map((o) => (
                    <button
                      key={o.key}
                      type="button"
                      onClick={() => { setHandlerFilter(o.key); setShowHandlerDropdown(false); }}
                      className={cn(
                        'w-full px-3 py-2 text-left text-[11px] transition-all',
                        handlerFilter === o.key ? 'bg-brand/15 text-brand' : 'text-white/70 hover:bg-white/5'
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
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
