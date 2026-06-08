import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import Empty from '@/components/Empty';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { cn } from '@/lib/utils';
import {
  Star,
  AlertTriangle,
  CheckSquare,
  RefreshCw,
  Download,
  Eye,
  HelpCircle,
  LogIn,
  Settings,
  SlidersHorizontal,
} from 'lucide-react';

type ChipKey = 'all' | 'metrics' | 'catalog' | 'tickets' | 'approval' | 'favorites';
type TimeKey = 'day' | 'week' | 'month' | 'all';

const chipLabels: Record<ChipKey, string> = {
  all: '全部',
  metrics: '指标',
  catalog: '口径',
  tickets: '工单',
  approval: '审批',
  favorites: '收藏',
};

const timeLabels: Record<TimeKey, string> = {
  day: '今日',
  week: '近7天',
  month: '近30天',
  all: '全部',
};

const typeIconMap: Record<string, { icon: React.ReactNode; bg: string; text: string }> = {
  收藏: { icon: <Star size={16} strokeWidth={2} fill="currentColor" />, bg: 'bg-warning/15', text: 'text-warning' },
  处理工单: { icon: <AlertTriangle size={16} strokeWidth={2} />, bg: 'bg-danger/15', text: 'text-danger' },
  订阅: { icon: <Settings size={16} strokeWidth={2} />, bg: 'bg-brand/15', text: 'text-brand' },
  更新阈值: { icon: <SlidersHorizontal size={16} strokeWidth={2} />, bg: 'bg-brand/15', text: 'text-brand' },
  提交申请: { icon: <RefreshCw size={16} strokeWidth={2} />, bg: 'bg-info/15', text: 'text-info' },
  审批: { icon: <CheckSquare size={16} strokeWidth={2} />, bg: 'bg-success/15', text: 'text-success' },
  下载: { icon: <Download size={16} strokeWidth={2} />, bg: 'bg-purple-500/15', text: 'text-purple-400' },
  查看: { icon: <Eye size={16} strokeWidth={2} />, bg: 'bg-white/10', text: 'text-white/60' },
  提问: { icon: <HelpCircle size={16} strokeWidth={2} />, bg: 'bg-orange-500/15', text: 'text-orange-400' },
  登录: { icon: <LogIn size={16} strokeWidth={2} />, bg: 'bg-success/15', text: 'text-success' },
};

const moduleFilterMap: Record<ChipKey, string[]> = {
  all: [],
  metrics: ['指标中心', '指标详情', '报表中心'],
  catalog: ['口径管理'],
  tickets: ['异常管理'],
  approval: ['口径管理'],
  favorites: ['指标中心', '告警中心'],
};

const typeFilterMap: Record<ChipKey, string[]> = {
  all: [],
  metrics: ['查看', '下载'],
  catalog: ['提交申请', '审批', '提问'],
  tickets: ['处理工单'],
  approval: ['审批'],
  favorites: ['收藏', '订阅', '更新阈值'],
};

export default function OperationRecords() {
  const { operationLogs } = useFavoriteStore();
  const [chip, setChip] = useState<ChipKey>('all');
  const [timeRange, setTimeRange] = useState<TimeKey>('week');

  const filteredLogs = useMemo(() => operationLogs.filter((log) => {
    const moduleOk = moduleFilterMap[chip].length === 0 || moduleFilterMap[chip].includes(log.module);
    const typeOk = typeFilterMap[chip].length === 0 || typeFilterMap[chip].some((t) => log.type.includes(t));
    return moduleOk || typeOk;
  }), [operationLogs, chip]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar title="操作记录" showBack actions={[]} />

      <div className="sticky top-14 z-30 glass border-b border-white/5">
        <div className="mx-auto max-w-md px-4 py-3 space-y-3">
          <div className="flex gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            {(Object.keys(chipLabels) as ChipKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setChip(k)}
                className={cn(
                  'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200 border',
                  chip === k
                    ? 'bg-brand text-white border-brand shadow-sm shadow-brand/20'
                    : 'bg-white/5 text-white/50 border-white/5 hover:text-white/80',
                )}
              >
                {chipLabels[k]}
              </button>
            ))}
          </div>
          <div className="flex gap-1 rounded-xl bg-white/5 p-1">
            {(Object.keys(timeLabels) as TimeKey[]).map((k) => (
              <button
                key={k}
                onClick={() => setTimeRange(k)}
                className={cn(
                  'flex-1 rounded-lg py-1.5 text-[11px] font-medium transition-all duration-200',
                  timeRange === k ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70',
                )}
              >
                {timeLabels[k]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-4 space-y-2">
        {filteredLogs.length === 0 ? (
          <Empty />
        ) : (
          filteredLogs.map((log) => {
            const iconCfg = typeIconMap[log.type] || {
              icon: <Eye size={16} strokeWidth={2} />,
              bg: 'bg-white/10',
              text: 'text-white/60',
            };
            return (
              <div
                key={log.id}
                className="flex gap-3 rounded-2xl bg-background-card border border-white/5 p-4 transition-all duration-200 hover:border-white/10"
              >
                <div className={cn('flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl', iconCfg.bg, iconCfg.text)}>
                  {iconCfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-xs font-medium text-white/80">{log.module}</span>
                        <span className="text-[10px] text-white/20">·</span>
                        <span className={cn('text-xs font-medium', iconCfg.text)}>{log.type}</span>
                      </div>
                      <p className="mt-1 text-sm text-white truncate">{log.targetName}</p>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-white/40 line-clamp-1">{log.detail}</p>
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-white/30">
                    <span>{log.createdAt}</span>
                    <span className="flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-white/20" />
                      IP 192.168.1.108
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}

        {filteredLogs.length > 0 && (
          <div className="py-4 text-center">
            <p className="text-xs text-white/30">已加载全部 {filteredLogs.length} 条记录</p>
          </div>
        )}
      </div>

      <BottomNav activeTab="favorites" />
    </div>
  );
}
