import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Bell, ClipboardList, CheckSquare, AlertTriangle } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { DepartmentFilter } from '@/components/DepartmentFilter';
import { TimeRangePicker, type TimeRange } from '@/components/TimeRangePicker';
import { MetricCard, type GradientPreset } from '@/components/MetricCard';
import { TrendChart, type TrendDataPoint } from '@/components/TrendChart';
import { BottomNav, type TabKey } from '@/components/BottomNav';
import { useMetricStore } from '@/stores/metricStore';
import { useTicketStore } from '@/stores/ticketStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import type { Department } from '@/types';
import { departments } from '@/data/mockData';

const gradients: GradientPreset[] = ['blue', 'green', 'orange', 'purple', 'red', 'blue'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabKey>('dashboard');
  const [trendTab, setTrendTab] = useState<'gmv' | 'compare'>('gmv');
  const [timeRange, setTimeRange] = useState<TimeRange>('day');

  const allMetrics = useMetricStore((s) => s.metrics);
  const selectedDepartmentId = useMetricStore((s) => s.selectedDepartmentId);
  const setSelectedDepartment = useMetricStore((s) => s.setSelectedDepartment);
  const trendData = useMetricStore((s) => s.trendData);
  const allTickets = useTicketStore((s) => s.tickets);
  const pendingList = useApprovalStore((s) => s.pendingList);
  const unreadCount = useSubscriptionStore((s) => s.unreadCount);

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
          <TimeRangePicker value={timeRange} onChange={setTimeRange} />
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
    </div>
  );
};

export default Dashboard;
