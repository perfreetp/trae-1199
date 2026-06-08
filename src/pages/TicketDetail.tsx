import React, { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Clock,
  AlertTriangle,
  FileText,
  Users,
  Target,
  Send,
  X,
  Bell,
  Image as ImgIcon,
  MessageSquare,
  AlertCircle,
  CheckCircle,
  UserCircle2,
  Pencil,
} from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { useTicketStore, RESPONSIBILITY_LABELS } from '@/stores/ticketStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { mockTickets, departments, mockUsers, currentUser } from '@/data/mockData';
import type { AnomalyTicket, TicketComment, User, ReviewResponsibility } from '@/types';
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

type SlaStatus = 'danger' | 'warning' | 'yellow' | 'success';

const slaStatusConfig: Record<SlaStatus, { bar: string; badgeBg: string; badgeText: string; label: string }> = {
  danger: {
    bar: 'bg-danger',
    badgeBg: 'bg-danger/15 border-danger/30 text-danger',
    badgeText: '已超时',
    label: '已超时',
  },
  warning: {
    bar: 'bg-warning',
    badgeBg: 'bg-warning/15 border-warning/30 text-warning',
    badgeText: '紧急',
    label: '1小时内',
  },
  yellow: {
    bar: 'bg-yellow-400',
    badgeBg: 'bg-yellow-400/15 border-yellow-400/30 text-yellow-400',
    badgeText: '预警',
    label: '4小时内',
  },
  success: {
    bar: 'bg-success',
    badgeBg: 'bg-success/15 border-success/30 text-success',
    badgeText: '正常',
    label: '正常',
  },
};

const RESPONSIBILITY_OPTIONS: { key: ReviewResponsibility; label: string }[] = [
  { key: 'data', label: '数据团队' },
  { key: 'business', label: '业务团队' },
  { key: 'tech', label: '技术团队' },
  { key: 'thirdparty', label: '第三方问题' },
  { key: 'none', label: '无责任' },
];

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">{icon}</div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

function parseDate(s: string): Date {
  return new Date(s.replace(/-/g, '/'));
}

function mapSlaStatus(status: 'overdue' | 'warning-1h' | 'warning-4h' | 'safe'): SlaStatus {
  switch (status) {
    case 'overdue': return 'danger';
    case 'warning-1h': return 'warning';
    case 'warning-4h': return 'yellow';
    default: return 'success';
  }
}

function formatOverdueDuration(seconds: number): string {
  const abs = Math.abs(Math.floor(seconds));
  const h = Math.floor(abs / 3600);
  const m = Math.floor((abs % 3600) / 60);
  return `超时${h}h${m}m`;
}

