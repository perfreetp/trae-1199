import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, FileText, ClipboardList, ChevronRight, AlertTriangle, Clock } from 'lucide-react';
import { SearchBar } from '@/components/SearchBar';
import { EmptyState } from '@/components/EmptyState';
import { useMetricStore } from '@/stores/metricStore';
import { useCatalogStore } from '@/stores/catalogStore';
import { useTicketStore } from '@/stores/ticketStore';
import type { Metric, MetricCatalog, AnomalyTicket } from '@/types';
import { cn } from '@/lib/utils';

type SearchTab = 'metric' | 'catalog' | 'ticket';

const tabConfig: Record<SearchTab, { label: string; icon: React.ReactNode; emptyType: 'search' | 'data' }> = {
  metric: { label: '指标', icon: <TrendingUp size={16} strokeWidth={2} />, emptyType: 'search' },
  catalog: { label: '口径', icon: <FileText size={16} strokeWidth={2} />, emptyType: 'search' },
  ticket: { label: '工单', icon: <ClipboardList size={16} strokeWidth={2} />, emptyType: 'search' },
};

const hotKeywords = ['GMV', '订单量', '异常工单', '用户数', '转化率', '复购率', 'ROI', '利润率'];

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [keyword, setKeyword] = useState('');
  const [activeTab, setActiveTab] = useState<SearchTab>('metric');
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('search_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const metrics = useMetricStore((s) => s.metrics);
  const catalogs = useCatalogStore((s) => s.catalogs);
  const tickets = useTicketStore((s) => s.tickets);
  const setSelectedMetric = useMetricStore((s) => s.setSelectedMetric);
  const setCurrentCatalog = useCatalogStore((s) => s.setCurrentCatalog);
  const setCurrentTicket = useTicketStore((s) => s.setCurrentTicket);

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const saveHistory = (kw: string) => {
    const trimmed = kw.trim();
    if (!trimmed) return;
    const newHistory = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, 10);
    setHistory(newHistory);
    try {
      localStorage.setItem('search_history', JSON.stringify(newHistory));
    } catch {}
  };

  const clearHistory = () => {
    setHistory([]);
    try {
      localStorage.removeItem('search_history');
    } catch {}
  };

  const handleSubmit = (value: string) => {
    if (value.trim()) {
      saveHistory(value);
    }
  };

  const handleTagClick = (tag: string) => {
    setKeyword(tag);
    saveHistory(tag);
  };

  const matchedMetrics = useMemo<Metric[]>(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return metrics.filter(
      (m) =>
        m.name.toLowerCase().includes(kw) ||
        m.code.toLowerCase().includes(kw) ||
        m.description.toLowerCase().includes(kw) ||
        m.categories.some((c) => c.toLowerCase().includes(kw))
    );
  }, [metrics, keyword]);

  const matchedCatalogs = useMemo<MetricCatalog[]>(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return catalogs.filter(
      (c) =>
        c.metricName.toLowerCase().includes(kw) ||
        c.definition.toLowerCase().includes(kw) ||
        c.formula.toLowerCase().includes(kw) ||
        c.dimensions.some((d) => d.toLowerCase().includes(kw))
    );
  }, [catalogs, keyword]);

  const matchedTickets = useMemo<AnomalyTicket[]>(() => {
    const kw = keyword.trim().toLowerCase();
    if (!kw) return [];
    return tickets.filter(
      (t) =>
        t.title.toLowerCase().includes(kw) ||
        t.metricName.toLowerCase().includes(kw) ||
        t.description.toLowerCase().includes(kw)
    );
  }, [tickets, keyword]);

  const hasSearched = keyword.trim().length > 0;
  const resultCounts = {
    metric: matchedMetrics.length,
    catalog: matchedCatalogs.length,
    ticket: matchedTickets.length,
  };

  const handleMetricClick = (m: Metric) => {
    setSelectedMetric(m);
    navigate(`/metric/${m.id}`);
  };

  const handleCatalogClick = (c: MetricCatalog) => {
    setCurrentCatalog(c);
    navigate(`/catalog/${c.id}`);
  };

  const handleTicketClick = (t: AnomalyTicket) => {
    setCurrentTicket(t);
    navigate(`/tickets/${t.id}`);
  };

  const renderEmpty = () => {
    if (!hasSearched) {
      return (
        <div className="mt-10">
          {history.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <Clock size={14} strokeWidth={2} className="text-white/30" />
                  <span className="text-xs font-medium text-white/50">搜索历史</span>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-xs text-white/30 hover:text-white/50 transition-colors"
                >
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h) => (
                  <button
                    key={h}
                    onClick={() => handleTagClick(h)}
                    className="rounded-full bg-background-card px-3 py-1.5 text-xs text-white/60 transition-all duration-300 hover:bg-white/5 hover:text-white active:scale-95"
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <AlertTriangle size={14} strokeWidth={2} className="text-warning/70" />
              <span className="text-xs font-medium text-white/50">热门搜索</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {hotKeywords.map((kw, idx) => (
                <button
                  key={kw}
                  onClick={() => handleTagClick(kw)}
                  className={cn(
                    'rounded-full px-3 py-1.5 text-xs transition-all duration-300 hover:scale-105 active:scale-95',
                    idx < 3
                      ? 'bg-brand/15 text-brand hover:bg-brand/25'
                      : 'bg-background-card text-white/60 hover:bg-white/5 hover:text-white'
                  )}
                >
                  {idx < 3 && <span className="mr-1 text-[10px] opacity-70">{idx + 1}</span>}
                  {kw}
                </button>
              ))}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="mt-10">
        <EmptyState
          type={tabConfig[activeTab].emptyType}
          title={`未找到相关${tabConfig[activeTab].label}`}
          description={`没有找到与"${keyword}"匹配的${tabConfig[activeTab].label}，请尝试其他关键词`}
        />
      </div>
    );
  };

  const currentList =
    activeTab === 'metric' ? matchedMetrics : activeTab === 'catalog' ? matchedCatalogs : matchedTickets;
  const hasResults = hasSearched && currentList.length > 0;

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="sticky top-0 z-40 bg-background/90 backdrop-blur-md px-4 pt-3 pb-3 border-b border-white/5">
        <SearchBar
          value={keyword}
          onChange={setKeyword}
          onSubmit={handleSubmit}
          placeholder="搜索指标、口径、工单..."
          className=""
        />
      </div>

      <div className="mx-auto max-w-md px-4 pt-4">
        {hasSearched && (
          <div className="flex items-center gap-1 rounded-xl bg-background-card p-1 mb-4">
            {(Object.keys(tabConfig) as SearchTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'flex-1 min-h-9 rounded-lg px-2 py-1.5 text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5',
                  activeTab === tab
                    ? 'bg-brand text-white shadow-md shadow-brand/20'
                    : 'text-white/50 hover:text-white/80'
                )}
              >
                {tabConfig[tab].icon}
                <span>{tabConfig[tab].label}</span>
                {resultCounts[tab] > 0 && (
                  <span className={cn(
                    'rounded-full px-1.5 py-0.5 text-[10px]',
                    activeTab === tab ? 'bg-white/20' : 'bg-white/5 text-white/40'
                  )}>
                    {resultCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {hasSearched && (
          <p className="text-[11px] text-white/40 mb-3">
            共找到 <span className="text-white/70 font-medium">{currentList.length}</span> 条相关结果
            {keyword && ` (关键词：${keyword})`}
          </p>
        )}

        {!hasResults && renderEmpty()}

        {hasResults && activeTab === 'metric' && (
          <div className="space-y-2.5">
            {matchedMetrics.map((m) => (
              <div
                key={m.id}
                onClick={() => handleMetricClick(m)}
                className="cursor-pointer rounded-xl bg-background-card p-4 transition-all duration-300 hover:bg-white/5 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{m.name}</span>
                      <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40 font-medium">
                        {m.code}
                      </span>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="text-xl font-bold text-white">
                        {m.value.toLocaleString()}
                      </span>
                      <span className="text-xs text-white/40">{m.unit}</span>
                      <span
                        className={cn(
                          'ml-2 text-xs font-semibold',
                          m.trend === 'up' ? 'text-success' : m.trend === 'down' ? 'text-danger' : 'text-white/40'
                        )}
                      >
                        {m.trend === 'up' ? '+' : ''}
                        {m.changeRate.toFixed(1)}%
                      </span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-white/40 line-clamp-1">{m.description}</p>
                    <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                      {m.categories.slice(0, 3).map((c) => (
                        <span
                          key={c}
                          className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/40"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} className="text-white/20 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasResults && activeTab === 'catalog' && (
          <div className="space-y-2.5">
            {matchedCatalogs.map((c) => (
              <div
                key={c.id}
                onClick={() => handleCatalogClick(c)}
                className="cursor-pointer rounded-xl bg-background-card p-4 transition-all duration-300 hover:bg-white/5 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold text-white">{c.metricName}</span>
                      <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] text-brand">
                        {c.version}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px]',
                        c.status === 'published' ? 'bg-success/15 text-success' :
                        c.status === 'draft' ? 'bg-warning/15 text-warning' : 'bg-white/10 text-white/40'
                      )}>
                        {c.status === 'published' ? '已发布' : c.status === 'draft' ? '草稿' : '已废弃'}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-white/50 line-clamp-2">{c.definition}</p>
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-white/30">负责人：{c.owner.name}</span>
                      <span className="text-[10px] text-white/30">维度：{c.dimensions.slice(0, 3).join('、')}</span>
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} className="text-white/20 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}

        {hasResults && activeTab === 'ticket' && (
          <div className="space-y-2.5">
            {matchedTickets.map((t) => (
              <div
                key={t.id}
                onClick={() => handleTicketClick(t)}
                className="cursor-pointer rounded-xl bg-background-card p-4 transition-all duration-300 hover:bg-white/5 active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          'text-xs font-semibold',
                          t.level === 'critical' ? 'text-danger' :
                          t.level === 'high' ? 'text-warning' :
                          t.level === 'medium' ? 'text-info' : 'text-white/50'
                        )}
                      >
                        {t.level === 'critical' ? '🔴 紧急' : t.level === 'high' ? '🟠 高' : t.level === 'medium' ? '🔵 中' : '⚪ 低'}
                      </span>
                      <span className={cn(
                        'rounded-full px-2 py-0.5 text-[10px]',
                        t.status === 'pending' ? 'bg-warning/15 text-warning' :
                        t.status === 'processing' ? 'bg-brand/15 text-brand' : 'bg-success/15 text-success'
                      )}>
                        {t.status === 'pending' ? '待处理' : t.status === 'processing' ? '处理中' : '已完成'}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-white line-clamp-1">{t.title}</p>
                    <p className="mt-1 text-[11px] text-white/40 line-clamp-2">{t.description}</p>
                    <div className="mt-2 flex items-center gap-3">
                      <span className="text-[10px] text-white/30">指标：{t.metricName}</span>
                      <span className="text-[10px] text-white/30">部门：{t.departmentId}</span>
                      <span className="text-[10px] text-white/30">
                        {t.createdAt.slice(5, 16)}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={2} className="text-white/20 shrink-0 mt-1" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchPage;
