import { ChatConversation } from "@/types";
import { Markdown, CopyButton, ScrollArea, Button } from "@/components";
import {
  BotIcon,
  HeadphonesIcon,
  Loader2,
  SparklesIcon,
  ArrowDownIcon,
  ClockIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

type Props = {
  lastTranscription: string;
  lastAIResponse: string;
  isAIProcessing: boolean;
  conversation: ChatConversation;
  conversationMode: boolean;
  setConversationMode: (mode: boolean) => void;
};

function formatTime(timestamp: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const ResultsSection = ({
  lastTranscription,
  lastAIResponse,
  isAIProcessing,
  conversation,
  conversationMode,
  setConversationMode,
}: Props) => {
  const hasLive = !!(lastAIResponse || isAIProcessing);

  // history = all messages after the first two (which are the current live turn)
  // messages are prepended newest-first: [latestUser, latestAssistant, olderUser, olderAssistant, ...]
  const historyMessages = conversation.messages.slice(2);
  const hasPreviousTurns = historyMessages.length > 0;

  // Group history into turns: pair user+assistant together
  const historyTurns: Array<{ user: (typeof historyMessages)[0]; assistant?: (typeof historyMessages)[0] }> = [];
  const sorted = [...historyMessages].sort((a, b) => b.timestamp - a.timestamp);
  for (let i = 0; i < sorted.length; i += 2) {
    const first = sorted[i];
    const second = sorted[i + 1];
    if (first?.role === "assistant") {
      historyTurns.push({ assistant: first, user: second });
    } else {
      historyTurns.push({ user: first, assistant: second });
    }
  }

  const liveScrollRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollPaused, setAutoScrollPaused] = useState(false);
  const [showJumpBtn, setShowJumpBtn] = useState(false);

  const getLiveViewport = () =>
    liveScrollRef.current?.querySelector(
      "[data-slot='scroll-area-viewport']"
    ) as HTMLElement | null;

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    const vp = getLiveViewport();
    if (!vp) return;
    vp.scrollTo({ top: vp.scrollHeight, behavior });
  };

  // Attach scroll listener (unconditional hook)
  useEffect(() => {
    if (!hasLive) return;
    const vp = getLiveViewport();
    if (!vp) return;
    const threshold = 24;
    const onScroll = () => {
      const dist = vp.scrollHeight - vp.scrollTop - vp.clientHeight;
      setAutoScrollPaused(dist > threshold);
      setShowJumpBtn(dist > threshold);
    };
    onScroll();
    vp.addEventListener("scroll", onScroll, { passive: true });
    return () => vp.removeEventListener("scroll", onScroll);
  }, [hasLive]);

  // Auto-scroll on new content (unconditional hook)
  useEffect(() => {
    if (!hasLive || autoScrollPaused) return;
    const frame = requestAnimationFrame(() => scrollToBottom("auto"));
    return () => cancelAnimationFrame(frame);
  }, [lastAIResponse, isAIProcessing, hasLive, autoScrollPaused]);

  // Nothing to show
  if (!hasLive && !lastTranscription && !hasPreviousTurns) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">

      {/* ── LIVE RESPONSE ── */}
      {(hasLive || lastTranscription) && (
        <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/30">
            <div className="flex items-center gap-1.5">
              <SparklesIcon className="w-3.5 h-3.5 text-primary" />
              <span className="text-[11px] font-semibold tracking-wide text-foreground">
                Live Response
              </span>
              {isAIProcessing && (
                <Loader2 className="h-3 w-3 animate-spin text-muted-foreground ml-1" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {showJumpBtn && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-5 px-2 text-[10px] gap-1"
                  onClick={() => {
                    setAutoScrollPaused(false);
                    setShowJumpBtn(false);
                    scrollToBottom();
                  }}
                >
                  <ArrowDownIcon className="h-2.5 w-2.5" />
                  Latest
                </Button>
              )}
              {lastAIResponse && <CopyButton content={lastAIResponse} />}
            </div>
          </div>

          <div className="p-3 space-y-2.5">
            {/* Current transcription (what was said) */}
            {lastTranscription && (
              <div className="flex gap-2 items-start">
                <div className="flex items-center gap-1 pt-0.5 shrink-0">
                  <HeadphonesIcon className="h-3 w-3 text-primary" />
                  <span className="text-[9px] font-semibold text-primary uppercase tracking-wider">
                    You
                  </span>
                </div>
                <p className="text-[12px] leading-relaxed text-muted-foreground break-words min-w-0 flex-1">
                  {lastTranscription}
                </p>
              </div>
            )}

            {/* Current AI response (streaming) */}
            {hasLive && (
              <div className="flex gap-2 items-start">
                <div className="flex items-center gap-1 pt-0.5 shrink-0">
                  <BotIcon className="h-3 w-3 text-blue-500" />
                  <span className="text-[9px] font-semibold text-blue-500 uppercase tracking-wider">
                    AI
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  {isAIProcessing && !lastAIResponse ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <span className="text-[11px] text-muted-foreground italic">
                        Generating response…
                      </span>
                    </div>
                  ) : (
                    <ScrollArea ref={liveScrollRef} className="max-h-52">
                      <div
                        className={cn(
                          "text-[12px] leading-[1.75] text-foreground break-words",
                          "space-y-2 pr-2",
                          // Fixes prose element spacing
                          "[&_p]:mb-2 [&_p:last-child]:mb-0",
                          "[&_ul]:pl-4 [&_ul]:space-y-1 [&_li]:leading-relaxed",
                          "[&_ol]:pl-4 [&_ol]:space-y-1",
                          "[&_h1]:text-sm [&_h1]:font-semibold [&_h1]:mt-2",
                          "[&_h2]:text-[12px] [&_h2]:font-semibold [&_h2]:mt-2",
                          "[&_h3]:text-[11px] [&_h3]:font-semibold [&_h3]:mt-1",
                          "[&_code]:text-[11px] [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded",
                          "[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:p-2 [&_pre]:text-[11px]",
                          "dark:text-foreground"
                        )}
                      >
                        <Markdown isStreaming={isAIProcessing}>
                          {lastAIResponse}
                        </Markdown>
                        {isAIProcessing && (
                          <span className="inline-block w-1.5 h-3.5 bg-primary animate-pulse ml-0.5 align-middle rounded-sm" />
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PREVIOUS TURNS ── */}
      {hasPreviousTurns && (
        <div className="rounded-lg border border-border/40 bg-muted/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/30">
            <div className="flex items-center gap-1.5">
              <ClockIcon className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                Previous Turns
              </span>
              <span className="text-[9px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full">
                {historyTurns.length}
              </span>
            </div>
          </div>

          {/* Scrollable history */}
          <ScrollArea className="max-h-64">
            <div className="px-3 py-2 space-y-3">
              {historyTurns.map((turn, idx) => (
                <div
                  key={idx}
                  className="space-y-2 pb-3 border-b border-border/30 last:border-0 last:pb-0"
                >
                  {/* User side */}
                  {turn.user && (
                    <div className="flex gap-2 items-start">
                      <div className="flex items-center gap-1 pt-0.5 shrink-0">
                        <HeadphonesIcon className="h-2.5 w-2.5 text-primary/70" />
                        <span className="text-[9px] font-semibold text-primary/70 uppercase tracking-wider">
                          You
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] leading-relaxed text-muted-foreground break-words">
                          {turn.user.content}
                        </p>
                        {turn.user.timestamp > 0 && (
                          <span className="text-[9px] text-muted-foreground/40 mt-0.5 block">
                            {formatTime(turn.user.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  {/* Assistant side */}
                  {turn.assistant && (
                    <div className="flex gap-2 items-start">
                      <div className="flex items-center gap-1 pt-0.5 shrink-0">
                        <BotIcon className="h-2.5 w-2.5 text-blue-400" />
                        <span className="text-[9px] font-semibold text-blue-400 uppercase tracking-wider">
                          AI
                        </span>
                      </div>
                      <div
                        className={cn(
                          "min-w-0 flex-1 text-[11px] leading-[1.7] text-muted-foreground break-words",
                          "[&_p]:mb-1.5 [&_p:last-child]:mb-0",
                          "[&_ul]:pl-3.5 [&_ul]:space-y-0.5 [&_li]:leading-relaxed",
                          "[&_ol]:pl-3.5 [&_ol]:space-y-0.5",
                          "[&_code]:text-[10px] [&_code]:bg-muted [&_code]:px-1 [&_code]:rounded",
                          "[&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:p-1.5 [&_pre]:text-[10px]",
                        )}
                      >
                        <Markdown>{turn.assistant.content}</Markdown>
                        {turn.assistant.timestamp > 0 && (
                          <span className="text-[9px] text-muted-foreground/40 mt-1 block">
                            {formatTime(turn.assistant.timestamp)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
