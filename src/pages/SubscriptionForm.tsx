import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useMetricStore } from '@/stores/metricStore';
import { cn } from '@/lib/utils';
import {
  ChevronDown,
  Smartphone,
  Mail,
  MessageSquare,
} from 'lucide-react';
import type { Threshold } from '@/types';

type ConditionType = 'above' | 'below' | 'change_rate';
type LevelType = 'warning' | 'critical';
type ChannelType = 'app' | 'email' | 'sms' | 'wechat';

const conditionLabels: Record<ConditionType, string> = {
  above: '高于阈值',
  below: '低于阈值',
  change_rate: '变化率',
};

const levelLabels: Record<LevelType, string> = {
  warning: '普通',
  critical: '紧急',
};

const channelOptions: { key: ChannelType; label: string; icon: React.ReactNode }[] = [
  { key: 'app', label: 'App推送', icon: <Smartphone size={16} strokeWidth={2} /> },
  { key: 'email', label: '邮件', icon: <Mail size={16} strokeWidth={2} /> },
  { key: 'sms', label: '短信', icon: <MessageSquare size={16} strokeWidth={2} /> },
  { key: 'wechat', label: '企业微信', icon: <span className="text-xs font-bold">微</span> },
];

export default function SubscriptionForm() {
  const isEdit = false;
  const { addSubscription } = useSubscriptionStore();
  const { metrics } = useMetricStore();

  const [metricId, setMetricId] = useState<string>('');
  const [condition, setCondition] = useState<ConditionType>('below');
  const [thresholdValue, setThresholdValue] = useState<string>('');
  const [level, setLevel] = useState<LevelType>('warning');
  const [channels, setChannels] = useState<ChannelType[]>(['app']);
  const [remark, setRemark] = useState<string>('');
  const [showMetricPicker, setShowMetricPicker] = useState(false);

  const selectedMetric = useMemo(() => metrics.find((m) => m.id === metricId), [metrics, metricId]);

  const toggleChannel = (ch: ChannelType) => {
    setChannels((prev) =>
      prev.includes(ch) ? prev.filter((c) => c !== ch) : [...prev, ch],
    );
  };

  const handleSubmit = () => {
    if (!metricId || !thresholdValue) return;
    const threshold: Threshold = {
      type: condition,
      value: parseFloat(thresholdValue),
      level,
    };
    addSubscription({
      metricId,
      metricName: selectedMetric?.name || '',
      thresholds: [threshold],
      notifyChannels: channels,
      enabled: true,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <TopBar title={isEdit ? '编辑订阅' : '新增订阅'} showBack actions={[]} />

      <div className="mx-auto max-w-md px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <label className="block text-xs font-medium text-white/50 mb-2">选择指标</label>
          <button
            onClick={() => setShowMetricPicker(!showMetricPicker)}
            className="w-full flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-left transition-all hover:bg-white/10"
          >
            <span className={cn('text-sm', selectedMetric ? 'text-white' : 'text-white/30')}>
              {selectedMetric ? selectedMetric.name : '请选择要订阅的指标'}
            </span>
            <ChevronDown
              size={18}
              strokeWidth={2}
              className={cn('text-white/30 transition-transform', showMetricPicker && 'rotate-180')}
            />
          </button>
          {showMetricPicker && (
            <div className="mt-2 max-h-60 overflow-y-auto rounded-xl bg-white/5 scrollbar-hide">
              {metrics.map((m) => (
                <button
                  key={m.id}
                  onClick={() => {
                    setMetricId(m.id);
                    setShowMetricPicker(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-4 py-3 text-left text-sm transition-all border-b border-white/5 last:border-0',
                    metricId === m.id ? 'bg-brand/10 text-brand' : 'text-white/70 hover:bg-white/5',
                  )}
                >
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-xs text-white/40 mt-0.5">{m.code}</p>
                  </div>
                  <span className="text-xs text-white/40">{m.unit}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">告警条件</label>
            <div className="flex gap-1 rounded-xl bg-white/5 p-1">
              {(['above', 'below', 'change_rate'] as ConditionType[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setCondition(c)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200',
                    condition === c ? 'bg-brand text-white shadow-sm' : 'text-white/50 hover:text-white/80',
                  )}
                >
                  {conditionLabels[c]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">
              阈值数值
              {selectedMetric && <span className="text-white/30 ml-1">（{selectedMetric.unit}）</span>}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={thresholdValue}
                onChange={(e) => setThresholdValue(e.target.value)}
                placeholder={condition === 'change_rate' ? '如: 10 表示 ±10%' : '请输入阈值'}
                className="flex-1 rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand/40 transition-all"
              />
              {condition === 'change_rate' && (
                <span className="text-sm text-white/40 px-2">%</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 mb-2">告警级别</label>
            <div className="flex gap-1 rounded-xl bg-white/5 p-1">
              {(['warning', 'critical'] as LevelType[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLevel(l)}
                  className={cn(
                    'flex-1 rounded-lg py-2 text-xs font-medium transition-all duration-200',
                    level === l
                      ? l === 'critical'
                        ? 'bg-danger text-white shadow-sm'
                        : 'bg-warning text-background shadow-sm'
                      : 'text-white/50 hover:text-white/80',
                  )}
                >
                  {levelLabels[l]}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <label className="block text-xs font-medium text-white/50 mb-3">通知渠道</label>
          <div className="grid grid-cols-2 gap-2">
            {channelOptions.map((opt) => {
              const active = channels.includes(opt.key);
              return (
                <button
                  key={opt.key}
                  onClick={() => toggleChannel(opt.key)}
                  className={cn(
                    'flex items-center gap-2 rounded-xl p-3 text-left transition-all duration-200 border',
                    active
                      ? 'bg-brand/10 border-brand/30 text-brand'
                      : 'bg-white/5 border-white/5 text-white/50 hover:border-white/10',
                  )}
                >
                  <div
                    className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-lg transition-all',
                      active ? 'bg-brand/20' : 'bg-white/5',
                    )}
                  >
                    {opt.icon}
                  </div>
                  <span className="text-sm font-medium">{opt.label}</span>
                  <div
                    className={cn(
                      'ml-auto h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all',
                      active ? 'border-brand bg-brand' : 'border-white/20',
                    )}
                  >
                    {active && (
                      <svg className="h-3 w-3 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                        <path d="M5 12l5 5L20 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <label className="block text-xs font-medium text-white/50 mb-2">备注说明（可选）</label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="添加订阅备注，方便后续管理"
            rows={3}
            className="w-full rounded-xl bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/20 outline-none focus:ring-2 focus:ring-brand/40 resize-none transition-all"
          />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/5 glass pb-safe">
        <div className="mx-auto max-w-md px-4 py-3">
          <button
            onClick={handleSubmit}
            disabled={!metricId || !thresholdValue}
            className="w-full rounded-xl bg-brand py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all hover:bg-brand-600 active:scale-[0.98] disabled:bg-white/10 disabled:text-white/30 disabled:shadow-none disabled:cursor-not-allowed"
          >
            {isEdit ? '保存修改' : '创建订阅'}
          </button>
        </div>
      </div>

      <BottomNav activeTab="favorites" />
    </div>
  );
}
