import React, { useState, useMemo } from 'react';
import { TopBar } from '@/components/TopBar';
import { BottomNav } from '@/components/BottomNav';
import { MetricCard } from '@/components/MetricCard';
import Empty from '@/components/Empty';
import { useUserStore } from '@/stores/userStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useMetricStore } from '@/stores/metricStore';
import { cn } from '@/lib/utils';
import {
  Star,
  History,
  AlertTriangle,
  CheckSquare,
  Settings,
  ChevronRight,
  Bell,
} from 'lucide-react';

const shortcuts = [
  { key: 'favorites', label: '我的收藏', icon: Star, color: 'text-warning bg-warning/15' },
  { key: 'records', label: '操作记录', icon: History, color: 'text-brand bg-brand/15' },
  { key: 'tickets', label: '异常工单', icon: AlertTriangle, color: 'text-danger bg-danger/15' },
  { key: 'approval', label: '审批中心', icon: CheckSquare, color: 'text-success bg-success/15' },
];

const gradientMap: Record<string, 'blue' | 'green' | 'orange' | 'purple' | 'red'> = {
  '#1E5EFF': 'blue',
  '#00C48C': 'green',
  '#FF6F3C': 'orange',
  '#FF9F1C': 'orange',
  '#B14AFF': 'purple',
};

export default function FavoritesPage() {
  const { currentUser } = useUserStore();
  const { categories, removeFromCategory } = useFavoriteStore();
  const { metrics } = useMetricStore();
  const [activeCat, setActiveCat] = useState<string>(categories[0]?.id || '');
  const [showCatModal, setShowCatModal] = useState(false);

  const activeCategory = useMemo(() => categories.find((c) => c.id === activeCat), [categories, activeCat]);
  const categoryMetrics = useMemo(() => {
    const gradient = gradientMap[activeCategory?.color || '#1E5EFF'] || 'blue';
    return metrics.filter((m) => activeCategory?.metricIds.includes(m.id)).map((m) => ({
      ...m,
      sparklineData: m.miniChart.map((v) => ({ value: v })),
      gradient,
    }));
  }, [metrics, activeCategory]);
  const sortedCategories = useMemo(() => [...categories].sort((a, b) => a.order - b.order), [categories]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <TopBar
        title="我的"
        showBack={false}
        actions={[]}
      />

      <div className="mx-auto max-w-md px-4 py-4 space-y-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand/25 via-brand/10 to-brand/5 border border-brand/20 p-5">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={currentUser?.avatar}
                alt={currentUser?.name}
                className="h-16 w-16 rounded-2xl border-2 border-brand/30 bg-white/10"
              />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-success border-2 border-background-card">
                <span className="h-2 w-2 rounded-full bg-white" />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-white">{currentUser?.name || '未登录'}</h2>
                <span className="inline-flex items-center rounded-md bg-brand/20 px-2 py-0.5 text-[11px] font-medium text-brand">
                  业务负责人
                </span>
              </div>
              <p className="mt-1 text-xs text-white/60">{currentUser?.department || '—'}</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Bell size={12} strokeWidth={2} />
                  <span>12 条通知</span>
                </div>
                <button className="flex items-center gap-1 text-xs text-brand hover:text-brand-400 transition-all">
                  <Settings size={12} strokeWidth={2} />
                  设置
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-background-card border border-white/5 p-4">
          <div className="grid grid-cols-4 gap-2">
            {shortcuts.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.key}
                  className="flex flex-col items-center gap-2 rounded-xl p-3 transition-all hover:bg-white/5 active:scale-95"
                >
                  <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl', s.color)}>
                    <Icon size={22} strokeWidth={2} />
                  </div>
                  <span className="text-[11px] font-medium text-white/70">{s.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">我的收藏</h3>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1 text-xs text-brand hover:text-brand-400 transition-all"
            >
              <Settings size={12} strokeWidth={2} />
              分类管理
            </button>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
            {sortedCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCat(cat.id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-all duration-200 border',
                  activeCat === cat.id
                    ? 'text-white border-transparent shadow-lg'
                    : 'text-white/50 bg-white/5 border-white/5 hover:text-white/80',
                )}
                style={activeCat === cat.id ? { backgroundColor: cat.color, boxShadow: `0 4px 12px ${cat.color}33` } : {}}
              >
                <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cat.color }} />
                {cat.name}
                <span className={cn('text-[10px]', activeCat === cat.id ? 'text-white/70' : 'text-white/30')}>
                  {cat.metricIds.length}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {categoryMetrics.length === 0 ? (
            <div className="col-span-2">
              <Empty />
            </div>
          ) : (
            categoryMetrics.map((m) => (
              <div key={m.id} className="relative group">
                <MetricCard
                  title={m.name}
                  value={m.value.toLocaleString()}
                  unit={m.unit}
                  changeRate={m.changeRate}
                  trend={m.trend}
                  gradient={m.gradient}
                  sparklineData={m.sparklineData}
                />
                <button
                  onClick={() => removeFromCategory(activeCat, m.id)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex h-7 w-7 items-center justify-center rounded-lg bg-danger/90 text-white shadow-lg"
                >
                  <Star size={13} strokeWidth={2.5} fill="currentColor" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md rounded-t-3xl bg-background-card border-t border-white/10 p-4 animate-slide-up max-h-[70vh] overflow-y-auto">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/10" />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-white">分类管理</h3>
              <button
                onClick={() => setShowCatModal(false)}
                className="text-xs text-brand hover:text-brand-400 transition-all"
              >
                完成
              </button>
            </div>
            <div className="space-y-2">
              {sortedCategories.map((cat, idx) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl bg-white/5 p-3 border border-white/5"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg text-white/70"
                    style={{ backgroundColor: `${cat.color}20` }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">{cat.name}</p>
                    <p className="text-[11px] text-white/40">{cat.metricIds.length} 个指标</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-white/40">
                    <span>#{idx + 1}</span>
                    <ChevronRight size={14} strokeWidth={2} />
                  </div>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-dashed border-white/10 p-3 text-xs text-white/40 hover:border-brand/30 hover:text-brand transition-all">
                <span className="text-base leading-none">+</span>
                新增分类
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav activeTab="favorites" />
    </div>
  );
}
