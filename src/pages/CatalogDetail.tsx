import { useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  HelpCircle, FileEdit, Share2, ChevronDown, ChevronUp,
  Upload, X, BookOpen, Database, Tag, Users, Clock,
} from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { StatusBadge } from '@/components/StatusBadge';
import { ActionSheet, type ActionSheetItem } from '@/components/ActionSheet';
import { AvatarGroup, type AvatarItem } from '@/components/AvatarGroup';
import { useCatalogStore } from '@/stores/catalogStore';
import { useApprovalStore } from '@/stores/approvalStore';
import { useFavoriteStore } from '@/stores/favoriteStore';
import { useUIStore } from '@/stores/uiStore';
import { mockCurrentUser, mockCatalogs } from '@/data/mockData';
import type { MetricCatalog, CatalogQuestion } from '@/types';
import { cn } from '@/lib/utils';

const statusMap: Record<MetricCatalog['status'], { status: 'success' | 'warning' | 'danger'; text: string }> = {
  published: { status: 'success', text: '已发布' },
  draft: { status: 'warning', text: '草稿' },
  deprecated: { status: 'danger', text: '已废弃' },
};

const revTypeMap = { create: '新增', update: '修订', deprecate: '废弃' };
const revTypeColor = { create: 'bg-success/20 text-success', update: 'bg-brand/20 text-brand', deprecate: 'bg-danger/20 text-danger' };

type ModalType = 'question' | 'revision' | null;
type RevType = 'create' | 'update' | 'deprecate';

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

