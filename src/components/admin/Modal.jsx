import { X } from "lucide-react";

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-1000 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-display font-bold text-xl text-text">{title}</h2>
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-icon"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
