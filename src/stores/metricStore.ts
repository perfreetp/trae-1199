import { create } from 'zustand';
import type { Metric, TrendPoint, DrillDownItem, TimeRange } from '../types';
import {
  mockMetrics,
  mockTrendData,
  mockDrillDownData,
  mockTimeRange,
} from '../data/mockData';

interface MetricState {
  metrics: Metric[];
  selectedDepartmentId: string;
  timeRange: TimeRange;
  selectedMetric: Metric | null;
  trendData: TrendPoint[];
  drillDownData: DrillDownItem[];
  setSelectedDepartment: (deptId: string) => void;
  setTimeRange: (range: TimeRange) => void;
  setSelectedMetric: (metric: Metric | null) => void;
  loadTrendData: (metricId: string) => void;
  loadDrillDownData: (metricId: string) => void;
  toggleFavorite: (metricId: string) => void;
  getFilteredMetrics: () => Metric[];
}

export const useMetricStore = create<MetricState>((set, get) => ({
  metrics: mockMetrics,
  selectedDepartmentId: 'd0',
  timeRange: mockTimeRange,
  selectedMetric: null,
  trendData: mockTrendData['m1'] || [],
  drillDownData: mockDrillDownData,

  setSelectedDepartment: (deptId) => set({ selectedDepartmentId: deptId }),

  setTimeRange: (range) => set({ timeRange: range }),

  setSelectedMetric: (metric) => set({ selectedMetric: metric }),

  loadTrendData: (metricId) => {
    const data = mockTrendData[metricId] || [];
    set({ trendData: data });
  },

  loadDrillDownData: (_metricId) => {
    set({ drillDownData: mockDrillDownData });
  },

  toggleFavorite: (metricId) =>
    set((state) => ({
      metrics: state.metrics.map((m) =>
        m.id === metricId ? { ...m, isFavorite: !m.isFavorite } : m
      ),
    })),

  getFilteredMetrics: () => {
    const { metrics, selectedDepartmentId } = get();
    if (selectedDepartmentId === 'd0') return metrics;
    return metrics.filter((m) => m.departmentId === selectedDepartmentId);
  },
}));
