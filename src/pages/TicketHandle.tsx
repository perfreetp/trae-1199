import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, X, Clock, FileText, AlertCircle, Lightbulb, Image as ImgIcon, Timer } from 'lucide-react';
import { TopBar } from '@/components/TopBar';
import { cn } from '@/lib/utils';

type RootCauseType = 'data' | 'business' | 'system' | 'other';

const ROOT_CAUSE_TABS: { key: RootCauseType; label: string; icon: React.ReactNode }[] = [
  { key: 'data', label: '数据问题', icon: <FileText size={14} /> },
  { key: 'business', label: '业务问题', icon: <AlertCircle size={14} /> },
  { key: 'system', label: '系统问题', icon: <Lightbulb size={14} /> },
  { key: 'other', label: '其他', icon: <Clock size={14} /> },
];

function FormLabel({ icon, children, required }: { icon?: React.ReactNode; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="mb-2 flex items-center gap-1.5">
      {icon}
      <span className="text-[11px] font-medium text-white/60">{children}</span>
      {required && <span className="text-danger">*</span>}
    </div>
  );
}

export default function TicketHandle() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [rootCause, setRootCause] = useState<RootCauseType>('data');
  const [reason, setReason] = useState('');
  const [solution, setSolution] = useState('');
  const [hours, setHours] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const addImage = () => {
    if (images.length >= 9) return;
    setImages([...images, `img_${Date.now()}`]);
  };
  const removeImage = (idx: number) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  const handleSave = () => navigate(-1);
  const handleSubmit = () => navigate(`/tickets/${id}`);

  return (
    <div className="min-h-screen bg-[#0F1326] pb-28">
      <TopBar
        title="处理工单"
        showBack
        onBack={() => navigate(-1)}
        actions={[]}
        onAction={() => {}}
      />

      <div className="mx-auto max-w-md px-4 pt-4 space-y-4">
        <div className="rounded-xl bg-background-card border border-white/5 p-4">
          <FormLabel icon={<AlertCircle size={12} className="text-brand" />} required>
            根因分析
          </FormLabel>
          <div className="flex flex-wrap gap-1.5 rounded-xl bg-white/5 p-1.5">
            {ROOT_CAUSE_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRootCause(tab.key)}
                className={cn(
                  'flex-1 min-w-[calc(50%-0.375rem)] min-h-9 rounded-lg text-xs font-medium transition-all duration-300 flex items-center justify-center gap-1.5',
                  rootCause === tab.key ? 'bg-brand text-white shadow' : 'text-white/60 hover:text-white/80',
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl bg-background-card border border-white/5 p-4">
          <FormLabel icon={<FileText size={12} className="text-brand" />} required>
            详细原因描述
          </FormLabel>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={5}
            placeholder="请详细描述异常产生的根本原因..."
            className="w-full rounded-xl bg-[#0a0e20] border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none leading-relaxed"
          />
        </div>

        <div className="rounded-xl bg-background-card border border-white/5 p-4">
          <FormLabel icon={<Lightbulb size={12} className="text-brand" />} required>
            解决方案
          </FormLabel>
          <textarea
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            rows={5}
            placeholder="请描述处理措施、解决方案..."
            className="w-full rounded-xl bg-[#0a0e20] border border-white/5 p-3 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50 resize-none leading-relaxed"
          />
        </div>

        <div className="rounded-xl bg-background-card border border-white/5 p-4">
          <FormLabel icon={<ImgIcon size={12} className="text-brand" />}>
            上传凭证（{images.length}/9）
          </FormLabel>
          <div className="grid grid-cols-3 gap-2">
            {images.map((_, i) => (
              <div key={i} className="relative aspect-square rounded-lg bg-white/5 border border-white/10 overflow-hidden">
                <div className="h-full w-full bg-gradient-to-br from-brand/20 to-white/5 flex items-center justify-center">
                  <ImgIcon size={20} className="text-white/30" />
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white/80 hover:bg-black/80"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            {images.length < 9 && (
              <button
                type="button"
                onClick={addImage}
                className="aspect-square rounded-lg bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center justify-center gap-1 text-white/30 hover:bg-white/5 hover:text-white/50 hover:border-white/20 transition-all duration-300"
              >
                <Plus size={18} strokeWidth={2} />
                <span className="text-[10px]">添加图片</span>
              </button>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-background-card border border-white/5 p-4">
          <FormLabel icon={<Timer size={12} className="text-brand" />} required>
            处理耗时（小时）
          </FormLabel>
          <div className="relative">
            <input
              type="number"
              min="0"
              step="0.5"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="例如：2.5"
              className="w-full min-h-11 rounded-xl bg-[#0a0e20] border border-white/5 px-3 pr-12 text-xs text-white placeholder:text-white/30 outline-none focus:ring-2 focus:ring-brand/50"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-white/40">小时</span>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/5 bg-[#0F1326]/95 backdrop-blur-md px-4 py-3">
        <div className="mx-auto max-w-md flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 min-h-11 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white active:scale-[0.98] transition-all duration-300"
          >
            暂存
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="flex-[1.5] min-h-11 rounded-xl bg-gradient-to-r from-brand to-brand/80 text-sm font-semibold text-white shadow-xl shadow-brand/30 hover:brightness-110 active:scale-[0.98] transition-all duration-300"
          >
            提交完成
          </button>
        </div>
      </div>
    </div>
  );
}
