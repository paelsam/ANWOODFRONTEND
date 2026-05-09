const VARIANTS = {
  success: "bg-success text-white",
  info: "bg-info text-white",
  error: "bg-danger text-white",
};

export default function Notification({ notification }) {
  if (!notification) return null;
  const variant = VARIANTS[notification.type] || VARIANTS.success;
  return (
    <div
      className={
        "fixed top-20 right-6 z-[9999] max-w-xs px-5 py-3 rounded-md text-sm font-medium shadow-lg motion-safe:animate-slide-in " +
        variant
      }
      role="status"
    >
      {notification.msg}
    </div>
  );
}
