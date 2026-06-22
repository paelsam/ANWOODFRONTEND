import MarkdownContent from "@/components/chat/MarkdownContent";
import { LogIn } from "lucide-react";

export default function ChatMessage({
  role,
  content,
  capability,
  isError,
  requiresLogin,
  onLoginClick,
}) {
  const isUser = role === "user";
  const useMarkdown = !isUser && !isError;

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed " +
          (isUser
            ? "bg-primary text-white rounded-br-md"
            : isError
              ? "bg-danger/10 text-danger border border-danger/20 rounded-bl-md"
              : "bg-surface-2 text-text border border-border rounded-bl-md")
        }
      >
        {useMarkdown ? (
          <MarkdownContent content={content} />
        ) : (
          <p className="whitespace-pre-wrap">{content}</p>
        )}
        {requiresLogin && onLoginClick && (
          <button
            type="button"
            onClick={onLoginClick}
            className="btn btn-primary btn-sm mt-3 w-full"
          >
            <LogIn size={14} />
            Iniciar sesión
          </button>
        )}
        {!isUser && capability && !isError && (
          <p className="text-[10px] text-text-subtle mt-1.5 uppercase tracking-wide">
            {capability.replace(/_/g, " ")}
          </p>
        )}
      </div>
    </div>
  );
}
