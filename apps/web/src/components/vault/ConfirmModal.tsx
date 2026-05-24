'use client';

interface Props {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title, message,
  confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = true, onConfirm, onCancel,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onCancel} />
      <div className="relative bg-bg-elev rounded-2xl shadow-2xl w-full max-w-[300px] mx-4 p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-[16px] font-semibold text-ink mb-1.5">{title}</h3>
          <p className="text-[13.5px] text-ink-3 leading-relaxed">{message}</p>
        </div>
        <div className="flex flex-col gap-2.5">
          <button
            onClick={onConfirm}
            className={`w-full py-3 rounded-full text-[14px] font-medium transition-colors ${
              danger ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-accent text-accent-ink hover:brightness-95'
            }`}
          >
            {confirmLabel}
          </button>
          <button
            onClick={onCancel}
            className="w-full py-3 rounded-full text-[14px] font-medium border border-rule text-ink-2 hover:bg-bg-sunk transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
