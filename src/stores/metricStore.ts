import { create } from 'zustand';
import type { Metric, TrendPoint, DrillDownItem, TimeRange } from '../types';
import {
  mockMetrics,
  mockTrendData,
  mockDrillDownData,
  mockTimeRange,
} from '../data/mockData';
import { loadPersist, savePersist } from './persist';

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

const storedMetrics = loadPersist<Metric[]>('metrics', mockMetrics);
const storedDeptId = loadPersist<string>('selectedDeptId', 'd0');
const storedTimeRange = loadPersist<TimeRange>('timeRange', mockTimeRange);

export const useMetricStore = create<MetricState>((set, get) => ({
  metrics: storedMetrics,
  selectedDepartmentId: storedDeptId,
  timeRange: storedTimeRange,
  selectedMetric: null,
  trendData: mockTrendData['m1'] || [],
  drillDownData: mockDrillDownData,

  setSelectedDepartment: (deptId) => {
    set({ selectedDepartmentId: deptId });
    savePersist('selectedDeptId', deptId);
  },

  setTimeRange: (range) => {
    set({ timeRange: range });
    savePersist('timeRange', range);
  },

  setSelectedMetric: (metric) => set({ selectedMetric: metric }),

  loadTrendData: (metricId) => {
    const data = mockTrendData[metricId] || [];
    set({ trendData: data });
  },

  loadDrillDownData: (_metricId) => {
    set({ drillDownData: mockDrillDownData });
  },

  toggleFavorite: (metricId) => {
    set((state) => {
      const newMetrics = state.metrics.map((m) =>
        m.id === metricId ? { ...m, isFavorite: !m.isFavorite } : m
      );
      savePersist('metrics', newMetrics);
      return { metrics: newMetrics };
    });
  },

  getFilteredMetrics: () => {
    const { metrics, selectedDepartmentId } = get();
    if (selectedDepartmentId === 'd0') return metrics;
    return metrics.filter((m) => m.departmentId === selectedDepartmentId);
  },
}));
