import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Star, Share2, Bell, BookOpen, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { TopBar, type TopBarAction } from '@/components/TopBar';
import { ActionSheet, type ActionSheetItem } from '@/components/ActionSheet';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { TimeRangePicker, type TimeRange } from '@/components/TimeRangePicker';
import { TrendChart, type TrendDataPoint } from '@/components/TrendChart';
import { useMetricStore } from '@/stores/metricStore';
import { useCatalogStore } from '@/stores/catalogStore';
import type { Metric, DrillDownItem, TrendPoint, User } from '@/types';
import { cn } from '@/lib/utils';

const useCountUp = (target: number, duration = 1200) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let startTime: number | null = null;
    let frameId: number;
    const animate = (timestamp: number) => {
      if (startTime === null) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameId);
  }, [target, duration]);
  return value;
};

const formatValue = (v: number, unit: string) => {
  if (unit === '元' || unit === 'PV') {
    if (v >= 100000000) return (v / 100000000).toFixed(2) + '亿';
    if (v >= 10000) return (v / 10000).toFixed(1) + '万';
  }
  if (v >= 10000 && (unit === '人' || unit === '单')) return (v / 10000).toFixed(1) + '万';
  return v.toFixed(unit === '%' || unit === '倍' ? 2 : 0);
};

const MetricDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [trendRange, setTrendRange] = useState<TimeRange>('day');
  const [drillTab, setDrillTab] = useState<'region' | 'channel' | 'product'>('region');

  const metrics = useMetricStore((s) => s.metrics);
  const trendData = useMetricStore((s) => s.trendData);
  const drillDownData = useMetricStore((s) => s.drillDownData);
  const toggleFavorite = useMetricStore((s) => s.toggleFavorite);
  const loadTrendData = useMetricStore((s) => s.loadTrendData);
  const catalogs = useCatalogStore((s) => s.catalogs);
  const setCurrentCatalog = useCatalogStore((s) => s.setCurrentCatalog);

  const metric = useMemo<Metric | undefined>(() => metrics.find((m) => m.id === id), [metrics, id]);
  const animatedValue = useCountUp(metric?.value ?? 0);

  const catalog = useMemo(() => metric ? catalogs.find((c) => c.metricId === metric.id) : undefined, [metric, catalogs]);
  const miniChartData = useMemo(() => metric ? metric.miniChart.map((v, i) => ({ label: String(i), value: v })) : [], [metric]);

  useEffect(() => {
    if (id) loadTrendData(id);
  }, [id, loadTrendData]);

  if (!metric) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-white/50">指标不存在</p>
      </div>
    );
  }

  const trendIcon = metric.trend === 'up' ? TrendingUp : metric.trend === 'down' ? TrendingDown : Minus;
  const TrendIcon = trendIcon;

  const ownerAvatars: AvatarItem[] = [
    { id: metric.owner.id, src: metric.owner.avatar, name: metric.owner.name },
    { id: 'u2', name: '李华', fallbackColor: 'bg-success' },
    { id: 'u3', name: '王芳', fallbackColor: 'bg-warning' },
  ];

  const chartData: TrendDataPoint[] = useMemo(() => {
    const rangeLen = trendRange === 'day' ? 14 : trendRange === 'week' ? 12 : 12;
    const step = trendRange === 'day' ? 1 : trendRange === 'week' ? 7 : 30;
    const arr: TrendPoint[] = [];
    for (let i = rangeLen - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i * step);
      const ds = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const base = metric.value / rangeLen;
      const v = base * (1 + (Math.sin(i * 0.7) * 0.15 + (i % 3 ? 0.05 : -0.03)));
      const cv = v * (0.92 + (i % 2 ? 0.03 : -0.02));
      arr.push({ date: ds, value: Math.round(v), compareValue: Math.round(cv) });
    }
    return arr.map((p) => ({ label: p.date, value: p.value, compareValue: p.compareValue }));
  }, [trendRange, metric.value]);

  const compareTable = useMemo(() => {
    const rows = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const base = metric.value / 30;
      const current = Math.round(base * (1 + (Math.sin(i * 1.1) * 0.2)));
      const lastYear = Math.round(current * (0.88 + (i % 2 ? 0.05 : -0.03)));
      const diff = current - lastYear;
      const pct = ((diff / lastYear) * 100).toFixed(1);
      rows.push({
        date: `${d.getMonth() + 1}月${d.getDate()}日`,
        current,
        lastYear,
        diff,
        pct,
        isUp: diff >= 0,
      });
    }
    return rows;
  }, [metric.value]);

  const drillItemsByDimension: Record<string, DrillDownItem[]> = useMemo(() => {
    const regionNames = ['华东区', '华南区', '华北区', '华中区', '西南区', '西北区', '东北区'];
    const channelNames = ['官方商城', '天猫旗舰店', '京东自营', '线下门店', '抖音小店', '拼多多', '分销渠道'];
    const productNames = ['手机数码', '家用电器', '服装鞋帽', '美妆个护', '食品生鲜', '家居用品', '母婴玩具'];
    const buildDrill = (names: string[]) => {
      const weights = names.map(() => 0.5 + Math.random());
      const sum = weights.reduce((a, b) => a + b, 0);
      return names.map((n, idx) => {
        const pct = Math.round((weights[idx] / sum) * 1000) / 10;
        const val = Math.round((metric.value * pct) / 100);
        const cr = Math.round((Math.random() * 30 - 10) * 10) / 10;
        return { dimension: drillTab, name: n, value: val, percentage: pct, changeRate: cr } as DrillDownItem;
      }).sort((a, b) => b.value - a.value);
    };
    return {
      region: buildDrill(regionNames),
      channel: buildDrill(channelNames),
      product: buildDrill(productNames),
    };
  }, [metric.value, drillTab]);

  const currentDrillItems = drillItemsByDimension[drillTab] || [];

  const actionSheetItems: ActionSheetItem[] = [
    { id: 'favorite', label: metric.isFavorite ? '取消收藏' : '收藏', icon: <Star size={18} strokeWidth={2} className={metric.isFavorite ? 'text-warning fill-warning' : ''} /> },
    { id: 'share', label: '分享', icon: <Share2 size={18} strokeWidth={2} /> },
    { id: 'subscribe', label: '订阅', icon: <Bell size={18} strokeWidth={2} /> },
    { id: 'catalog', label: '查看口径', icon: <BookOpen size={18} strokeWidth={2} />, description: catalog ? `${catalog.metricName} ${catalog.version}` : '暂无口径信息' },
  ];

  const handleAction = (action: ActionSheetItem) => {
    if (action.id === 'favorite') toggleFavorite(metric.id);
    if (action.id === 'catalog' && catalog) {
      setCurrentCatalog(catalog);
      navigate(`/catalog/${catalog.id}`);
    }
  };

  const handleTopBarAction = (action: TopBarAction) => {
    if (action === 'more') setShowActionSheet(true);
  };

  return (
    <div className="min-h-screen bg-background pb-8">
      <TopBar
        title={metric.name}
        showBack
        onBack={() => navigate(-1)}
        actions={['more']}
        onAction={handleTopBarAction}
      />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand/15 via-background-card to-background-card p-5 border border-white/5">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-white/40">{metric.code}</p>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="text-4xl font-bold tracking-tight text-white">
                  {formatValue(animatedValue, metric.unit)}
                </span>
                <span className="text-sm font-medium text-white/50">{metric.unit}</span>
              </div>
              <p className="mt-1 text-sm font-semibold text-white">{metric.name}</p>
            </div>
            <div
              className={cn(
                'flex items-center gap-1 rounded-full px-3 py-1.5',
                metric.trend === 'up' ? 'bg-success/15 text-success' :
                metric.trend === 'down' ? 'bg-danger/15 text-danger' : 'bg-white/5 text-white/50'
              )}
            >
              <TrendIcon size={18} strokeWidth={2} />
              <span className="text-sm font-bold">
                {metric.trend === 'flat' ? '' : metric.trend === 'up' ? '+' : ''}
                {metric.changeRate.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="mt-4 h-14">
            <TrendChart
              data={miniChartData}
              type="area"
              color={metric.trend === 'down' ? '#FF4D4F' : '#1E5EFF'}
              height={56}
              showGrid={false}
            />
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-white/5 pt-3">
            <div className="flex items-center gap-2">
              <p className="text-xs text-white/40">负责人</p>
              <AvatarGroup avatars={ownerAvatars} max={3} size="sm" />
            </div>
            <p className="text-[10px] text-white/30">更新于 {metric.updatedAt.slice(5, 16)}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          {[
            { icon: Star, label: metric.isFavorite ? '已收藏' : '收藏', active: metric.isFavorite, onClick: () => toggleFavorite(metric.id) },
            { icon: Share2, label: '分享', onClick: () => setShowActionSheet(true) },
            { icon: Bell, label: '订阅', onClick: () => setShowActionSheet(true) },
            { icon: BookOpen, label: '口径', onClick: () => catalog && navigate(`/catalog/${catalog.id}`) },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className={cn(
                'flex flex-col items-center gap-1 rounded-xl bg-background-card py-3 transition-all duration-300 hover:bg-white/5 active:scale-95',
                item.active && 'text-warning'
              )}
            >
              <div className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full',
                item.active ? 'bg-warning/15' : 'bg-white/5'
              )}>
                <item.icon size={18} strokeWidth={2} className={item.active ? 'text-warning fill-warning' : 'text-white/70'} />
              </div>
              <span className="text-[11px] text-white/60">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-white">趋势分析</p>
            <TimeRangePicker value={trendRange} onChange={setTrendRange} />
          </div>
          <div className="mt-3 rounded-xl bg-background-card p-4">
            <TrendChart
              data={chartData}
              type="area"
              showCompare
              color="#1E5EFF"
              compareColor="#00C48C"
              height={220}
              formatValue={(v) => {
                if (metric.unit === '元') return `¥${(v / 10000).toFixed(0)}万`;
                if (v >= 10000) return `${(v / 10000).toFixed(1)}万`;
                return String(v);
              }}
            />
          </div>
        </div>

        <div className="mt-6">
          <p className="text-sm font-semibold text-white mb-3">同期对比（近7天）</p>
          <div className="rounded-xl bg-background-card overflow-hidden">
            <div className="grid grid-cols-5 bg-white/5 px-3 py-2 text-[11px] text-white/40 font-medium">
              <span>日期</span>
              <span className="text-right">当前值</span>
              <span className="text-right">去年同期</span>
              <span className="text-right">差值</span>
              <span className="text-right">差异</span>
            </div>
            {compareTable.map((row, idx) => (
              <div key={idx} className={cn('grid grid-cols-5 px-3 py-2.5 text-xs', idx !== compareTable.length - 1 && 'border-b border-white/5')}>
                <span className="text-white/70">{row.date}</span>
                <span className="text-right text-white font-medium">{formatValue(row.current, metric.unit)}</span>
                <span className="text-right text-white/50">{formatValue(row.lastYear, metric.unit)}</span>
                <span className={cn('text-right font-medium', row.isUp ? 'text-success' : 'text-danger')}>
                  {row.isUp ? '+' : ''}{formatValue(row.diff, metric.unit)}
                </span>
                <span className={cn('text-right font-semibold', row.isUp ? 'text-success' : 'text-danger')}>
                  {row.isUp ? '+' : ''}{row.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-1 rounded-xl bg-background-card p-1">
            {([
              { k: 'region', l: '地区' },
              { k: 'channel', l: '渠道' },
              { k: 'product', l: '产品' },
            ] as const).map((tab) => (
              <button
                key={tab.k}
                onClick={() => setDrillTab(tab.k)}
                className={cn(
                  'flex-1 min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300',
                  drillTab === tab.k ? 'bg-brand text-white shadow-md shadow-brand/20' : 'text-white/50 hover:text-white/80'
                )}
              >
                {tab.l}
              </button>
            ))}
          </div>

          <div className="mt-3 rounded-xl bg-background-card divide-y divide-white/5 overflow-hidden">
            {currentDrillItems.slice(0, 7).map((item, idx) => (
              <div key={idx} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">{item.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{formatValue(item.value, metric.unit)}</span>
                    <span className={cn(
                      'text-xs font-medium',
                      item.changeRate >= 0 ? 'text-success' : 'text-danger'
                    )}>
                      {item.changeRate >= 0 ? '+' : ''}{item.changeRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-brand to-brand-400"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-white/40 w-10 text-right">{item.percentage.toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {catalog && (
          <div className="mt-6 mb-8">
            <p className="text-sm font-semibold text-white mb-3">相关口径</p>
            <div
              onClick={() => { setCurrentCatalog(catalog); navigate(`/catalog/${catalog.id}`); }}
              className="cursor-pointer rounded-xl bg-background-card p-4 transition-all duration-300 hover:bg-white/5 active:scale-[0.99]"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{catalog.metricName}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/15 text-brand">{catalog.version}</span>
                    <span className={cn(
                      'text-[10px] px-2 py-0.5 rounded-full',
                      catalog.status === 'published' ? 'bg-success/15 text-success' :
                      catalog.status === 'draft' ? 'bg-warning/15 text-warning' : 'bg-white/10 text-white/40'
                    )}>
                      {catalog.status === 'published' ? '已发布' : catalog.status === 'draft' ? '草稿' : '已废弃'}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/50 line-clamp-2">{catalog.definition}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-[10px] text-white/30">负责人：{catalog.owner.name}</span>
                    <span className="text-[10px] text-white/30">更新：{catalog.updatedAt.slice(5, 10)}</span>
                  </div>
                </div>
                <ChevronRight size={18} strokeWidth={2} className="text-white/30 shrink-0" />
              </div>
            </div>
          </div>
        )}
      </div>

      <ActionSheet
        open={showActionSheet}
        onClose={() => setShowActionSheet(false)}
        title={metric.name}
        items={actionSheetItems}
        onSelect={handleAction}
      />
    </div>
  );
};

export default MetricDetail;