function QuestionItem({ q }: { q: CatalogQuestion }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full p-3 text-left flex items-start gap-2"
      >
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-white/80 line-clamp-2">{q.question}</p>
          <div className="mt-1.5 flex items-center gap-2">
            <span className="text-[10px] text-white/30">{q.asker.name}</span>
            <span className="text-[10px] text-white/30">·</span>
            <span className="text-[10px] text-white/30">{q.createdAt.slice(0, 10)}</span>
            <StatusBadge
              status={q.status === 'answered' ? 'success' : q.status === 'pending' ? 'warning' : 'info'}
              text={q.status === 'answered' ? '已回复' : q.status === 'pending' ? '待回复' : '已关闭'}
              size="sm"
              showIcon={false}
            />
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-white/40 shrink-0 mt-0.5" /> : <ChevronDown size={16} className="text-white/40 shrink-0 mt-0.5" />}
      </button>
      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5">
          <div className="rounded-lg bg-white/[0.02] p-3 mt-2">
            <div className="flex items-center gap-2 mb-1.5">
              <AvatarGroup avatars={[{ id: q.asker.id, src: q.asker.avatar, name: q.asker.name }]} size="sm" max={1} />
              <span className="text-[11px] font-medium text-white/70">{q.asker.name} 提问</span>
            </div>
            <p className="text-xs text-white/60 leading-relaxed">{q.question}</p>
          </div>
          {q.answer && (
            <div className="rounded-lg bg-brand/5 p-3 mt-2 border border-brand/10">
              <div className="flex items-center gap-2 mb-1.5">
                {q.answerer && <AvatarGroup avatars={[{ id: q.answerer.id, src: q.answerer.avatar, name: q.answerer.name }]} size="sm" max={1} />}
                <span className="text-[11px] font-medium text-brand">{q.answerer?.name} 回复</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{q.answer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionTitleRev({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand">
        {icon}
      </div>
      <h2 className="text-sm font-semibold text-white">{title}</h2>
    </div>
  );
}

function RevisionRequestsSection({ catalogId }: { catalogId: string }) {
  const allRevisionRequests = useCatalogStore((s) => s.revisionRequests);

  const requests = useMemo(
    () => allRevisionRequests.filter((r) => r.catalogId === catalogId),
    [allRevisionRequests, catalogId]
  );

  const reqStatusConfig = {
    pending: { badge: 'bg-brand/15 text-brand border border-brand/20', label: '待审批' },
    approved: { badge: 'bg-success/15 text-success border border-success/20', label: '已通过' },
    rejected: { badge: 'bg-danger/15 text-danger border border-danger/20', label: '已拒绝' },
    published: { badge: 'bg-purple-500/15 text-purple-400 border border-purple-500/20', label: 'Published' },
  } as const;

  if (requests.length === 0) return null;

  return (
    <div className="mt-5">
      <SectionTitleRev icon={<FileEdit size={14} />} title={`审批修订记录 (${requests.length})`} />
      <div className="space-y-2">
        {requests.map((r) => {
          const statusCfg = reqStatusConfig[r.status];
          const isPublished = r.status === 'published';
          return (
            <div
              key={r.id}
              className={cn(
                'rounded-xl border p-3 transition-all overflow-hidden',
                isPublished
                  ? 'bg-purple-500/[0.03] border-purple-500/20'
                  : 'bg-background-card border-white/5'
              )}
            >
              {isPublished ? (
                <>
                  <div className="h-1.5 -mx-3 -mt-3 mb-3 bg-gradient-to-r from-purple-600 via-purple-500 to-purple-400" />
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold', statusCfg.badge)}>
                      {statusCfg.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-white/40">发布人：</span>
                      {r.publishedBy ? (
                        <>
                          <img
                            src={r.publishedBy.avatar}
                            alt={r.publishedBy.name}
                            className="h-4 w-4 rounded-full bg-white/10"
                          />
                          <span className="text-[10px] text-white/70">{r.publishedBy.name}</span>
                        </>
                      ) : (
                        <span className="text-[10px] text-white/40">系统发布</span>
                      )}
                      <span className="text-[10px] text-white/30">{r.publishedAt ? r.publishedAt.slice(0, 16) : '时间未知'}</span>
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white mb-3">发布说明：{r.reason}</p>
                  <div className="rounded-xl bg-white/[0.02] border border-white/10 p-3 mb-3">
                    <div className="text-[10px] font-medium text-white/40 mb-1.5">审批意见摘要</div>
                    {r.approvalSummary ? (
                      <div className="text-[11px] text-white/60 leading-relaxed whitespace-pre-line">
                        {r.approvalSummary.split('；').map((op, i) => (
                          <div key={i}>{op}</div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-white/30">无审批意见</p>
                    )}
                  </div>
                  <div className="rounded-xl bg-brand/[0.03] border border-brand/10 p-3">
                    <div className="text-[10px] font-medium text-brand/70 mb-1.5">建议新内容</div>
                    <p className="text-[11px] text-white/70 leading-relaxed">{r.suggestedContent}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium', revTypeColor[r.type])}>
                        {revTypeMap[r.type]}
                      </span>
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium', statusCfg.badge)}>
                        {statusCfg.label}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs mb-2 leading-relaxed text-white/70">
                    {r.reason}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <img
                        src={r.applicant.avatar}
                        alt={r.applicant.name}
                        className="h-5 w-5 rounded-full bg-white/10"
                      />
                      <span className="text-[11px] text-white/60">{r.applicant.name}</span>
                    </div>
                    <span className="text-[10px] text-white/30">{r.createdAt.slice(0, 16)}</span>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function CatalogDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showToast } = useUIStore();
  const { addOperationLog } = useFavoriteStore();
  const addQuestion = useCatalogStore((s) => s.addQuestion);
  const addRevisionRequest = useCatalogStore((s) => s.addRevisionRequest);
  const catalogs = useCatalogStore((s) => s.catalogs);
  const allQuestions = useCatalogStore((s) => s.questions);
  const allRevisionRequests = useCatalogStore((s) => s.revisionRequests);
  const loadApprovalLists = useApprovalStore((s) => s.loadLists);

  const fallbackCatalog = mockCatalogs.find((c) => c.id === id) ?? mockCatalogs[0];
  const catalog = useMemo(() => {
    const found = catalogs.find((c) => c.id === id);
    return found ?? fallbackCatalog;
  }, [catalogs, id, fallbackCatalog]);

  const conf = statusMap[catalog.status];

  const questions = useMemo(() => allQuestions.filter((q) => q.catalogId === catalog.id), [allQuestions, catalog.id]);
  const ownerAvatars: AvatarItem[] = useMemo(() => [{ id: catalog.owner.id, src: catalog.owner.avatar, name: catalog.owner.name }], [catalog.owner]);
  const reviewerAvatars: AvatarItem[] = useMemo(() => catalog.reviewers.map((u) => ({ id: u.id, src: u.avatar, name: u.name })), [catalog.reviewers]);
  const allAvatars = useMemo(() => [...ownerAvatars, ...reviewerAvatars], [ownerAvatars, reviewerAvatars]);

  const [actionOpen, setActionOpen] = useState(false);
  const [modal, setModal] = useState<ModalType>(null);
  const [questionText, setQuestionText] = useState('');
  const [revType, setRevType] = useState<RevType>('update');
  const [revReason, setRevReason] = useState('');
  const [revContent, setRevContent] = useState('');

  const actionItems: ActionSheetItem[] = [
    { id: 'question', label: '提交疑问', icon: <HelpCircle size={18} strokeWidth={2} /> },
    { id: 'revision', label: '修订申请', icon: <FileEdit size={18} strokeWidth={2} /> },
    { id: 'share', label: '分享', icon: <Share2 size={18} strokeWidth={2} /> },
  ];

  const handleSubmitQuestion = () => {
    if (!questionText.trim()) {
      showToast('请填写疑问内容', 'warning');
      return;
    }
    addQuestion({
      catalogId: catalog.id,
      question: questionText.trim(),
      screenshots: [],
      asker: mockCurrentUser,
    });
    addOperationLog('提交', '口径疑问', catalog.metricName, questionText.trim());
    setQuestionText('');
    setModal(null);
    showToast('疑问提交成功，负责人会尽快回复', 'success');
  };

  const handleSubmitRevision = () => {
    if (!revReason.trim() || !revContent.trim()) {
      showToast('请填写变更原因和建议内容', 'warning');
      return;
    }
    addRevisionRequest({
      catalogId: catalog.id,
      type: revType,
      reason: revReason.trim(),
      suggestedContent: revContent.trim(),
      applicant: mockCurrentUser,
    });
    loadApprovalLists();
    addOperationLog('发起', '修订申请', catalog.metricName, `${revTypeMap[revType]}: ${revReason.trim()}`);
    setRevReason('');
    setRevContent('');
    setRevType('update');
    setModal(null);
    showToast('修订申请已提交，请在审批中心查看进度', 'success');
  };

  return (
    <div className="min-h-screen bg-[#0F1326] pb-28">
      <TopBar
        title={catalog.metricName}
        showBack
        onBack={() => navigate(-1)}
        actions={['more']}
        onAction={() => setActionOpen(true)}
      />

      <div className="mx-auto max-w-md px-4 pt-4">
        <div className="rounded-2xl bg-gradient-to-br from-brand/20 via-background-card to-background-card border border-brand/10 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-white">{catalog.metricName}</h1>
                <span className="inline-flex items-center rounded-md bg-brand/15 px-2 py-0.5 text-[11px] font-semibold text-brand border border-brand/20">
                  {catalog.version}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StatusBadge status={conf.status} text={conf.text} size="sm" />
                <span className="text-[11px] text-white/40 flex items-center gap-1">
                  <Clock size={12} />
                  更新于 {catalog.updatedAt.slice(0, 10)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle icon={<BookOpen size={14} />} title="基本信息" />
          <div className="space-y-3">
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              <div className="text-[11px] font-medium text-white/40 mb-1.5">口径定义</div>
              <p className="text-xs text-white/70 leading-relaxed">{catalog.definition}</p>
            </div>
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              <div className="text-[11px] font-medium text-white/40 mb-1.5">计算公式</div>
              <pre className="rounded-lg bg-[#0a0e20] p-3 text-[11px] text-cyan-300 overflow-x-auto border border-white/5 font-mono leading-relaxed">
                {catalog.formula}
              </pre>
            </div>
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 mb-2">
                <Database size={12} /> 数据来源
              </div>
              <p className="text-xs text-white/70 leading-relaxed">{catalog.dataSource}</p>
              <div className="mt-2 inline-flex items-center rounded-md bg-warning/10 px-2 py-0.5 text-[10px] text-warning border border-warning/20">
                更新频率：{catalog.updateFrequency}
              </div>
            </div>
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 mb-2">
                <Tag size={12} /> 统计维度
              </div>
              <div className="flex flex-wrap gap-1.5">
                {catalog.dimensions.map((d) => (
                  <span key={d} className="inline-flex items-center rounded-md bg-white/5 px-2 py-1 text-[11px] text-white/70 border border-white/5">
                    {d}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-xl bg-background-card border border-white/5 p-4">
              <div className="flex items-center gap-1.5 text-[11px] font-medium text-white/40 mb-2.5">
                <Users size={12} /> 口径负责人
              </div>
              <AvatarGroup avatars={allAvatars} size="md" max={5} />
            </div>
          </div>
        </div>

        <div className="mt-5">
          <SectionTitle icon={<FileEdit size={14} />} title="修订历史" />
          <div className="relative rounded-xl bg-background-card border border-white/5 p-4 pl-6">
            <div className="absolute left-3.5 top-5 bottom-5 w-px bg-white/10" />
            {catalog.history.map((h, i) => (
              <div key={h.id} className="relative pb-4 last:pb-0">
                <div className="absolute -left-3.5 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-background-card border-2 border-white/10">
                  <div className={cn('h-1.5 w-1.5 rounded-full', i === 0 ? 'bg-brand' : 'bg-white/30')} />
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={cn('inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium', revTypeColor[h.changeType])}>
                    {revTypeMap[h.changeType]}
                  </span>
                  <span className="text-xs font-semibold text-white">{h.version}</span>
                </div>
                <p className="mt-1 text-xs text-white/60">{h.changeContent}</p>
                <div className="mt-1.5 text-[10px] text-white/30">
                  {h.operator.name} · {h.operatedAt.slice(0, 10)}
                </div>
              </div>
            ))}
          </div>
        </div>

        <RevisionRequestsSection catalogId={catalog.id} />

        <div className="mt-5">
          <SectionTitle icon={<HelpCircle size={14} />} title={`相关疑问 (${questions.length})`} />
          {questions.length > 0 ? (
            <div className="space-y-2">
              {questions.map((q) => <QuestionItem key={q.id} q={q} />)}
            </div>
          ) : (
            <div className="rounded-xl bg-white/[0.02] border border-white/5 p-8 text-center">
              <HelpCircle size={32} className="text-white/20 mx-auto mb-2" />
              <p className="text-xs text-white/40">暂无疑问，点击下方按钮提出第一个问题</p>
            </div>
          )}
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0F1326]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-md flex gap-2">
          <button
            type="button"
            onClick={() => setModal('question')}
            className="flex-1 min-h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/80 transition-all duration-300 ease-out hover:bg-white/10 active:scale-[0.98]"
          >
            提交疑问
          </button>
          <button
            type="button"
            onClick={() => setModal('revision')}
            className="flex-1 min-h-11 rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/30 transition-all duration-300 ease-out hover:bg-brand/90 active:scale-[0.98]"
          >
            发起修订
          </button>
        </div>
      </div>

      <ActionSheet
        open={actionOpen}
        onClose={() => setActionOpen(false)}
        items={actionItems}
        onSelect={(item) => {
          if (item.id === 'question') setModal('question');
          else if (item.id === 'revision') setModal('revision');
        }}
        title="更多操作"
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center animate-fade-in">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="relative w-full max-w-md rounded-t-2xl bg-[#1A1F36] border-t border-white/5 animate-slide-up pb-safe">
            <div className="mx-auto mt-3 h-1 w-10 rounded-full bg-white/10" />
            <div className="relative px-5 pb-5 pt-4">
              <button type="button" onClick={() => setModal(null)} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/40 hover:text-white">
                <X size={18} />
              </button>
              <h3 className="text-base font-semibold text-white pr-10">
                {modal === 'question' ? '提交疑问' : '修订申请'}
              </h3>
              <p className="mt-1 text-xs text-white/40 pr-10">
                {modal === 'question' ? '描述您的问题，口径负责人将尽快回复' : '申请修订此口径，需说明原因及建议内容'}
              </p>
            </div>
            <div className="px-5 pb-5 space-y-3">
              {modal === 'question' ? (
                <>
                  <textarea
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    rows={5}
                    placeholder="请描述您的问题..."
                    className="w-full rounded-xl bg-background-card border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none"
                  />
                  <button type="button" className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/5 border border-dashed border-white/10 text-xs text-white/50 hover:bg-white/10 hover:text-white/70">
                    <Upload size={16} /> 上传截图（可选）
                  </button>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-[11px] font-medium text-white/50 mb-2">变更类型</div>
                    <div className="flex gap-1 rounded-xl bg-white/5 p-1">
                      {(['create', 'update', 'deprecate'] as RevType[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setRevType(t)}
                          className={cn(
                            'flex-1 min-h-9 rounded-lg text-xs font-medium transition-all duration-300',
                            revType === t ? 'bg-brand text-white shadow' : 'text-white/60 hover:text-white/80',
                          )}
                        >
                          {t === 'create' ? '新增' : t === 'update' ? '修改' : '废弃'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    value={revReason}
                    onChange={(e) => setRevReason(e.target.value)}
                    rows={3}
                    placeholder="变更原因..."
                    className="w-full rounded-xl bg-background-card border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none"
                  />
                  <textarea
                    value={revContent}
                    onChange={(e) => setRevContent(e.target.value)}
                    rows={4}
                    placeholder="建议内容..."
                    className="w-full rounded-xl bg-background-card border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none"
                  />
                </>
              )}
              <button
                type="button"
                onClick={modal === 'question' ? handleSubmitQuestion : handleSubmitRevision}
                className="min-h-11 w-full rounded-xl bg-brand text-sm font-semibold text-white shadow-lg shadow-brand/30 hover:bg-brand/90 active:scale-[0.98]"
              >
                提交
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