function highlightMentions(content: string, mentions?: string[]) {
  if (!mentions || mentions.length === 0) return content;
  let result = content;
  mentions.forEach((m) => {
    const re = new RegExp(`(@${m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'g');
    result = result.replace(re, '@@@MENTION@@@$1@@@END@@@');
  });
  const parts = result.split(/@@@MENTION@@@|@@@END@@@/);
  return parts.map((p, i) => {
    if (p.startsWith('@')) {
      return (
        <span key={i} className="text-brand font-medium">
          {p}
        </span>
      );
    }
    return <span key={i}>{p}</span>;
  });
}

export default function TicketDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const tickets = useTicketStore((s) => s.tickets);
  const storeComments = useTicketStore((s) => s.comments);
  const claimTicket = useTicketStore((s) => s.claimTicket);
  const urgeTicket = useTicketStore((s) => s.urgeTicket);
  const addComment = useTicketStore((s) => s.addComment);
  const setListTab = useTicketStore((s) => s.setListTab);
  const setStatusFilter = useTicketStore((s) => s.setStatusFilter);
  const reassignTicket = useTicketStore((s) => s.reassignTicket);
  const getSLAInfo = useTicketStore((s) => s.getSLAInfo);
  const saveReview = useTicketStore((s) => s.saveReview);

  const fallbackTicket = mockTickets.find((x) => x.id === id) ?? mockTickets[0];
  const t = useMemo(() => {
    const found = tickets.find((x) => x.id === id);
    return found ?? fallbackTicket;
  }, [tickets, id, fallbackTicket]);

  const comments = useMemo(() => {
    const filtered = storeComments.filter((c) => c.ticketId === t.id);
    return filtered.sort((a, b) => parseDate(b.createdAt).getTime() - parseDate(a.createdAt).getTime());
  }, [storeComments, t.id]);

  const [now, setNow] = useState(Date.now());
  const [previewImg, setPreviewImg] = useState<string | null>(null);
  const [commentContent, setCommentContent] = useState('');
  const [showReassignModal, setShowReassignModal] = useState(false);

  const isDelegate = t.handler && t.handler.id !== currentUser.id;
  const urgeTarget = t.handler ?? t.assignee;

  const initialEditing = t.status === 'completed' && !t.reviewConclusion;
  const [reviewEditing, setReviewEditing] = useState<boolean>(initialEditing);
  const [reviewResponsibility, setReviewResponsibility] = useState<ReviewResponsibility>(
    t.reviewResponsibility ?? 'none'
  );
  const [reviewConclusion, setReviewConclusion] = useState<string>(t.reviewConclusion ?? '');

  useMemo(() => {
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  const slaInfo = getSLAInfo(t.id, now);
  const slaStatus = mapSlaStatus(slaInfo.status);
  const slaConf = slaStatusConfig[slaStatus];
  const completedPercent = 100 - slaInfo.percent;

  const lc = levelConfig[t.level];
  const sc = statusConf[t.status];
  const dept = departments.find((d) => d.id === t.departmentId);
  const assigneeAvatar: AvatarItem | undefined = t.assignee
    ? { id: t.assignee.id, src: t.assignee.avatar, name: t.assignee.name }
    : undefined;

  const reassignCandidates = useMemo(() => {
    return mockUsers.filter((u) => !t.handler || u.id !== t.handler.id);
  }, [t.handler]);

  const handleBack = () => {
    setListTab(t.status);
    navigate('/tickets');
  };

  const handleClaim = () => {
    claimTicket(t.id);
    addOperationLog('认领', '异常工单', t.title, '一键认领并开始处理');
    showToast('工单已认领，状态变为处理中', 'success');
    setStatusFilter('processing');
    setListTab('processing');
    navigate('/tickets');
  };

  const handleUrge = () => {
    urgeTicket(t.id);
    addOperationLog('催办', '异常工单', t.title, `第${(t.urgedCount ?? 0) + 1}次催办`);
    showToast('催办通知已发送', 'info');
  };

  const handleSendComment = () => {
    const content = commentContent.trim();
    if (!content) {
      showToast('请输入评论内容', 'warning');
      return;
    }
    addComment(t.id, content, [], []);
    addOperationLog('评论', '异常工单', t.title, content.slice(0, 50));
    setCommentContent('');
    showToast('评论已发送', 'success');
  };

  const handleReassign = (user: User) => {
    reassignTicket(t.id, user);
    addOperationLog('转派', '异常工单', t.title, `转派给${user.name}`);
    showToast(`已转派给 ${user.name}`, 'success');
    setShowReassignModal(false);
  };

  const handleSaveReview = () => {
    const conclusion = reviewConclusion.trim();
    if (!conclusion) {
      showToast('请填写复盘结论', 'warning');
      return;
    }
    saveReview(t.id, conclusion, reviewResponsibility);
    const label = RESPONSIBILITY_LABELS[reviewResponsibility];
    addOperationLog(
      '复盘',
      '异常工单',
      t.title,
      `结论：${conclusion.slice(0, 40)} | 责任：${label}`
    );
    showToast('复盘信息已保存', 'success');
    setReviewEditing(false);
  };

  const handleCancelReview = () => {
    setReviewResponsibility(t.reviewResponsibility ?? 'none');
    setReviewConclusion(t.reviewConclusion ?? '');
    setReviewEditing(false);
  };

  const handleStartEditReview = () => {
    setReviewResponsibility(t.reviewResponsibility ?? 'none');
    setReviewConclusion(t.reviewConclusion ?? '');
    setReviewEditing(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSendComment();
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1326] pb-28">
      <TopBar
        title="工单详情"
        showBack
        onBack={handleBack}
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
                {slaInfo.urgedCount > 0 && (
                  <span className="relative inline-flex items-center rounded-md bg-danger/15 border border-danger/30 px-2 py-0.5 text-[10px] font-bold text-danger">
                    <Bell size={10} className="mr-0.5" />
                    催办{slaInfo.urgedCount}次
                  </span>
                )}
              </div>
              <h1 className="mt-1.5 text-base font-bold text-white leading-snug">{t.title}</h1>
              <p className="mt-1.5 text-xs text-white/60 leading-relaxed line-clamp-2">{t.description}</p>
            </div>
          </div>

          {t.handler && (
            <div className="mt-4 rounded-lg bg-black/20 border border-white/5 p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="shrink-0 h-6 w-6 rounded-full overflow-hidden bg-white/5 border border-white/10">
                  {t.handler.avatar ? (
                    <img src={t.handler.avatar} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-[10px] text-white/50 font-medium">
                      {t.handler.name?.slice(0, 1) ?? '?'}
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-white/60">处理人：</span>
                <span className="text-[11px] font-medium text-white">{t.handler.name}</span>
                {isDelegate && (
                  <span className="inline-flex items-center rounded-md bg-warning/10 border border-warning/30 px-2 py-0.5 text-[10px] font-semibold text-warning">
                    代处理中
                  </span>
                )}
              </div>
              {isDelegate && (
                <div className="mt-1.5 text-[10px] text-warning/80 leading-relaxed">
                  当前操作会标记为代处理，实际记录人员为 {currentUser.name}
                </div>
              )}
            </div>
          )}

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
          <SectionTitle icon={<Clock size={14} />} title="SLA 处理时效" />
          <div className="rounded-xl bg-background-card border border-white/5 p-4 space-y-3">
            {t.status !== 'completed' ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold border', slaConf.badgeBg)}>
                      {slaConf.badgeText}
                    </span>
                    <span className="text-[10px] text-white/40">
                      截止：{t.slaDeadline.slice(5, 16)}
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-bold',
                    slaStatus === 'danger' ? 'text-danger' :
                    slaStatus === 'warning' ? 'text-warning' :
                    slaStatus === 'yellow' ? 'text-yellow-400' : 'text-success',
                  )}>
                    {slaInfo.remainingText}
                  </span>
                </div>
                <div className="relative h-2 w-full rounded-full bg-white/5 overflow-hidden">
                  <div
                    className={cn('absolute left-0 top-0 h-full rounded-full transition-all duration-500', slaConf.bar)}
                    style={{ width: `${completedPercent}%` }}
                  />
                  <div
                    className="absolute top-0 h-full w-0.5 bg-white/30"
                    style={{ left: `${completedPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-white/40">
                  <span>已消耗 {completedPercent.toFixed(0)}%</span>
                  <span>剩余 {slaInfo.percent.toFixed(0)}%</span>
                </div>
                {slaInfo.urgedCount > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-1.5 text-[11px] text-danger">
                      <Bell size={12} />
                      <span>已被催办 <span className="font-bold">{slaInfo.urgedCount}</span> 次</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">催办对象：</span>
                      {urgeTarget ? (
                        <div className="flex items-center gap-1.5">
                          <div className="shrink-0 h-5 w-5 rounded-full overflow-hidden bg-white/5 border border-white/10">
                            {urgeTarget.avatar ? (
                              <img src={urgeTarget.avatar} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-[9px] text-white/50 font-medium">
                                {urgeTarget.name?.slice(0, 1) ?? '?'}
                              </div>
                            )}
                          </div>
                          <span className="text-[11px] text-white/70">{urgeTarget.name}</span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-white/30">待认领</span>
                      )}
                    </div>
                  </div>
                )}
                {t.status === 'processing' && (
                  <button
                    type="button"
                    onClick={handleUrge}
                    className="w-full min-h-10 mt-1 rounded-lg bg-danger/10 border border-danger/20 text-xs font-medium text-danger hover:bg-danger/15 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5"
                  >
                    <Bell size={12} />
                    发起催办
                  </button>
                )}
              </>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-white/40">完成时间</span>
                  <span className="text-xs font-medium text-white/80">
                    {slaInfo.completedInfo?.completedTime?.slice(5, 16) ?? t.createdAt.slice(5, 16)}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-white/40">完成状态</span>
                  {slaInfo.completedInfo?.overdueCompleted ? (
                    <span className="inline-flex items-center gap-1 rounded-md bg-danger/10 border border-danger/20 px-2 py-0.5 text-[11px] font-medium text-danger">
                      <AlertCircle size={12} />
                      超时完成
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-md bg-success/10 border border-success/20 px-2 py-0.5 text-[11px] font-medium text-success">
                      <CheckCircle size={12} />
                      按时完成
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-white/40">超时时长</span>
                  <span className={cn(
                    'text-xs font-medium',
                    slaInfo.completedInfo?.overdueCompleted ? 'text-danger' : 'text-white/40',
                  )}>
                    {slaInfo.completedInfo?.overdueCompleted
                      ? formatOverdueDuration(slaInfo.completedInfo.overdueSeconds)
                      : '-'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[11px] text-white/40">催办次数</span>
                  <span className={cn(
                    'text-xs font-medium',
                    slaInfo.urgedCount > 0 ? 'text-danger' : 'text-white/60',
                  )}>
                    {slaInfo.urgedCount} 次
                  </span>
                </div>
              </div>
            )}
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

        {(t.status === 'completed' || t.rootCause || t.evidences.length > 0) && (
          <div className="mt-5">
            <SectionTitle icon={<FileText size={14} />} title="处理详情" />
            <div className="rounded-xl bg-background-card border border-white/5 p-4 space-y-3">
              {t.rootCause && (
                <div>
                  <div className="text-[11px] font-medium text-white/40 mb-1.5">根因分析</div>
                  <p className="text-xs text-white/70 leading-relaxed">{t.rootCause}</p>
                </div>
              )}
              {t.resolution && (
                <div>
                  <div className="text-[11px] font-medium text-white/40 mb-1.5">解决方案</div>
                  <p className="text-xs text-white/70 leading-relaxed">{t.resolution}</p>
                </div>
              )}
              {t.evidences.length > 0 && (
                <div>
                  <div className="text-[11px] font-medium text-white/40 mb-2">证据截图</div>
                  <div className="grid grid-cols-3 gap-2">
                    {t.evidences.map((e, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPreviewImg(e)}
                        className="aspect-square rounded-lg bg-white/5 border border-white/5 overflow-hidden hover:ring-2 hover:ring-brand/50 transition-all duration-200"
                      >
                        {e.startsWith('http') || e.startsWith('data:') ? (
                          <img src={e} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full bg-gradient-to-br from-brand/20 to-white/5 flex items-center justify-center">
                            <ImgIcon size={20} className="text-white/30" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {t.status === 'completed' && (
          <div className="mt-5">
            <SectionTitle icon={<CheckCircle size={14} />} title="复盘信息" />
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              {!reviewEditing && t.reviewConclusion ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium text-white/70 border border-white/10">
                        责任分类
                      </span>
                      <span className="inline-flex items-center rounded-md bg-brand/10 px-2.5 py-1 text-[11px] text-brand border border-brand/20">
                        {RESPONSIBILITY_LABELS[t.reviewResponsibility ?? 'none']}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleStartEditReview}
                      className="inline-flex items-center gap-1 rounded-lg bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
                    >
                      <Pencil size={12} />
                      编辑
                    </button>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-white/40 mb-1.5">复盘结论</div>
                    <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{t.reviewConclusion}</p>
                  </div>
                  {t.reviewBy && t.reviewTime && (
                    <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                      <div className="shrink-0 h-5 w-5 rounded-full overflow-hidden bg-white/5 border border-white/10">
                        {t.reviewBy.avatar ? (
                          <img src={t.reviewBy.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[9px] text-white/50 font-medium">
                            {t.reviewBy.name?.slice(0, 1) ?? '?'}
                          </div>
                        )}
                      </div>
                      <span className="text-[10px] text-white/40">
                        by {t.reviewBy.name} · {t.reviewTime.slice(5, 16)}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <div className="text-[11px] font-medium text-white/40 mb-2">责任分类</div>
                    <div className="flex flex-wrap gap-1.5">
                      {RESPONSIBILITY_OPTIONS.map((opt) => {
                        const active = reviewResponsibility === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setReviewResponsibility(opt.key)}
                            className={cn(
                              'rounded-full border px-2.5 py-1 text-[11px] font-medium transition-all duration-200',
                              active
                                ? 'bg-brand/10 text-brand border-brand/20'
                                : 'bg-white/[0.03] text-white/40 border-white/10 hover:text-white/60 hover:border-white/20'
                            )}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] font-medium text-white/40 mb-1.5">复盘结论</div>
                    <textarea
                      value={reviewConclusion}
                      onChange={(e) => setReviewConclusion(e.target.value)}
                      rows={4}
                      placeholder="请填写复盘结论，经验或改进建议..."
                      className="w-full rounded-xl bg-[#0a0e20] border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none leading-relaxed"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleCancelReview}
                      className="flex-1 min-h-9 rounded-lg bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all duration-300"
                    >
                      取消
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReview}
                      className="flex-1 min-h-9 rounded-lg bg-gradient-to-r from-brand to-brand/80 text-xs font-semibold text-white shadow-lg shadow-brand/20 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
                    >
                      保存
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-5">
          <SectionTitle icon={<MessageSquare size={14} />} title={`评论 (${comments.length})`} />
          <div className="rounded-xl bg-background-card border border-white/5 overflow-hidden">
            <div className="border-b border-white/5 p-3">
              <div className="flex gap-2">
                <textarea
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={2}
                  placeholder="输入评论内容，Ctrl+Enter 发送..."
                  className="flex-1 rounded-lg bg-[#0a0e20] border border-white/5 p-2.5 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none leading-relaxed"
                />
                <button
                  type="button"
                  onClick={handleSendComment}
                  className="shrink-0 self-end h-9 px-3 rounded-lg bg-brand text-xs font-medium text-white hover:bg-brand/90 active:scale-[0.98] transition-all duration-200 flex items-center gap-1"
                >
                  <Send size={12} />
                  发送
                </button>
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="py-8 text-center text-xs text-white/30">
                  <MessageSquare size={24} className="mx-auto mb-2 text-white/20" />
                  暂无评论，快来添加第一条评论吧
                </div>
              ) : (
                <div className="divide-y divide-white/5">
                  {comments.map((c: TicketComment) => (
                    <div key={c.id} className="p-3 flex gap-2.5">
                      <div className="shrink-0 h-8 w-8 rounded-full overflow-hidden bg-white/5 border border-white/10">
                        {c.author?.avatar ? (
                          <img src={c.author.avatar} alt="" className="h-full w-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-[10px] text-white/50 font-medium">
                            {c.author?.name?.slice(0, 1) ?? '?'}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-white">{c.author?.name ?? '未知用户'}</span>
                          <span className="text-[10px] text-white/30">{c.createdAt.slice(5, 16)}</span>
                        </div>
                        <div className="text-xs text-white/70 leading-relaxed break-words">
                          {highlightMentions(c.content, c.mentions)}
                        </div>
                        {c.attachments && c.attachments.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            {c.attachments.map((att, ai) => (
                              <button
                                key={ai}
                                type="button"
                                onClick={() => setPreviewImg(att)}
                                className="aspect-square rounded-md bg-white/5 border border-white/5 overflow-hidden"
                              >
                                {att.startsWith('http') || att.startsWith('data:') ? (
                                  <img src={att} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center">
                                    <ImgIcon size={14} className="text-white/30" />
                                  </div>
                                )}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
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
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowReassignModal(true)}
                className="flex-1 min-h-12 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 hover:bg-white/10 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-1.5"
              >
                <UserCircle2 size={16} />
                转派
              </button>
              <button
                type="button"
                onClick={() => navigate(`/tickets/${t.id}/handle`)}
                className="flex-[1.5] min-h-12 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
              >
                填写处理结果
              </button>
            </div>
          )}
          {t.status === 'completed' && (
            <div className="flex items-center justify-center gap-2 min-h-12 rounded-xl bg-success/10 border border-success/20 text-sm font-medium text-success">
              工单已完成
            </div>
          )}
        </div>
      </div>

      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
          <div
            className="w-full max-w-md mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl bg-[#151a33] border border-white/10 shadow-2xl animate-slide-up overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div>
                <h3 className="text-sm font-semibold text-white">转派工单</h3>
                <p className="text-[11px] text-white/40 mt-0.5">选择新的处理人</p>
              </div>
              <button
                type="button"
                onClick={() => setShowReassignModal(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {reassignCandidates.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => handleReassign(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all duration-200 active:scale-[0.98]"
                >
                  <div className="shrink-0 h-10 w-10 rounded-full overflow-hidden bg-white/5 border border-white/10">
                    {user.avatar ? (
                      <img src={user.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-sm text-white/50 font-medium">
                        {user.name?.slice(0, 1) ?? '?'}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 text-left">
                    <div className="text-sm font-medium text-white">{user.name}</div>
                    <div className="text-[11px] text-white/40 mt-0.5">{user.department}</div>
                  </div>
                  <div className="shrink-0 text-[11px] text-brand/70 bg-brand/10 px-2 py-1 rounded-md border border-brand/20">
                    选择
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {previewImg && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewImg(null)}
        >
          <button
            type="button"
            onClick={() => setPreviewImg(null)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all duration-200 z-10"
          >
            <X size={18} />
          </button>
          <div
            className="max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImg}
              alt="预览"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
