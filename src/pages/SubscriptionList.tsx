import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { StatusBadge } from '@/components/StatusBadge';
import Empty from '@/components/Empty';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import {
  Plus,
  Bell,
  AlertTriangle,
  CheckSquare,
  RefreshCw,
  Smartphone,
  Mail,
  MessageSquare,
  Edit3,
  Trash2,
  ChevronRight,
} from 'lucide-react';

type TabKey = 'subscriptions' | 'records';
type NotificationType = 'anomaly' | 'threshold' | 'approval' | 'revision';

const notificationIcon: Record<NotificationType, { icon: React.ReactNode; bg: string }> = {
  anomaly: { icon: <AlertTriangle size={18} strokeWidth={2} />, bg: 'bg-danger/15 text-danger' },
  threshold: { icon: <Bell size={18} strokeWidth={2} />, bg: 'bg-warning/15 text-warning' },
  approval: { icon: <CheckSquare size={18} strokeWidth={2} />, bg: 'bg-success/15 text-success' },
  revision: { icon: <RefreshCw size={18} strokeWidth={2} />, bg: 'bg-brand/15 text-brand' },
};

const channelIcons = {
  app: <Smartphone size={14} strokeWidth={2} />,
  email: <Mail size={14} strokeWidth={2} />,
  sms: <MessageSquare size={14} strokeWidth={2} />,
  wechat: <span className="text-[10px] font-bold">微</span>,
};

export default function SubscriptionList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<TabKey>('subscriptions');
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const { subscriptions, notifications, unreadCount, toggleSubscription, removeSubscription, markAsRead, markAllAsRead } =
    useSubscriptionStore();

  const getThresholdDesc = (sub: typeof subscriptions[0]) => {
    const t = sub.thresholds[0];
    if (!t) return '未设置阈值';
    const levelText = t.level === 'critical' ? '紧急' : '普通';
    if (t.type === 'change_rate') {
      const dir = t.value > 0 ? '上涨' : '下跌';
      return `${sub.metricName}${dir}超${Math.abs(t.value)}%触发（${levelText}）`;
    }
    const dir = t.type === 'above' ? '高于' : '低于';
    return `${sub.metricName}${dir}${t.value}触发（${levelText}）`;
  };

  const handleToggle = (subId: string, currentEnabled: boolean) => {
    toggleSubscription(subId);
    const sub = subscriptions.find((s) => s.id === subId);
    if (sub) {
      addOperationLog(currentEnabled ? '停用' : '启用', '订阅规则', sub.metricName, '切换订阅启用状态');
      showToast(currentEnabled ? '订阅已停用' : '订阅已启用', 'success');
    }
  };

  const handleDelete = (subId: string) => {
    const sub = subscriptions.find((s) => s.id === subId);
    removeSubscription(subId);
    if (sub) {
      addOperationLog('删除', '订阅规则', sub.metricName, '删除订阅规则');
      showToast('订阅已删除', 'success');
    }
  };

  const handleEdit = (subId: string) => {
    navigate(`/subscriptions/new?id=${subId}`);
  };

  const handleMarkAllRead = () => {
    markAllAsRead();
    addOperationLog('标记已读', '通知中心', '全部通知', '标记所有通知为已读');
    showToast('已全部标记为已读', 'success');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title="订阅提醒"
        showBack
        actions={[]}
        className=""
      />

      <div className="sticky top-14 z-30 glass border-b border-white/5">
        <div className="mx-auto max-w-md px-4">
          <div className="flex items-center gap-1 py-2">
            {(['subscriptions', 'records'] as TabKey[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  'flex-1 rounded-xl py-2.5 text-sm font-medium transition-all duration-300',
                  tab === t ? 'bg-brand text-white shadow-lg shadow-brand/20' : 'text-white/50 hover:text-white/80',
                )}
              >
                {t === 'subscriptions' ? '我的订阅' : `通知记录${unreadCount > 0 ? ` (${unreadCount})` : ''}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {tab === 'subscriptions' ? (
        <div className="mx-auto max-w-md px-4 py-4 space-y-3">
          {subscriptions.length === 0 ? (
            <Empty />
          ) : (
            subscriptions.map((sub) => (
              <div
                key={sub.id}
                className={cn(
                  'rounded-2xl p-4 transition-all duration-300',
                  'bg-background-card border border-white/5',
                  !sub.enabled && 'opacity-60',
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-white truncate">{sub.metricName}</h3>
                      <StatusBadge
                        status={sub.enabled ? 'success' : 'pending'}
                        text={sub.enabled ? '已启用' : '已停用'}
                        size="sm"
                        showIcon={false}
                      />
                    </div>
                    <p className="text-xs text-white/60">{getThresholdDesc(sub)}</p>
                  </div>
                  <button
                    onClick={() => handleToggle(sub.id, sub.enabled)}
                    className={cn(
                      'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out',
                      sub.enabled ? 'bg-brand' : 'bg-white/10',
                    )}
                  >
                    <span
                      className={cn(
                        'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                        sub.enabled ? 'translate-x-5' : 'translate-x-0',
                      )}
                    />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {(['app', 'email', 'sms', 'wechat'] as const).map((ch) => (
                      <div
                        key={ch}
                        className={cn(
                          'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
                          sub.notifyChannels.includes(ch)
                            ? 'bg-brand/15 text-brand'
                            : 'bg-white/5 text-white/20',
                        )}
                      >
                        {channelIcons[ch]}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(sub.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-white/5 hover:text-brand transition-all"
                    >
                      <Edit3 size={15} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => handleDelete(sub.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-danger/10 hover:text-danger transition-all"
                    >
                      <Trash2 size={15} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mx-auto max-w-md">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-xs text-white/50">
              共 {notifications.length} 条，未读 {unreadCount} 条
            </span>
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="text-xs text-brand hover:text-brand-400 disabled:text-white/30 disabled:cursor-not-allowed transition-all"
            >
              全部标记已读
            </button>
          </div>
          <div className="px-4 space-y-2 pb-4">
            {notifications.length === 0 ? (
              <Empty />
            ) : (
              notifications.map((n) => {
                const cfg = notificationIcon[n.type as NotificationType];
                return (
                  <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={cn(
                      'relative flex gap-3 rounded-2xl p-4 cursor-pointer transition-all duration-300',
                      'bg-background-card border border-white/5 hover:border-white/10',
                    )}
                  >
                    <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', cfg.bg)}>
                      {cfg.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-white truncate">{n.title}</h4>
                        {!n.isRead && <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand" />}
                      </div>
                      <p className="mt-1 text-xs text-white/50 line-clamp-2">{n.content}</p>
                      <p className="mt-1.5 text-[11px] text-white/30">{n.createdAt}</p>
                    </div>
                    <ChevronRight size={16} strokeWidth={2} className="flex-shrink-0 text-white/20 self-center" />
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {tab === 'subscriptions' && (
        <button
          onClick={() => navigate('/subscriptions/new')}
          className="fixed right-4 bottom-28 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-brand text-white shadow-lg shadow-brand/30 hover:scale-105 active:scale-95 transition-all"
        >
          <Plus size={22} strokeWidth={2.5} />
        </button>
      )}

      <BottomNav activeTab="favorites" />
    </div>
  );
}
