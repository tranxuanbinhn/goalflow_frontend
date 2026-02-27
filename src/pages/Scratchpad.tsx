import { useEffect, useMemo, useState } from 'react';
import GlassCard from '../components/ui/GlassCard';

const STORAGE_KEY = 'goalflow_scratchpad';

export default function Scratchpad() {
  const [content, setContent] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Stats
  const stats = useMemo(() => {
    const length = content.length;
    const lines = content.split('\n').length;
    const words = content.trim()
      ? content
          .trim()
          .split(/\s+/)
          .filter(Boolean).length
      : 0;
    return { length, lines, words };
  }, [content]);

  // Load initial content from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as { content?: string; updatedAt?: string };
        if (parsed.content) {
          setContent(parsed.content);
        }
        if (parsed.updatedAt) {
          setLastSavedAt(parsed.updatedAt);
        }
      }
    } catch {
      // ignore parse errors and start fresh
    }
  }, []);

  // Auto-save whenever content changes (debounced, and skip if unchanged)
  useEffect(() => {
    setIsSaving(true);

    const handle = setTimeout(() => {
      try {
        const existingRaw = localStorage.getItem(STORAGE_KEY);
        const existing = existingRaw ? (JSON.parse(existingRaw) as { content?: string; updatedAt?: string }) : null;

        if (existing && existing.content === content) {
          setIsSaving(false);
          return;
        }

        const payload = {
          content,
          updatedAt: new Date().toISOString(),
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        setLastSavedAt(payload.updatedAt);
      } catch {
        // ignore storage errors
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(handle);
  }, [content]);

  const handleClear = () => {
    setContent('');
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    setLastSavedAt(null);
  };

  const formattedLastSaved =
    lastSavedAt ? new Date(lastSavedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null;

  return (
    <div className="animate-fadeIn">
      <div className="mx-auto max-w-5xl space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold text-text-primary">Scratchpad</h1>
            <p className="text-text-secondary mt-1 text-sm md:text-base">
              Ghi nhanh ý tưởng, checklist, suy nghĩ tự do. Mọi thứ chỉ lưu cục bộ trên máy bạn.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            {formattedLastSaved && (
              <span className="text-xs md:text-sm px-2 py-1 rounded-full bg-black/5 dark:bg-white/5 text-text-muted">
                {isSaving ? 'Đang lưu…' : `Đã lưu lúc ${formattedLastSaved}`}
              </span>
            )}
            <button
              type="button"
              onClick={handleClear}
              className="px-3 md:px-4 py-2 rounded-lg text-xs md:text-sm font-medium border border-glass-border text-text-muted hover:text-text-primary hover:bg-black/[0.05] dark:hover:bg-white/5 transition-all"
            >
              Xoá hết
            </button>
          </div>
        </div>

        {/* Editor */}
        <GlassCard className="p-4 md:p-6 min-h-[420px] md:min-h-[520px]" hover={false}>
          {/* Top bar */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
            <div className="text-xs md:text-sm text-text-muted">
              <span>Nháp tự do – không có cấu trúc, cứ thoải mái gõ.</span>
            </div>
            <div className="flex flex-wrap gap-2 text-[11px] md:text-xs text-text-muted">
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/5">
                {stats.words} từ
              </span>
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/5">
                {stats.lines} dòng
              </span>
              <span className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/5">
                {stats.length} ký tự
              </span>
            </div>
          </div>

          {/* Textarea */}
          <div className="relative">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Bắt đầu gõ bất cứ thứ gì bạn muốn ghi nháp...
- Ý tưởng sản phẩm
- Việc cần làm trong ngày
- Ghi chú sau khi họp
- Câu quote, suy nghĩ lượm lặt"
              className="
                w-full min-h-[320px] md:min-h-[440px]
                bg-transparent outline-none resize-none
                focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0
                text-text-primary placeholder:text-text-muted
                text-sm md:text-base leading-relaxed
                font-mono md:font-sans
              "
            />

            {/* Saving indicator bottom-right */}
            <div className="pointer-events-none absolute bottom-2 right-2 text-[11px] text-text-muted/70">
              {isSaving ? 'Đang lưu…' : formattedLastSaved ? 'Đã lưu' : 'Chưa có gì để lưu'}
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

