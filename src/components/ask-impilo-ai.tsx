import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Send, X, Wrench, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";

const SUGGESTIONS = [
  "Which patients are currently admitted at Life Fourways?",
  "Show me pending authorisations and their amounts.",
  "Look up patient P-10241 and summarise their status.",
  "What are today's platform KPIs?",
];

export function AskImpiloAI() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-glow transition-transform hover:scale-[1.02] active:scale-100"
      >
        <Sparkles className="h-4 w-4" />
        Ask Impilo AI
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
          <ChatPanel onClose={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function ChatPanel({ onClose }: { onClose: () => void }) {
  const [transport] = useState(() => new DefaultChatTransport({ api: "/api/chat" }));
  const [chatId, setChatId] = useState(() => crypto.randomUUID());
  const { messages, sendMessage, status, error, setMessages } = useChat({
    id: chatId,
    transport,
  });
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    inputRef.current?.focus();
  }, [chatId, busy]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const submit = async (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    setInput("");
    await sendMessage({ text: t });
  };

  return (
    <>
      <SheetHeader className="border-b border-border p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-primary">
              <Sparkles className="h-3 w-3" /> Impilo AI · Assistant
            </div>
            <SheetTitle className="font-display text-2xl">Ask Impilo AI</SheetTitle>
            <SheetDescription>
              Ask about patients, admissions, authorisations, wards or KPIs across Life Healthcare.
            </SheetDescription>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="New chat"
              onClick={() => {
                setMessages([]);
                setChatId(crypto.randomUUID());
              }}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </SheetHeader>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto bg-muted/20 p-4">
        {messages.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Try one of these:</p>
            <div className="flex flex-col gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => submit(s)}
                  className="rounded-xl border border-border bg-card/60 p-3 text-left text-sm hover:border-primary/40 hover:bg-card"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}

        {status === "submitted" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Impilo AI is thinking…
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
            {error.message || "The assistant hit an error. Please try again."}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit(input);
        }}
        className="border-t border-border bg-background p-3"
      >
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void submit(input);
              }
            }}
            placeholder="Ask about a patient, admission, KPI…"
            rows={1}
            className="max-h-40 flex-1 resize-none rounded-xl border border-border bg-card/60 px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/70 focus:border-primary/40"
          />
          <Button type="submit" disabled={busy || !input.trim()} className="bg-gradient-primary shadow-glow hover:opacity-90">
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-1.5 text-[10px] text-muted-foreground">
          Impilo AI can look up demo records via built-in tools. Not for clinical decisions.
        </div>
      </form>
    </>
  );
}

function MessageBubble({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";
  const text = message.parts
    .map((p) => (p.type === "text" ? p.text : ""))
    .join("")
    .trim();
  const toolParts = message.parts.filter((p) => p.type.startsWith("tool-"));

  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm shadow-soft " +
          (isUser
            ? "bg-primary text-primary-foreground"
            : "border border-border bg-card text-foreground")
        }
      >
        {toolParts.length > 0 && (
          <div className="mb-2 space-y-1">
            {toolParts.map((p, i) => {
              const name = p.type.replace(/^tool-/, "");
              const state = (p as { state?: string }).state ?? "call";
              return (
                <div
                  key={i}
                  className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1 text-[10px] font-medium text-muted-foreground"
                >
                  <Wrench className="h-3 w-3" />
                  <span className="font-mono">{name}</span>
                  <span className="opacity-70">· {state}</span>
                </div>
              );
            })}
          </div>
        )}
        {text && (
          <div
            className={
              "prose prose-sm max-w-none " +
              (isUser ? "prose-invert" : "dark:prose-invert") +
              " prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-table:my-2 prose-headings:mb-1"
            }
          >
            <ReactMarkdown>{text}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}
