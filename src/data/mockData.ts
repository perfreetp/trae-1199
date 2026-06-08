import type {
  User,
  Department,
  Metric,
  TrendPoint,
  DrillDownItem,
  MetricCatalog,
  RevisionRecord,
  CatalogQuestion,
  RevisionRequest,
  TimeRange,
  AnomalyTicket,
  Subscription,
  Notification,
  FavoriteCategory,
  OperationLog,
  Threshold,
  ApprovalNode,
  TicketTimeline,
} from '@/types';

// ============ Part 1: 用户/部门/指标 ============

const _users: User[] = [
  { id: 'u1', name: '张明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang', role: 'manager', department: '销售部' },
  { id: 'u2', name: '李华', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=li', role: 'admin', department: '数据中心' },
  { id: 'u3', name: '王芳', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang', role: 'analyst', department: '市场部' },
  { id: 'u4', name: '赵强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao', role: 'manager', department: '运营部' },
  { id: 'u5', name: '孙丽', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sun', role: 'analyst', department: '产品部' },
];

export const users: User[] = _users;
export const currentUser: User = _users[0];

export const departments: Department[] = [
  { id: 'd0', name: '全部', order: 0 },
  { id: 'd1', name: '销售部', parentId: 'd0', order: 1 },
  { id: 'd2', name: '市场部', parentId: 'd0', order: 2 },
  { id: 'd3', name: '运营部', parentId: 'd0', order: 3 },
  { id: 'd4', name: '产品部', parentId: 'd0', order: 4 },
  { id: 'd5', name: '技术部', parentId: 'd0', order: 5 },
  { id: 'd6', name: '财务部', parentId: 'd0', order: 6 },
];

export const metrics: Metric[] = [
  { id: 'm1', name: '月度销售额', code: 'GMV_MONTHLY', value: 12586420, unit: '元', trend: 'up', changeRate: 12.5, changeType: 'mom', departmentId: 'd1', departmentName: '销售部', owner: _users[0], updatedAt: '2026-06-09 10:00:00', description: '当月累计销售总额（GMV），含线上电商、线下门店、分销渠道', isFavorite: true, miniChart: [9800000, 10200000, 10800000, 11200000, 11500000, 12000000, 12586420], categories: ['营收', '核心指标', 'GMV'] },
  { id: 'm2', name: '订单量', code: 'ORDER_COUNT', value: 58620, unit: '单', trend: 'up', changeRate: 9.2, changeType: 'yoy', departmentId: 'd1', departmentName: '销售部', owner: _users[0], updatedAt: '2026-06-09 09:55:00', description: '当月有效订单总数，剔除已取消和已退款订单', isFavorite: true, miniChart: [50200, 51500, 52800, 54000, 55500, 57000, 58620], categories: ['营收', '订单'] },
  { id: 'm3', name: '用户数', code: 'TOTAL_USERS', value: 2586320, unit: '人', trend: 'up', changeRate: 4.8, changeType: 'yoy', departmentId: 'd3', departmentName: '运营部', owner: _users[3], updatedAt: '2026-06-09 09:30:00', description: '平台累计注册用户总数（去重）', isFavorite: true, miniChart: [2460000, 2485000, 2500000, 2520000, 2545000, 2565000, 2586320], categories: ['用户', '核心指标'] },
  { id: 'm4', name: '转化率', code: 'ORDER_CONVERSION', value: 3.82, unit: '%', trend: 'down', changeRate: -2.1, changeType: 'mom', departmentId: 'd2', departmentName: '市场部', owner: _users[2], updatedAt: '2026-06-09 09:00:00', description: '访客到下单用户的整体转化率', isFavorite: false, miniChart: [4.05, 4.02, 3.96, 3.95, 3.88, 3.85, 3.82], categories: ['转化', '运营'] },
  { id: 'm5', name: '客单价', code: 'AOV', value: 268.5, unit: '元', trend: 'up', changeRate: 5.2, changeType: 'mom', departmentId: 'd1', departmentName: '销售部', owner: _users[0], updatedAt: '2026-06-08 18:00:00', description: '每笔有效订单的平均金额（GMV/订单量）', isFavorite: false, miniChart: [252, 254, 258, 261, 263, 266, 268.5], categories: ['营收', '订单', 'AOV'] },
  { id: 'm6', name: '复购率', code: 'REPURCHASE_RATE', value: 32.6, unit: '%', trend: 'up', changeRate: 1.8, changeType: 'yoy', departmentId: 'd3', departmentName: '运营部', owner: _users[3], updatedAt: '2026-06-08 20:00:00', description: '90天内有重复购买行为的用户占比', isFavorite: true, miniChart: [30.5, 31.0, 31.2, 31.6, 32.0, 32.3, 32.6], categories: ['用户', '留存', '复购'] },
  { id: 'm7', name: 'ROI', code: 'MARKETING_ROI', value: 4.2, unit: '倍', trend: 'up', changeRate: 6.2, changeType: 'yoy', departmentId: 'd2', departmentName: '市场部', owner: _users[2], updatedAt: '2026-06-09 08:30:00', description: '市场投入产出比（GMV/营销总费用）', isFavorite: true, miniChart: [3.75, 3.82, 3.9, 3.95, 4.05, 4.12, 4.2], categories: ['营销', '效益', 'ROI'] },
  { id: 'm8', name: '活跃用户', code: 'DAU', value: 156320, unit: '人', trend: 'flat', changeRate: 0.8, changeType: 'yoy', departmentId: 'd3', departmentName: '运营部', owner: _users[3], updatedAt: '2026-06-09 08:00:00', description: '当日活跃用户数，含登录/访问/浏览等行为', isFavorite: true, miniChart: [154000, 154500, 155000, 155500, 156000, 156500, 156320], categories: ['用户', '活跃', 'DAU'] },
  { id: 'm9', name: '留存率', code: 'RETENTION_30D', value: 28.5, unit: '%', trend: 'down', changeRate: -1.2, changeType: 'mom', departmentId: 'd4', departmentName: '产品部', owner: _users[4], updatedAt: '2026-06-07 10:00:00', description: '30天前新增用户中，30日后仍回访的比例', isFavorite: false, miniChart: [29.2, 29.1, 29.0, 28.9, 28.8, 28.6, 28.5], categories: ['用户', '留存'] },
  { id: 'm10', name: '新增用户', code: 'NEW_USERS_DAILY', value: 8452, unit: '人', trend: 'up', changeRate: 8.3, changeType: 'yoy', departmentId: 'd3', departmentName: '运营部', owner: _users[3], updatedAt: '2026-06-09 09:30:00', description: '当日完成注册并激活的新增用户数量', isFavorite: false, miniChart: [7600, 7750, 7900, 8050, 8200, 8320, 8452], categories: ['用户', '增长'] },
  { id: 'm11', name: '利润率', code: 'PROFIT_MARGIN', value: 18.6, unit: '%', trend: 'up', changeRate: 0.5, changeType: 'yoy', departmentId: 'd6', departmentName: '财务部', owner: _users[1], updatedAt: '2026-06-05 16:00:00', description: '整体销售利润率（净利润/营收×100%）', isFavorite: true, miniChart: [18.0, 18.1, 18.2, 18.3, 18.4, 18.5, 18.6], categories: ['财务', '盈利', '核心指标'] },
  { id: 'm12', name: '流量', code: 'TOTAL_PV', value: 4825630, unit: 'PV', trend: 'up', changeRate: 11.3, changeType: 'yoy', departmentId: 'd2', departmentName: '市场部', owner: _users[2], updatedAt: '2026-06-09 09:00:00', description: '全平台总页面浏览量（PV）', isFavorite: false, miniChart: [4280000, 4350000, 4480000, 4560000, 4650000, 4740000, 4825630], categories: ['流量', '运营', 'PV'] },
];

// ============ Part 2: 趋势数据 + 下钻明细 ============

const buildTrend = (base: number, vol: number, yoyBase: number): TrendPoint[] => {
  const arr: TrendPoint[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const v = Math.round(base * (1 + (Math.random() - 0.5) * vol));
    const cv = Math.round(yoyBase * (1 + (Math.random() - 0.5) * vol * 0.7));
    arr.push({ date: ds, value: v, compareValue: cv });
  }
  return arr;
};

export const trendData: Record<string, TrendPoint[]> = {
  m1: buildTrend(430000, 0.20, 380000),
  m2: buildTrend(1950, 0.18, 1750),
  m3: buildTrend(86200, 0.08, 82000),
  m4: buildTrend(3.9, 0.12, 3.7),
  m5: buildTrend(260, 0.09, 248),
  m6: buildTrend(32.0, 0.07, 31.0),
  m7: buildTrend(4.1, 0.10, 3.8),
  m8: buildTrend(156000, 0.08, 148000),
  m9: buildTrend(28.8, 0.06, 28.0),
  m10: buildTrend(8200, 0.15, 7600),
  m11: buildTrend(18.5, 0.05, 18.0),
  m12: buildTrend(160850, 0.16, 144500),
};

const regionNames = ['华东区', '华南区', '华北区', '华中区', '西南区', '西北区', '东北区'];
const channelNames = ['官方商城', '天猫旗舰店', '京东自营', '线下门店', '抖音小店', '拼多多', '分销渠道'];
const productNames = ['手机数码', '家用电器', '服装鞋帽', '美妆个护', '食品生鲜', '家居用品', '母婴玩具'];

const buildDrill = (dim: string, names: string[], total: number) => {
  const weights = names.map(() => 0.5 + Math.random());
  const sum = weights.reduce((a, b) => a + b, 0);
  return names.map((n, idx) => {
    const pct = Math.round((weights[idx] / sum) * 1000) / 10;
    const val = Math.round((total * pct) / 100);
    const cr = Math.round((Math.random() * 30 - 10) * 10) / 10;
    return { dimension: dim, name: n, value: val, percentage: pct, changeRate: cr } as DrillDownItem;
  }).sort((a, b) => b.value - a.value);
};

export const drillDownData: Record<string, DrillDownItem[]> = {
  m1: [
    ...buildDrill('地区', regionNames, 12586420),
    ...buildDrill('渠道', channelNames, 12586420),
    ...buildDrill('产品线', productNames, 12586420),
  ],
  m2: buildDrill('地区', regionNames, 58620),
  m3: buildDrill('渠道', channelNames, 2586320),
  m4: buildDrill('渠道', channelNames, 100),
  m5: buildDrill('产品线', productNames, 268.5),
  m6: buildDrill('地区', regionNames, 100),
  m7: buildDrill('渠道', channelNames, 100),
  m8: buildDrill('地区', regionNames, 156320),
  m9: buildDrill('渠道', channelNames, 100),
  m10: buildDrill('渠道', channelNames, 8452),
  m11: buildDrill('产品线', productNames, 100),
  m12: buildDrill('地区', regionNames, 4825630),
};

// ============ Part 3: 指标口径 + 修订记录 ============

const _hist = (version: string, ct: string, op: User, ap?: User, time = '2026-04-10 09:15:00'): RevisionRecord => ({
  id: 'h_' + Math.random().toString(36).slice(2, 8), version, changeType: ct as any,
  changeContent: `口径${ct === 'update' ? '修订' : ct === 'create' ? '创建' : '废弃'}：v${version}版本变更`,
  operator: op, approvedBy: ap, operatedAt: time,
});

export const catalogs: MetricCatalog[] = [
  { id: 'c1', metricId: 'm1', metricName: '月度销售额', version: 'v2.3', status: 'published',
    definition: '月度销售额指企业在自然月内通过销售商品或服务获得的全部收入总额，含线上电商平台、线下门店、分销渠道等所有渠道，按订单支付时间口径统计。',
    formula: 'SUM(订单实付金额) WHERE 支付状态 IN ("已支付","已完成") AND 支付时间 BETWEEN 月初00:00 AND 当月最后一天23:59:59',
    dataSource: '订单中心ODS层 → 销售明细DWS层 → 月度汇总ADS层',
    updateFrequency: '每日02:00更新T+1数据，月末最后一天23:59:59出结算值',
    dimensions: ['时间', '地区', '渠道', '产品线', '客户类型'],
    owner: _users[1], reviewers: [_users[0], _users[3]],
    history: [
      _hist('2.3', 'update', _users[1], _users[0], '2026-05-20 14:30:00'),
      _hist('2.0', 'update', _users[1], _users[0], '2026-04-10 09:15:00'),
      _hist('1.0', 'create', _users[1], _users[0], '2025-12-01 10:00:00'),
    ],
    createdAt: '2025-12-01 10:00:00', updatedAt: '2026-05-20 14:30:00' },
  { id: 'c2', metricId: 'm2', metricName: '订单量', version: 'v1.5', status: 'published',
    definition: '当月有效订单总数，按订单维度去重统计，剔除已取消、已全额退款订单。',
    formula: 'COUNT(DISTINCT 订单号) WHERE 支付状态 IN ("已支付","已发货","已完成") AND 退款状态 != "全额退款"',
    dataSource: '交易系统 → 订单明细表 ods_order → dws_order_count',
    updateFrequency: '每小时更新一次，当日23:59出最终值',
    dimensions: ['时间', '地区', '渠道', '订单类型'],
    owner: _users[1], reviewers: [_users[0]],
    history: [_hist('1.5', 'update', _users[1], _users[0], '2026-03-15 11:20:00'), _hist('1.0', 'create', _users[1], _users[0], '2025-12-10 09:30:00')],
    createdAt: '2025-12-10 09:30:00', updatedAt: '2026-03-15 11:20:00' },
  { id: 'c3', metricId: 'm3', metricName: '用户数', version: 'v1.2', status: 'published',
    definition: '截至统计日，平台累计完成注册并激活的独立用户总数，按用户唯一ID去重。',
    formula: 'COUNT(DISTINCT user_id) WHERE is_active = 1 AND register_time <= 统计日23:59:59',
    dataSource: '用户中心 → 用户注册表 ods_user → ads_user_total',
    updateFrequency: '每日03:00更新',
    dimensions: ['时间', '注册渠道', '地区', '会员等级'],
    owner: _users[3], reviewers: [_users[4]],
    history: [_hist('1.2', 'update', _users[3], _users[4], '2026-02-28 16:00:00'), _hist('1.0', 'create', _users[3], _users[4], '2025-12-15 14:00:00')],
    createdAt: '2025-12-15 14:00:00', updatedAt: '2026-02-28 16:00:00' },
  { id: 'c4', metricId: 'm4', metricName: '转化率', version: 'v1.8', status: 'published',
    definition: '统计周期内完成下单支付的用户数占总独立访客数（UV）的百分比。',
    formula: '支付用户数 / UV × 100%',
    dataSource: '埋点平台 + 交易系统 → dws_funnel_conversion',
    updateFrequency: '每2小时更新一次',
    dimensions: ['时间', '渠道', '来源', '终端类型'],
    owner: _users[2], reviewers: [_users[3]],
    history: [_hist('1.8', 'update', _users[2], _users[3], '2026-05-10 10:30:00')],
    createdAt: '2026-01-05 09:00:00', updatedAt: '2026-05-10 10:30:00' },
  { id: 'c5', metricId: 'm5', metricName: '客单价', version: 'v1.3', status: 'published',
    definition: '统计周期内每笔有效订单的平均金额（AOV）。',
    formula: '订单实付总额 / 有效订单数',
    dataSource: '订单中心 → dws_aov_daily',
    updateFrequency: '每日凌晨04:00更新T+1',
    dimensions: ['时间', '地区', '渠道', '产品线', '新老用户'],
    owner: _users[0], reviewers: [_users[1]],
    history: [_hist('1.3', 'update', _users[0], _users[1], '2026-03-22 11:45:00')],
    createdAt: '2026-01-10 10:00:00', updatedAt: '2026-03-22 11:45:00' },
  { id: 'c6', metricId: 'm6', metricName: '复购率', version: 'v2.0', status: 'published',
    definition: '统计起始日前90天内有购买行为的用户，在统计日起90天内再次购买的用户比例。',
    formula: '（90天内购买≥2次的用户数 / 90天内购买≥1次的用户数）× 100%',
    dataSource: '用户购买行为明细 → dws_repurchase_90d',
    updateFrequency: '每周一更新',
    dimensions: ['时间', '渠道', '用户分层', '产品线'],
    owner: _users[3], reviewers: [_users[4]],
    history: [_hist('2.0', 'update', _users[3], _users[4], '2026-04-20 15:10:00')],
    createdAt: '2026-01-18 14:00:00', updatedAt: '2026-04-20 15:10:00' },
  { id: 'c7', metricId: 'm7', metricName: 'ROI', version: 'v1.4', status: 'draft',
    definition: '市场投放ROI = 营销带来的归因GMV / 营销总投入费用（含渠道费、优惠券、达人佣金等）。',
    formula: '归因GMV / SUM(营销费用)',
    dataSource: '营销费用台账 + 销售归因模型 → ads_marketing_roi',
    updateFrequency: '每周三更新上周数据',
    dimensions: ['时间', '渠道', '活动', '投放计划'],
    owner: _users[2], reviewers: [_users[0], _users[1]],
    history: [_hist('1.4', 'update', _users[2], _users[0], '2026-06-01 09:50:00')],
    createdAt: '2026-02-01 10:30:00', updatedAt: '2026-06-01 09:50:00' },
  { id: 'c8', metricId: 'm8', metricName: '活跃用户', version: 'v2.1', status: 'published',
    definition: '当日登录APP/访问官网并产生至少一次有效行为（浏览、点击、搜索、下单、收藏、加购物车）的独立用户。',
    formula: 'COUNT(DISTINCT user_id) WHERE action_date = 统计日 AND action_type IN (...)',
    dataSource: '行为埋点DWD层 → ads_dau_daily',
    updateFrequency: '准实时（延迟约5分钟）',
    dimensions: ['时间', '地区', '终端', '用户类型'],
    owner: _users[3], reviewers: [_users[4]],
    history: [_hist('2.1', 'update', _users[3], _users[4], '2026-05-15 16:20:00')],
    createdAt: '2026-02-10 09:00:00', updatedAt: '2026-05-15 16:20:00' },
  { id: 'c9', metricId: 'm9', metricName: '留存率', version: 'v1.6', status: 'published',
    definition: '30日留存率 = N日新增用户中，N+30日仍活跃的用户数 / N日新增用户数 × 100%。',
    formula: '留存活跃用户 / 新增用户 × 100%',
    dataSource: '用户注册表 + 活跃表 → ads_retention_d30',
    updateFrequency: '每日更新（延迟30天可得最终值）',
    dimensions: ['时间', '注册渠道', '新老用户', '地区'],
    owner: _users[4], reviewers: [_users[3]],
    history: [_hist('1.6', 'update', _users[4], _users[3], '2026-03-18 10:00:00')],
    createdAt: '2026-02-15 11:00:00', updatedAt: '2026-03-18 10:00:00' },
  { id: 'c10', metricId: 'm10', metricName: '新增用户', version: 'v1.1', status: 'published',
    definition: '当日完成注册流程（手机号/三方授权验证成功）的独立用户数。',
    formula: 'COUNT(DISTINCT user_id) WHERE register_date = 统计日 AND is_verified = 1',
    dataSource: '用户中心 → 注册日志 ods_register_log',
    updateFrequency: '每30分钟更新',
    dimensions: ['时间', '注册渠道', '终端', '地区'],
    owner: _users[3], reviewers: [_users[2]],
    history: [_hist('1.1', 'update', _users[3], _users[2], '2026-04-05 13:40:00')],
    createdAt: '2026-03-01 09:30:00', updatedAt: '2026-04-05 13:40:00' },
  { id: 'c11', metricId: 'm11', metricName: '利润率', version: 'v3.0', status: 'published',
    definition: '整体销售利润率 = （营业收入 - 商品成本 - 运营费用 - 营销费用 - 税费）/ 营业收入 × 100%。',
    formula: '（营业收入 - 总成本）/ 营业收入 × 100%',
    dataSource: '财务ERP系统 → 利润表科目汇总',
    updateFrequency: '每月5日更新上月数据',
    dimensions: ['时间', '事业部', '产品线', '地区'],
    owner: _users[1], reviewers: [_users[0]],
    history: [_hist('3.0', 'update', _users[1], _users[0], '2026-05-28 17:00:00')],
    createdAt: '2026-01-05 10:00:00', updatedAt: '2026-05-28 17:00:00' },
  { id: 'c12', metricId: 'm12', metricName: '流量', version: 'v1.0', status: 'published',
    definition: '全平台总页面浏览量（PV），即所有页面被用户成功加载的次数，同一用户多次打开重复计数。',
    formula: 'SUM(page_view_event) WHERE event_time BETWEEN 开始 AND 结束',
    dataSource: '前端埋点SDK上报 → DWD层 dwd_page_view → ADS层 ads_pv_total',
    updateFrequency: '每15分钟更新一次',
    dimensions: ['时间', '终端', '页面类型', '来源渠道', '地区'],
    owner: _users[2], reviewers: [_users[4]],
    history: [_hist('1.0', 'create', _users[2], _users[4], '2026-03-10 10:00:00')],
    createdAt: '2026-03-10 10:00:00', updatedAt: '2026-03-10 10:00:00' },
];

export const revisionRecords: RevisionRecord[] = [
  _hist('2.3', 'update', _users[1], _users[0], '2026-05-20 14:30:00'),
  _hist('2.0', 'update', _users[1], _users[0], '2026-04-10 09:15:00'),
  _hist('1.8', 'update', _users[2], _users[3], '2026-05-10 10:30:00'),
  _hist('2.0', 'update', _users[3], _users[4], '2026-04-20 15:10:00'),
  _hist('3.0', 'update', _users[1], _users[0], '2026-05-28 17:00:00'),
  _hist('1.4', 'update', _users[2], _users[0], '2026-06-01 09:50:00'),
  _hist('2.1', 'update', _users[3], _users[4], '2026-05-15 16:20:00'),
  _hist('1.0', 'create', _users[1], _users[0], '2025-12-01 10:00:00'),
];

// ============ Part 4: 工单/疑问/修订申请/订阅 ============

const _tl = (action: string, op: User, remark?: string, ts = '2026-06-09 02:05:00'): TicketTimeline =>
  ({ action, operator: op, remark, timestamp: ts });

export const tickets: AnomalyTicket[] = [
  { id: 't1', title: '华东区销售额异常下跌35%', metricId: 'm1', metricName: '月度销售额', level: 'critical',
    description: '华东区6月8日销售额280000元，较前7日均值430000元下跌34.9%，超出阈值-15%。',
    snapshotValue: 280000, expectedValue: 430000, deviation: -34.9, departmentId: 'd1',
    assignee: _users[0], handler: _users[0], status: 'processing',
    rootCause: '初步排查为华东区CDN节点故障导致下单页面加载缓慢',
    evidences: [],
    timestamps: [
      _tl('系统检测异常', _users[1], '3σ规则自动触发', '2026-06-09 02:05:00'),
      _tl('派发工单', _users[1], '按部门匹配规则派发', '2026-06-09 02:10:00'),
      _tl('开始处理', _users[0], '联系技术部排查中', '2026-06-09 09:20:00'),
    ],
    createdAt: '2026-06-09 02:05:00', detectedAt: '2026-06-09 02:05:00',
    slaDeadline: '2026-06-09 14:05:00', urgedCount: 1 },
  { id: 't2', title: '新增用户数据延迟未更新', metricId: 'm10', metricName: '新增用户', level: 'high',
    description: '新增用户指标超过4小时未更新，最新数据停留在6月9日06:00。',
    snapshotValue: 0, expectedValue: 8200, deviation: -100, departmentId: 'd3',
    assignee: _users[3], handler: _users[1], status: 'processing',
    rootCause: 'ETL调度节点CPU占用率过高导致任务延迟',
    evidences: [],
    timestamps: [
      _tl('数据新鲜度检测', _users[1], 'SLA 4小时超时触发', '2026-06-09 10:05:00'),
      _tl('认领工单', _users[1], '数据团队接手', '2026-06-09 10:10:00'),
    ],
    createdAt: '2026-06-09 10:05:00', detectedAt: '2026-06-09 10:05:00',
    slaDeadline: '2026-06-10 02:05:00', urgedCount: 0 },
  { id: 't3', title: '订单转化率环比下降6.8%', metricId: 'm4', metricName: '转化率', level: 'medium',
    description: '本周订单转化率3.82%，上周4.10%，环比-6.8%。',
    snapshotValue: 3.82, expectedValue: 4.10, deviation: -6.8, departmentId: 'd2',
    assignee: _users[2], handler: _users[2], status: 'completed',
    rootCause: '618大促预热结束后流量回落属于正常现象',
    resolution: '确认属正常波动，持续观察下周数据',
    evidences: [],
    timestamps: [
      _tl('检测异常', _users[1], '环比检测触发', '2026-06-07 02:00:00'),
      _tl('认领处理', _users[2], '', '2026-06-07 09:15:00'),
      _tl('处理完成', _users[2], '正常波动', '2026-06-08 17:00:00'),
    ],
    createdAt: '2026-06-07 02:00:00', detectedAt: '2026-06-07 02:00:00',
    slaDeadline: '2026-06-08 02:00:00', urgedCount: 0 },
  { id: 't4', title: '复购率突降至25.8%', metricId: 'm6', metricName: '复购率', level: 'high',
    description: '复购率从32.6%突降至25.8%，跌幅达20.9%。',
    snapshotValue: 25.8, expectedValue: 32.6, deviation: -20.9, departmentId: 'd3',
    assignee: _users[3], status: 'pending',
    evidences: [],
    timestamps: [_tl('检测异常', _users[1], '', '2026-06-09 03:00:00')],
    createdAt: '2026-06-09 03:00:00', detectedAt: '2026-06-09 03:00:00',
    slaDeadline: '2026-06-09 19:00:00', urgedCount: 0 },
  { id: 't5', title: '流量PV激增异常120%', metricId: 'm12', metricName: '流量', level: 'medium',
    description: '6月8日晚20-22时PV同比激增120%，疑似爬虫流量。',
    snapshotValue: 358000, expectedValue: 162000, deviation: 121, departmentId: 'd2',
    assignee: _users[2], handler: _users[1], status: 'completed',
    rootCause: '确认来自友商数据爬虫，已封禁对应IP段',
    resolution: 'WAF规则已更新，爬虫流量占比从68%降至0.2%',
    evidences: [],
    timestamps: [
      _tl('检测异常', _users[1], '', '2026-06-08 22:05:00'),
      _tl('处理完成', _users[1], 'IP已封禁', '2026-06-08 23:20:00'),
    ],
    createdAt: '2026-06-08 22:05:00', detectedAt: '2026-06-08 22:05:00',
    slaDeadline: '2026-06-09 22:05:00', urgedCount: 0 },
  { id: 't6', title: '客单价环比下滑超8%', metricId: 'm5', metricName: '客单价', level: 'low',
    description: '客单价从268.5元跌至246元，环比-8.4%。',
    snapshotValue: 246, expectedValue: 268.5, deviation: -8.4, departmentId: 'd1',
    assignee: _users[0], status: 'pending',
    evidences: [],
    timestamps: [_tl('检测异常', _users[1], '', '2026-06-09 04:15:00')],
    createdAt: '2026-06-09 04:15:00', detectedAt: '2026-06-09 04:15:00',
    slaDeadline: '2026-06-11 04:15:00', urgedCount: 0 },
  { id: 't7', title: '活跃用户连续3日低于预期', metricId: 'm8', metricName: '活跃用户', level: 'medium',
    description: 'DAU连续3日低于预期值5%以上。',
    snapshotValue: 148200, expectedValue: 156320, deviation: -5.2, departmentId: 'd3',
    assignee: _users[3], handler: _users[4], status: 'processing',
    evidences: [],
    timestamps: [
      _tl('检测异常', _users[1], '', '2026-06-09 08:05:00'),
      _tl('派发工单', _users[1], '', '2026-06-09 08:06:00'),
    ],
    createdAt: '2026-06-09 08:05:00', detectedAt: '2026-06-09 08:05:00',
    slaDeadline: '2026-06-10 08:05:00', urgedCount: 0 },
  { id: 't8', title: 'ROI负值异常', metricId: 'm7', metricName: 'ROI', level: 'critical',
    description: '京东渠道投放ROI为-0.5，投入20万但未产生有效订单。',
    snapshotValue: -0.5, expectedValue: 4.2, deviation: -111.9, departmentId: 'd2',
    assignee: _users[2], status: 'pending',
    evidences: [],
    timestamps: [_tl('检测异常', _users[1], '投放归因异常', '2026-06-09 05:40:00')],
    createdAt: '2026-06-09 05:40:00', detectedAt: '2026-06-09 05:40:00',
    slaDeadline: '2026-06-09 17:40:00', urgedCount: 2 },
];

export const catalogQuestions: CatalogQuestion[] = [
  { id: 'q1', catalogId: 'c1', question: '请问月度销售额是否包含退款抵扣？如果用户在次月退款，会影响当月统计吗？',
    screenshots: [], asker: _users[2],
    answer: '月度销售额按订单发生月统计，不扣除后续退款。退款会在发生月进行抵扣，建议同时关注"净销售额"指标。',
    answerer: _users[1], status: 'answered', createdAt: '2026-06-05 10:20:00' },
  { id: 'q2', catalogId: 'c1', question: '线下门店POS数据同步频率是多少？对账时与财务系统有差异怎么办？',
    screenshots: [], asker: _users[0], status: 'pending', createdAt: '2026-06-08 14:10:00' },
  { id: 'q3', catalogId: 'c4', question: '转化率UV分母是否排除爬虫流量？排除比例约为多少？',
    screenshots: [], asker: _users[4],
    answer: '已排除常规爬虫（约占请求量的8%），使用UA+IP双重过滤。高级伪装爬虫暂未处理，建议结合业务验证。',
    answerer: _users[1], status: 'answered', createdAt: '2026-06-04 11:35:00' },
  { id: 'q4', catalogId: 'c8', question: 'DAU是否包含仅打开推送页面但未登录的用户？',
    screenshots: [], asker: _users[3], status: 'pending', createdAt: '2026-06-08 16:50:00' },
  { id: 'q5', catalogId: 'c11', question: '利润率与月度财报数据差异0.3%是否正常？主要来源是什么？',
    screenshots: [], asker: _users[0],
    answer: 'BI口径与财务口径差异主要来自费用计提时间差，±0.5%内属正常范围。',
    answerer: _users[1], status: 'answered', createdAt: '2026-06-02 15:12:00' },
];

const _apv = (id: string, order: number, approver: User, status: any, opinion?: string, at?: string): ApprovalNode =>
  ({ id, order, approver, status, opinion, operatedAt: at });

export const revisionRequests: RevisionRequest[] = [
  { id: 'rr1', catalogId: 'c1', type: 'update',
    reason: '公司新增跨境电商业务线，需要纳入销售额统计范围',
    suggestedContent: '在数据源中增加"跨境订单表"，增加跨境作为渠道维度',
    applicant: _users[2], status: 'pending',
    approvals: [
      _apv('a1', 1, _users[0], 'approved', '同意，补充跨境业务口径文档', '2026-06-07 09:30:00'),
      _apv('a2', 2, _users[1], 'pending'),
    ],
    createdAt: '2026-06-06 16:00:00' },
  { id: 'rr2', catalogId: 'c4', type: 'update',
    reason: '漏斗中增加"加购"环节，需要同步更新转化率相关口径',
    suggestedContent: '新增"加购转化率"指标，调整整体漏斗定义',
    applicant: _users[4], status: 'approved',
    approvals: [
      _apv('a3', 1, _users[2], 'approved', '同意，需同步更新产品端展示', '2026-06-03 11:20:00'),
      _apv('a4', 2, _users[1], 'approved', '口径文档已确认', '2026-06-04 10:05:00'),
    ],
    createdAt: '2026-06-02 14:30:00' },
  { id: 'rr3', catalogId: 'c9', type: 'deprecate',
    reason: '30日留存率业务关注度降低，建议用7日留存替代',
    suggestedContent: '将c9标记为deprecated，推荐使用c8（活跃用户）及新增的7日留存口径',
    applicant: _users[4], status: 'pending',
    approvals: [_apv('a5', 1, _users[3], 'pending')],
    createdAt: '2026-06-08 10:00:00' },
];

export const subscriptions: Subscription[] = [
  { id: 's1', metricId: 'm1', metricName: '月度销售额', enabled: true, createdAt: '2026-05-01 10:00:00',
    thresholds: [
      { type: 'change_rate', value: -10, level: 'warning' },
      { type: 'change_rate', value: -20, level: 'critical' },
      { type: 'below', value: 10000000, level: 'warning' },
    ],
    notifyChannels: ['app', 'email', 'wechat'] },
  { id: 's2', metricId: 'm8', metricName: '活跃用户', enabled: true, createdAt: '2026-05-15 14:20:00',
    thresholds: [{ type: 'below', value: 140000, level: 'warning' }],
    notifyChannels: ['app'] },
  { id: 's3', metricId: 'm4', metricName: '转化率', enabled: true, createdAt: '2026-05-20 09:45:00',
    thresholds: [{ type: 'change_rate', value: -5, level: 'warning' }],
    notifyChannels: ['app', 'email'] },
  { id: 's4', metricId: 'm11', metricName: '利润率', enabled: false, createdAt: '2026-05-25 16:10:00',
    thresholds: [{ type: 'below', value: 15, level: 'critical' }],
    notifyChannels: ['email', 'sms'] },
  { id: 's5', metricId: 'm7', metricName: 'ROI', enabled: true, createdAt: '2026-06-01 11:30:00',
    thresholds: [
      { type: 'below', value: 3, level: 'warning' },
      { type: 'below', value: 2, level: 'critical' },
    ],
    notifyChannels: ['app', 'wechat'] },
];

// ============ Part 5: 通知/收藏/操作日志 ============

export const notifications: Notification[] = [
  { id: 'n1', type: 'anomaly', title: '异常告警：华东区销售额下跌35%',
    content: '华东区6月8日销售额较7日均值下跌34.9%，已生成异常工单T-20260609-001',
    relatedId: 't1', isRead: false, createdAt: '2026-06-09 02:05:00' },
  { id: 'n2', type: 'approval', title: '待审批：月度销售额口径修订申请',
    content: '王芳提交的月度销售额口径修订申请等待您的审批（跨境业务新增）',
    relatedId: 'rr1', isRead: false, createdAt: '2026-06-06 16:05:00' },
  { id: 'n3', type: 'revision', title: '口径已更新：新增用户数 v1.1',
    content: '新增用户数口径已升级至v1.1，增加三方授权注册来源统计',
    relatedId: 'c10', isRead: true, createdAt: '2026-04-05 14:00:00' },
  { id: 'n4', type: 'threshold', title: '阈值触发：活跃用户DAU低于预期',
    content: '连续3日DAU低于目标值5%，请关注用户活跃度变化',
    relatedId: 't7', isRead: false, createdAt: '2026-06-09 08:05:00' },
  { id: 'n5', type: 'anomaly', title: '异常告警：京东投放ROI为负',
    content: '京东渠道投放ROI = -0.5，投入20万未产生有效订单，请立即处理',
    relatedId: 't8', isRead: false, createdAt: '2026-06-09 05:40:00' },
  { id: 'n6', type: 'revision', title: '审批通过：转化率口径修订',
    content: '您提交的转化率口径修订（增加加购环节）已全部通过，将于下周一正式生效',
    relatedId: 'rr2', isRead: true, createdAt: '2026-06-04 10:10:00' },
  { id: 'n7', type: 'approval', title: '审批任务：复购率口径修订',
    content: '孙丽提交的复购率口径废弃申请等待您的审批（RR-202606-003）',
    relatedId: 'rr3', isRead: false, createdAt: '2026-06-08 10:05:00' },
  { id: 'n8', type: 'threshold', title: '订阅提醒：ROI < 3',
    content: '当前营销ROI为2.8，低于您设置的阈值3，建议关注投放效果',
    relatedId: 's5', isRead: true, createdAt: '2026-06-07 18:30:00' },
];

export const favoriteCategories: FavoriteCategory[] = [
  { id: 'fc1', name: '核心KPI', color: '#1E5EFF', metricIds: ['m1', 'm2', 'm3', 'm8', 'm11'], order: 0 },
  { id: 'fc2', name: '运营日报', color: '#00C48C', metricIds: ['m4', 'm6', 'm9', 'm10'], order: 1 },
  { id: 'fc3', name: '市场投放', color: '#FF6F3C', metricIds: ['m7', 'm12'], order: 2 },
  { id: 'fc4', name: '销售分析', color: '#FF9F1C', metricIds: ['m1', 'm2', 'm5'], order: 3 },
  { id: 'fc5', name: '临时监控', color: '#B14AFF', metricIds: [], order: 4 },
];

export const operationLogs: OperationLog[] = [
  { id: 'ol1', type: '收藏', module: '指标中心', targetName: '月度销售额(GMV)',
    detail: '将指标添加到「核心KPI」收藏夹', operator: _users[0], createdAt: '2026-06-08 15:30:00' },
  { id: 'ol2', type: '处理工单', module: '异常管理', targetName: '订单转化率环比下降(T-003)',
    detail: '查看详情并完成处理，结论为正常波动', operator: _users[2], createdAt: '2026-06-08 17:00:00' },
  { id: 'ol3', type: '订阅', module: '告警中心', targetName: '月度销售额',
    detail: '创建阈值告警：环比跌超10%推送APP+邮件+微信', operator: _users[0], createdAt: '2026-06-08 10:22:00' },
  { id: 'ol4', type: '提交申请', module: '口径管理', targetName: '月度销售额口径修订',
    detail: '提交RR-202606-001：新增跨境业务统计范围', operator: _users[2], createdAt: '2026-06-06 16:00:00' },
  { id: 'ol5', type: '审批', module: '口径管理', targetName: '月度销售额口径修订',
    detail: '审批通过RR-202606-001第1节点，补充口径文档', operator: _users[0], createdAt: '2026-06-07 09:30:00' },
  { id: 'ol6', type: '下载', module: '报表中心', targetName: '5月销售周报',
    detail: '下载5月全渠道销售周报（PDF格式）', operator: _users[0], createdAt: '2026-06-03 11:12:00' },
  { id: 'ol7', type: '查看', module: '指标详情', targetName: 'ROI',
    detail: '查看ROI指标详情及下钻分析，停留时长4分32秒', operator: _users[2], createdAt: '2026-06-09 09:40:00' },
  { id: 'ol8', type: '提问', module: '口径管理', targetName: '月度销售额',
    detail: '提出口径疑问Q-002：线下门店POS同步频率与对账差异', operator: _users[0], createdAt: '2026-06-08 14:10:00' },
  { id: 'ol9', type: '更新阈值', module: '告警中心', targetName: '活跃用户数',
    detail: '将DAU预警阈值从15万下调至14万', operator: _users[3], createdAt: '2026-06-05 14:48:00' },
  { id: 'ol10', type: '登录', module: '系统', targetName: '登录系统',
    detail: '用户登录成功，IP=192.168.1.108，设备=iPhone 15 Pro', operator: _users[0], createdAt: '2026-06-09 08:55:00' },
];

// ============ 用户要求的 approvals 审批列表 ============

export const approvals = revisionRequests;

// ============ 导出别名（兼容各 Store 模块引用） ============

export const mockUsers = users;
export const mockDepartments = departments;
export const mockMetrics = metrics;
export const mockTrendData = trendData;
export const mockDrillDownData = drillDownData['m1'] || [];
export const mockCatalogs = catalogs;
export const mockRevisionRecords = revisionRecords;
export const mockCatalogQuestions = catalogQuestions;
export const mockQuestions = catalogQuestions;
export const mockRevisionRequests = revisionRequests;
export const mockTickets = tickets;
export const mockSubscriptions = subscriptions;
export const mockNotifications = notifications;
export const mockFavoriteCategories = favoriteCategories;
export const mockOperationLogs = operationLogs;
export const mockCurrentUser = currentUser;
export const mockTimeRange: TimeRange = 'month';





