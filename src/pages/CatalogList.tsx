import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { SearchBar } from '@/components/SearchBar';
import { StatusBadge } from '@/components/StatusBadge';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { catalogs } from '@/data/mockData';
import type { MetricCatalog } from '@/types';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | 'published' | 'draft' | 'deprecated';

const TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿' },
  { key: 'deprecated', label: '已废弃' },
];

const statusMap: Record<MetricCatalog['status'], { status: 'success' | 'warning' | 'danger'; text: string }> = {
  published: { status: 'success', text: '已发布' },
  draft: { status: 'warning', text: '草稿' },
  deprecated: { status: 'danger', text: '已废弃' },
};

function CatalogCard({ catalog, onClick }: { catalog: MetricCatalog; onClick: () => void }) {
  const avatar: AvatarItem = {
    id: catalog.owner.id,
    src: catalog.owner.avatar,
    name: catalog.owner.name,
  };
  const conf = statusMap[catalog.status];

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl bg-background-card border border-white/5 p-4 text-left transition-all duration-300 ease-out hover:bg-white/5 active:scale-[0.98]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-white truncate">{catalog.metricName}</h3>
            <span className="inline-flex items-center rounded-md bg-brand/10 px-1.5 py-0.5 text-[10px] font-medium text-brand border border-brand/20">
              {catalog.version}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-white/50">
            {catalog.definition}
          </p>
        </div>
        <StatusBadge status={conf.status} text={conf.text} size="sm" showIcon={false} />
      </div>
      <div className="mt-3 flex items-center justify-between">
        <AvatarGroup avatars={[avatar]} max={1} size="sm" />
        <span className="text-[11px] text-white/30">{catalog.updatedAt.slice(0, 10)}</span>
      </div>
    </button>
  );
}

export default function CatalogList() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<FilterTab>('all');
  const [keyword, setKeyword] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const list = useMemo(() => {
    return catalogs.filter((c) => {
      if (tab !== 'all' && c.status !== tab) return false;
      if (keyword && !c.metricName.includes(keyword) && !c.definition.includes(keyword)) return false;
      return true;
    });
  }, [tab, keyword]);

  return (
    <div className="min-h-screen bg-[#0F1326]">
      <TopBar
        title="口径库"
        showBack
        onBack={() => navigate(-1)}
        actions={['search']}
        onAction={() => setShowSearch((v) => !v)}
      />

      <div className="mx-auto max-w-md px-4 pb-24">
        {showSearch && (
          <div className="pt-4">
            <SearchBar
              value={keyword}
              onChange={setKeyword}
              placeholder="搜索指标名、口径定义..."
            />
          </div>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={cn(
                'shrink-0 rounded-full px-4 py-2 text-xs font-medium transition-all duration-300 ease-out border',
                tab === t.key
                  ? 'bg-brand text-white border-brand shadow-lg shadow-brand/20'
                  : 'bg-white/[0.03] text-white/60 border-white/5 hover:bg-white/5 hover:text-white/80',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-3">
          {list.map((c) => (
            <CatalogCard key={c.id} catalog={c} onClick={() => navigate(`/catalog/${c.id}`)} />
          ))}
        </div>

        {list.length === 0 && (
          <div className="mt-20 text-center text-sm text-white/30">暂无口径数据</div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {}}
        className="fixed bottom-6 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-xl shadow-brand/40 transition-all duration-300 ease-out hover:scale-105 active:scale-95"
        aria-label="发起修订"
      >
        <Plus size={24} strokeWidth={2.5} />
      </button>
    </div>
  );
}
