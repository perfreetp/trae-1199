import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Bell, ClipboardList, CheckSquare, AlertTriangle, Share2, Copy, Check, X, Calendar, Building2 } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { DepartmentFilter } from '@/components/DepartmentFilter';
import { TimeRangePicker } from '@/components/TimeRangePicker';
import type { TimeRange } from '@/types';
import { MetricCard, type GradientPreset } from '@/components/MetricCard';
import { TrendChart, type TrendDataPoint } from '@/components/TrendChart';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { useMetricStore } from '@/stores/metricStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useUIStore } from '@/stores/uiStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import type { Department } from '@/types';
import { departments } from '@/data/mockData';

const gradients: GradientPreset[] = ['blue', 'green', 'orange', 'purple', 'red', 'blue'];

const metricGradientColors: Record<string, [string, string]> = {
  blue: ['#1E5EFF', '#5B8DEF'],
  green: ['#00C48C', '#34D399'],
  orange: ['#FF7D00', '#FFB266'],
  purple: ['#8B5CF6', '#A78BFA'],
  red: ['#EF4444', '#F87171'],
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [trendTab, setTrendTab] = useState<'gmv' | 'compare'>('gmv');
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();

  const allMetrics = useMetricStore((s) => s.metrics);
  const selectedDepartmentId = useMetricStore((s) => s.selectedDepartmentId);
  const setSelectedDepartment = useMetricStore((s) => s.setSelectedDepartment);
  const storeTimeRange = useMetricStore((s) => s.timeRange);
  const setStoreTimeRange = useMetricStore((s) => s.setTimeRange);
  const trendData = useMetricStore((s) => s.trendData);
  const allTickets = useTicketStore((s) => s.tickets);
  const pendingList = useApprovalStore((s) => s.pendingList);
  const unreadCount = useSubscriptionStore((s) => s.unreadCount);

  const [timeRange, setTimeRangeLocal] = useState<TimeRange>(storeTimeRange);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showShareCard, setShowShareCard] = useState(false);
  const cardPreviewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const deptParam = searchParams.get('dept');
    const rangeParam = searchParams.get('range') as TimeRange | null;
    const validRanges: TimeRange[] = ['day', 'week', 'month', 'quarter', 'year'];
    if (deptParam) setSelectedDepartment(deptParam);
    if (rangeParam && validRanges.includes(rangeParam)) {
      setStoreTimeRange(rangeParam);
      setTimeRangeLocal(rangeParam);
    }
  }, []);

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRangeLocal(range);
    setStoreTimeRange(range);
  };

  const buildShareUrl = () => {
    const params = new URLSearchParams();
    params.set('dept', selectedDepartmentId);
    params.set('range', timeRange);
    return `${window.location.origin}/dashboard?${params.toString()}`;
  };

  const handleShare = () => {
    setShowShareCard(true);
  };

  const handleCopyLink = async () => {
    try {
      const deptName = departments.find((d) => d.id === selectedDepartmentId)?.name ?? '全公司';
      const rangeText: Record<TimeRange, string> = {
        day: '今日', week: '本周', month: '本月', quarter: '本季度', year: '本年',
      };
      const shareUrl = buildShareUrl();
      await navigator.clipboard.writeText(shareUrl);
      setCopySuccess(true);
      addOperationLog('分享', '首页看板', `${deptName} - ${rangeText[timeRange]}`, shareUrl);
      showToast('看板链接已复制到剪贴板', 'success');
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      showToast('复制失败，请手动复制', 'warning');
    }
  };

  const formatDateMMDD = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${m}/${dd}`;
  };

  const handleSaveImage = () => {
    const deptName = departments.find((d) => d.id === selectedDepartmentId)?.name ?? '全公司';
    const rangeText: Record<TimeRange, string> = {
      day: '今日', week: '本周', month: '本月', quarter: '本季度', year: '本年',
    };
    const top3 = metrics.slice(0, 3);
    const pendingTickets = allTickets.filter((t) => t.status === 'pending').length;
    const approvalsCount = pendingList.length;
    const noticeCount = unreadCount;
    const dateStr = formatDateMMDD();

    const canvas = document.createElement('canvas');
    const dpr = window.devicePixelRatio || 2;
    const W = 560;
    const H = 760;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    canvas.style.width = `${W}px`;
    canvas.style.height = `${H}px`;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);

    const bgGrad = ctx.createLinearGradient(0, 0, W, H);
    bgGrad.addColorStop(0, '#0F1326');
    bgGrad.addColorStop(0.5, '#151A38');
    bgGrad.addColorStop(1, '#1A1F45');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.arc(W * 0.85, 80, 180, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(60, H - 100, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.92;
    ctx.font = 'bold 28px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'top';
    ctx.fillText('分享看板', 40, 40);

    ctx.globalAlpha = 0.7;
    ctx.font = '14px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    let tx = 40;
    const ty = 92;

    ctx.fillStyle = '#1E5EFF';
    ctx.fillRect(tx, ty + 4, 4, 16);
    tx += 14;

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.85;
    ctx.fillText(deptName, tx, ty);
    tx += ctx.measureText(deptName).width + 18;

    ctx.fillStyle = '#00C48C';
    ctx.fillRect(tx, ty + 4, 4, 16);
    tx += 14;

    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 0.85;
    ctx.fillText(rangeText[timeRange], tx, ty);
    tx += ctx.measureText(rangeText[timeRange]).width + 18;

    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.globalAlpha = 1;
    const calText = dateStr;
    ctx.fillText(calText, tx, ty);

    ctx.globalAlpha = 1;
    const cardY = 150;
    const cardH = 320;
    const cardX = 40;
    const cardW = W - 80;
    const cardR = 20;

    ctx.beginPath();
    ctx.moveTo(cardX + cardR, cardY);
    ctx.lineTo(cardX + cardW - cardR, cardY);
    ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + cardR);
    ctx.lineTo(cardX + cardW, cardY + cardH - cardR);
    ctx.quadraticCurveTo(cardX + cardW, cardY + cardH, cardX + cardW - cardR, cardY + cardH);
    ctx.lineTo(cardX + cardR, cardY + cardH);
    ctx.quadraticCurveTo(cardX, cardY + cardH, cardX, cardY + cardH - cardR);
    ctx.lineTo(cardX, cardY + cardR);
    ctx.quadraticCurveTo(cardX, cardY, cardX + cardR, cardY);
    ctx.closePath();

    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, 'rgba(30, 94, 255, 0.18)');
    cardGrad.addColorStop(0.5, 'rgba(255,255,255,0.06)');
    cardGrad.addColorStop(1, 'rgba(139, 92, 246, 0.18)');
    ctx.fillStyle = cardGrad;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();

    const metricGradients: [string, string][] = [
      ['#1E5EFF', '#5B8DEF'],
      ['#00C48C', '#34D399'],
      ['#FF7D00', '#FFB266'],
    ];

    for (let i = 0; i < 3; i++) {
      const m = top3[i];
      const mx = cardX + 24;
      const my = cardY + 24 + i * 96;
      const mw = cardW - 48;
      const mh = 80;
      const mr = 14;

      ctx.beginPath();
      ctx.moveTo(mx + mr, my);
      ctx.lineTo(mx + mw - mr, my);
      ctx.quadraticCurveTo(mx + mw, my, mx + mw, my + mr);
      ctx.lineTo(mx + mw, my + mh - mr);
      ctx.quadraticCurveTo(mx + mw, my + mh, mx + mw - mr, my + mh);
      ctx.lineTo(mx + mr, my + mh);
      ctx.quadraticCurveTo(mx, my + mh, mx, my + mh - mr);
      ctx.lineTo(mx, my + mr);
      ctx.quadraticCurveTo(mx, my, mx + mr, my);
      ctx.closePath();

      const [c1, c2] = metricGradients[i % metricGradients.length];
      const mg = ctx.createLinearGradient(mx, my, mx + mw, my + mh);
      mg.addColorStop(0, `${c1}26`);
      mg.addColorStop(1, `${c2}14`);
      ctx.fillStyle = mg;
      ctx.fill();
      ctx.strokeStyle = `${c1}40`;
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.fillStyle = c1;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(mx + 28, my + mh / 2, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textBaseline = 'middle';
      const valueText = m ? m.value.toLocaleString() : '0';
      ctx.fillText(valueText, mx + 60, my + mh / 2 - 10);

      ctx.fillStyle = 'rgba(255,255,255,0.65)';
      ctx.font = '12px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      const nameText = m ? m.name : '-';
      const unitText = m ? m.unit : '';
      ctx.fillText(`${nameText} ${unitText}`, mx + 60, my + mh / 2 + 14);

      if (m) {
        const isUp = m.changeRate >= 0;
        ctx.fillStyle = isUp ? '#00C48C' : '#EF4444';
        ctx.font = 'bold 12px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
        const rateText = `${isUp ? '+' : ''}${m.changeRate.toFixed(1)}%`;
        const rateW = ctx.measureText(rateText).width;
        ctx.fillText(rateText, mx + mw - rateW - 18, my + mh / 2);
      }
    }

    const summaryY = cardY + cardH + 28;
    const items = [
      { icon: 'ticket', label: '待处理工单', value: pendingTickets, color: '#EF4444' },
      { icon: 'approval', label: '待审批', value: approvalsCount, color: '#FFAB00' },
      { icon: 'notice', label: '未读通知', value: noticeCount, color: '#1E5EFF' },
    ];
    const itemW = (W - 80) / 3;

    items.forEach((it, i) => {
      const ix = 40 + i * itemW + itemW / 2;
      const iy = summaryY + 22;

      ctx.fillStyle = `${it.color}22`;
      ctx.beginPath();
      ctx.arc(ix, iy, 22, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = it.color;
      ctx.beginPath();
      ctx.arc(ix, iy, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#FFFFFF';
      ctx.globalAlpha = 1;
      ctx.font = 'bold 11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (it.icon === 'ticket') ctx.fillText('!', ix, iy);
      else if (it.icon === 'approval') ctx.fillText('✓', ix, iy);
      else ctx.fillText('•', ix, iy);
      ctx.textAlign = 'left';

      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(String(it.value), ix, summaryY + 56);
      ctx.textAlign = 'left';

      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '11px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(it.label, ix, summaryY + 82);
      ctx.textAlign = 'left';
    });

    const footerY = H - 64;
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.beginPath();
    ctx.moveTo(40, footerY - 20);
    ctx.lineTo(W - 40, footerY - 20);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.font = '13px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('数据中台 · 智能看板', 40, footerY);

    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.font = '12px -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(dateStr, W - 40, footerY);
    ctx.textAlign = 'left';

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.download = 'dashboard-share.png';
      a.href = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('预览图已保存', 'success');
    } catch {
      showToast('保存预览图失败', 'warning');
    }
  };

  const ticketCounts = useMemo(() => {
    const pending = allTickets.filter((t) => t.status === 'pending').length;
    const processing = allTickets.filter((t) => t.status === 'processing').length;
    const completed = allTickets.filter((t) => t.status === 'completed').length;
    return { pending, processing, completed };
  }, [allTickets]);

  const metrics = useMemo(() => {
    if (selectedDepartmentId === 'd0') return allMetrics;
    return allMetrics.filter((m) => m.departmentId === selectedDepartmentId);
  }, [allMetrics, selectedDepartmentId]);

  const deptOptions = useMemo(() => {
    return departments.map((d: Department) => ({
      id: d.id,
      name: d.name,
      count: d.id === 'd0' ? undefined : metrics.filter((m) => m.departmentId === d.id).length,
    }));
  }, [departments, metrics]);

  const gmvChartData: TrendDataPoint[] = useMemo(() => {
    return trendData.slice(-14).map((p) => ({
      label: p.date,
      value: p.value,
      compareValue: p.compareValue,
    }));
  }, [trendData]);

  const compareChartData: TrendDataPoint[] = useMemo(() => {
    const topMetrics = metrics.slice(0, 4);
    return trendData.slice(-7).map((p, idx) => {
      const point: TrendDataPoint = { label: p.date, value: p.value };
      topMetrics.forEach((m, i) => {
        point[`m${i + 1}`] = Math.round(m.value * (0.9 + (idx + 1) * 0.015 + (i % 2 ? 0.02 : -0.01)));
      });
      return point;
    });
  }, [metrics, trendData]);

  const displayMetrics = useMemo(() => {
    return metrics.slice(0, 6).map((metric, idx) => ({
      ...metric,
      sparklineData: metric.miniChart.map((v) => ({ value: v })),
      gradient: gradients[idx % gradients.length],
    }));
  }, [metrics]);

  const deptName = departments.find((d) => d.id === selectedDepartmentId)?.name ?? '全公司';
  const rangeText: Record<TimeRange, string> = {
    day: '今日', week: '本周', month: '本月', quarter: '本季度', year: '本年',
  };
  const top3Metrics = displayMetrics.slice(0, 3);
  const currentDateStr = formatDateMMDD();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center gap-3">
          <div className="flex-1" onClick={() => navigate('/search')}>
            <SearchBar
              placeholder="搜索指标、口径、工单..."
              onSubmit={() => navigate('/search')}
            />
          </div>
          <button
            onClick={handleShare}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-background-card transition-all duration-300 hover:bg-white/5 active:scale-95"
          >
            <Share2 size={20} strokeWidth={2} className="text-white/70" />
          </button>
          <div className="relative">
            <button className="flex h-11 w-11 items-center justify-center rounded-full bg-background-card transition-all duration-300 hover:bg-white/5 active:scale-95">
              <Bell size={20} strokeWidth={2} className="text-white/70" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="ml-2 -mt-10">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand-600 text-sm font-bold text-white">
                张
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-xs text-white/40">下午好</p>
          <h1 className="mt-1 text-xl font-bold text-white">张伟 👋</h1>
          <p className="mt-1 text-xs text-white/50">今天有 {ticketCounts.pending} 个异常工单需要处理</p>
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2.5">
          <div
            onClick={() => { setActiveTab('tickets'); navigate('/tickets'); }}
            className="cursor-pointer rounded-xl bg-background-card p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger/15">
              <AlertTriangle size={16} className="text-danger" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{ticketCounts.pending}</p>
            <p className="mt-0.5 text-[11px] text-white/40">异常工单</p>
          </div>
          <div
            onClick={() => { setActiveTab('approval'); navigate('/approvals'); }}
            className="cursor-pointer rounded-xl bg-background-card p-3 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/15">
              <CheckSquare size={16} className="text-warning" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{pendingList.length}</p>
            <p className="mt-0.5 text-[11px] text-white/40">待审批</p>
          </div>
          <div className="rounded-xl bg-background-card p-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/15">
              <ClipboardList size={16} className="text-brand" />
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{unreadCount}</p>
            <p className="mt-0.5 text-[11px] text-white/40">今日通知</p>
          </div>
        </div>

        <div className="mt-5">
          <DepartmentFilter
            options={deptOptions}
            activeId={selectedDepartmentId}
            onChange={setSelectedDepartment}
          />
        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">核心指标</p>
          <TimeRangePicker value={timeRange} onChange={handleTimeRangeChange} />
        </div>

        <div className="mt-3 grid grid-cols-2 gap-3">
          {displayMetrics.map((metric) => (
            <MetricCard
              key={metric.id}
              title={metric.name}
              value={metric.value.toLocaleString()}
              unit={metric.unit}
              changeRate={metric.changeRate}
              trend={metric.trend}
              sparklineData={metric.sparklineData}
              gradient={metric.gradient}
              onClick={() => navigate(`/metric/${metric.id}`)}
            />
          ))}
        </div>

        <div className="mt-6">
          <div className="flex items-center gap-1 rounded-xl bg-background-card p-1">
            {(['gmv', 'compare'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setTrendTab(tab)}
                className={`flex-1 min-h-9 rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300 ${
                  trendTab === tab
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-white/50 hover:text-white/80'
                }`}
              >
                {tab === 'gmv' ? 'GMV走势' : '核心指标对比'}
              </button>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-background-card p-4">
            {trendTab === 'gmv' ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">月度销售额走势</p>
                  <p className="text-xs text-white/40">近14天</p>
                </div>
                <TrendChart
                  data={gmvChartData}
                  type="area"
                  showCompare
                  color="#1E5EFF"
                  compareColor="#00C48C"
                  height={200}
                  formatValue={(v) => `¥${(v / 10000).toFixed(0)}万`}
                />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-white">核心指标对比</p>
                  <div className="flex items-center gap-2">
                    {metrics.slice(0, 4).map((m, i) => (
                      <div key={m.id} className="flex items-center gap-1">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: ['#1E5EFF', '#00C48C', '#FFAB00', '#8B5CF6'][i] }}
                        />
                        <span className="text-[10px] text-white/40">{m.name.slice(0, 4)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <TrendChart
                  data={compareChartData}
                  type="line"
                  valueKey="m1"
                  color="#1E5EFF"
                  height={200}
                  formatValue={(v) => v >= 10000 ? `${(v / 10000).toFixed(0)}万` : String(v)}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <BottomNav
        activeTab={activeTab}
        onTabChange={(key) => {
          setActiveTab(key);
          const routes: Record<TabKey, string> = {
            dashboard: '/dashboard',
            catalog: '/catalog',
            tickets: '/tickets',
            approval: '/approvals',
            favorites: '/favorites',
          };
          navigate(routes[key]);
        }}
      />

      {showShareCard && (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowShareCard(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-t-3xl bg-[#0F1326]/95 backdrop-blur-xl border-t border-white/10 px-5 pb-8 pt-5 shadow-2xl animate-[slideUp_0.3s_ease-out]">
            <div className="absolute left-1/2 top-2 h-1 w-10 -translate-x-1/2 rounded-full bg-white/15" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">分享看板</h2>
              <button
                onClick={() => setShowShareCard(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5 transition-all hover:bg-white/10 active:scale-95"
              >
                <X size={18} className="text-white/70" />
              </button>
            </div>

            <div className="mt-5 flex justify-center">
              <div
                ref={cardPreviewRef}
                className="relative overflow-hidden rounded-2xl p-5"
                style={{
                  width: '280px',
                  background: 'linear-gradient(135deg, #0F1326 0%, #151A38 50%, #1A1F45 100%)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <div
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-20"
                  style={{ background: 'radial-gradient(circle, #1E5EFF 0%, transparent 70%)' }}
                />
                <div
                  className="absolute -bottom-20 -left-10 h-40 w-40 rounded-full opacity-15"
                  style={{ background: 'radial-gradient(circle, #8B5CF6 0%, transparent 70%)' }}
                />

                <div className="relative flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1.5 rounded-md bg-blue-500/15 px-2 py-1">
                    <Building2 size={11} className="text-blue-400" />
                    <span className="font-medium text-white/80">{deptName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-1">
                    <Calendar size={11} className="text-emerald-400" />
                    <span className="font-medium text-white/80">{rangeText[timeRange]}</span>
                  </div>
                </div>

                <div className="relative mt-4 space-y-2.5">
                  {top3Metrics.map((metric, idx) => {
                    const [c1, c2] = metricGradientColors[metric.gradient] || ['#1E5EFF', '#5B8DEF'];
                    return (
                      <div
                        key={metric.id}
                        className="flex items-center gap-3 rounded-xl p-2.5"
                        style={{
                          background: `linear-gradient(135deg, ${c1}22 0%, ${c2}0D 100%)`,
                          border: `1px solid ${c1}33`,
                        }}
                      >
                        <div
                          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full"
                          style={{
                            background: `linear-gradient(135deg, ${c1} 0%, ${c2} 100%)`,
                            boxShadow: `0 2px 8px ${c1}40`,
                          }}
                        >
                          <span className="text-[10px] font-bold text-white">{idx + 1}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline gap-1">
                            <span className="text-base font-bold text-white">
                              {metric.value.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-white/50">{metric.unit}</span>
                          </div>
                          <p className="truncate text-[10px] text-white/50">{metric.name}</p>
                        </div>
                        <span
                          className={`flex-shrink-0 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
                            metric.changeRate >= 0
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-red-500/15 text-red-400'
                          }`}
                        >
                          {metric.changeRate >= 0 ? '+' : ''}
                          {metric.changeRate.toFixed(1)}%
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  {[
                    { icon: AlertTriangle, label: '待处理工单', value: ticketCounts.pending, color: '#EF4444' },
                    { icon: CheckSquare, label: '待审批', value: pendingList.length, color: '#FFAB00' },
                    { icon: Bell, label: '未读通知', value: unreadCount, color: '#1E5EFF' },
                  ].map((it, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center rounded-xl bg-white/[0.04] p-2"
                      style={{ border: `1px solid ${it.color}15` }}
                    >
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-full"
                        style={{ backgroundColor: `${it.color}20` }}
                      >
                        <it.icon size={13} style={{ color: it.color }} />
                      </div>
                      <span className="mt-1 text-sm font-bold text-white">{it.value}</span>
                      <span className="text-[9px] text-white/40">{it.label}</span>
                    </div>
                  ))}
                </div>

                <div className="relative mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                  <span className="text-[11px] font-medium text-white/60">数据中台 · 智能看板</span>
                  <span className="text-[10px] text-white/40">{currentDateStr}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleCopyLink}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-white/5 text-sm font-medium text-white/80 transition-all duration-300 hover:bg-white/10 active:scale-[0.98] border border-white/10"
              >
                {copySuccess ? (
                  <>
                    <Check size={16} className="text-emerald-400" />
                    <span className="text-emerald-400">已复制</span>
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    <span>复制链接</span>
                  </>
                )}
              </button>
              <button
                onClick={handleSaveImage}
                className="flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand to-brand-600 text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all duration-300 hover:shadow-brand/40 active:scale-[0.98]"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                <span>保存预览图</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
