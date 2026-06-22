import {
  parseInlineMarkdown,
  splitMarkdownParagraphs,
} from "@/utils/markdown";

function renderInlinePart(part) {
  if (typeof part === "string") return part;

  switch (part.type) {
    case "strong":
      return (
        <strong key={part.key} className="font-semibold">
          {part.text}
        </strong>
      );
    case "em":
      return (
        <em key={part.key} className="italic">
          {part.text}
        </em>
      );
    case "code":
      return (
        <code
          key={part.key}
          className="rounded px-1 py-0.5 text-[0.85em] bg-black/8 font-medium"
        >
          {part.text}
        </code>
      );
    default:
      return part.text ?? null;
  }
}

function renderParagraph(text, index) {
  const lines = text.split("\n");

  return (
    <p key={`p-${index}`} className="mb-2 last:mb-0">
      {lines.map((line, lineIndex) => (
        <span key={`p-${index}-l-${lineIndex}`}>
          {lineIndex > 0 && <br />}
          {parseInlineMarkdown(line, `p-${index}-l-${lineIndex}`).map(
            renderInlinePart,
          )}
        </span>
      ))}
    </p>
  );
}

export default function MarkdownContent({ content, inverted = false }) {
  const paragraphs = splitMarkdownParagraphs(content);

  if (paragraphs.length === 0) {
    return <p className="whitespace-pre-wrap">{content}</p>;
  }

  return (
    <div
      className={
        "chat-markdown text-sm leading-relaxed " +
        (inverted ? "chat-markdown-inverted" : "")
      }
    >
      {paragraphs.map(renderParagraph)}
    </div>
  );
}
