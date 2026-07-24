import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';
const suggestedQuestions = [
  'What services do you offer?',
  'How can I start a project?',
  'How can I contact ZeroOne?',
  'Where is ZeroOne based?'
];
const chatMessagesStorageKey = 'zerooneChatMessages';
const typingIndicatorDelayMs = 3000;
const typingCharacterDelayMs = 18;
const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    text: 'Hi, I can answer questions from the ZeroOne knowledge base.',
    timestamp: Date.now()
  }
];

function createSessionId() {
  const existingSession = window.sessionStorage.getItem('zerooneChatSessionId');

  if (existingSession) {
    return existingSession;
  }

  const sessionId = `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  window.sessionStorage.setItem('zerooneChatSessionId', sessionId);
  return sessionId;
}

function loadStoredMessages() {
  try {
    const storedMessages = window.sessionStorage.getItem(chatMessagesStorageKey);

    if (!storedMessages) {
      return initialMessages;
    }

    const parsedMessages = JSON.parse(storedMessages);

    if (!Array.isArray(parsedMessages) || !parsedMessages.length) {
      return initialMessages;
    }

    return parsedMessages;
  } catch {
    return initialMessages;
  }
}

function formatMessageTime(timestamp) {
  if (!timestamp) {
    return '';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(timestamp));
}

function ChatWidget() {
  const sessionId = useMemo(() => createSessionId(), []);
  const messagesEndRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTypingAnswer, setIsTypingAnswer] = useState(false);
  const [messages, setMessages] = useState(() => loadStoredMessages());

  useEffect(() => {
    window.sessionStorage.setItem(chatMessagesStorageKey, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end'
    });
  }, [isOpen, isSending, messages]);

  useEffect(() => {
    document.body.classList.toggle('chat-widget-open', isOpen);

    return () => {
      document.body.classList.remove('chat-widget-open');
    };
  }, [isOpen]);

  async function typeAssistantAnswer(answer) {
    const messageId = `assistant-${Date.now()}`;

    setIsTypingAnswer(true);
    setMessages((current) => [
      ...current,
      {
        id: messageId,
        role: 'assistant',
        text: '',
        timestamp: Date.now()
      }
    ]);

    for (let index = 1; index <= answer.length; index += 1) {
      await new Promise((resolve) => setTimeout(resolve, typingCharacterDelayMs));
      const partialAnswer = answer.slice(0, index);

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: partialAnswer
              }
            : message
        )
      );
    }

    setIsTypingAnswer(false);
  }

  async function sendMessage(message) {
    const trimmedMessage = message.trim();

    if (!trimmedMessage || isSending) {
      return;
    }

    setInput('');
    setIsSending(true);
    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        text: trimmedMessage,
        timestamp: Date.now()
      }
    ]);

    try {
      const response = await fetch(`${apiBaseUrl}/api/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: trimmedMessage
        })
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(payload?.message || 'Chat is unavailable right now.');
      }

      await new Promise((resolve) => setTimeout(resolve, typingIndicatorDelayMs));
      await typeAssistantAnswer(payload.answer);
    } catch (error) {
      await new Promise((resolve) => setTimeout(resolve, typingIndicatorDelayMs));
      await typeAssistantAnswer(error instanceof Error ? error.message : 'Chat is unavailable right now.');
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    await sendMessage(input);
  }

  const widget = (
    <div className="fixed bottom-5 right-5 z-[120] flex flex-col items-end gap-4">
      {isOpen ? (
        <section className="w-[calc(100vw-2.5rem)] max-w-sm overflow-hidden rounded-lg border border-blue-200/20 bg-slate-950/95 text-white shadow-2xl shadow-slate-950/50 backdrop-blur-xl">
          <header className="flex items-center justify-between border-b border-blue-200/10 bg-white/[0.04] px-4 py-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-300">ZeroOne Chat</p>
              <p className="text-sm text-slate-300">AI Assistant</p>
            </div>
            <button
              className="grid h-9 w-9 place-items-center rounded-md border border-blue-200/10 text-slate-300 transition hover:bg-white/10 hover:text-white"
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
            >
              x
            </button>
          </header>

          <div className="flex h-96 flex-col gap-3 overflow-y-auto px-4 py-4 [scrollbar-color:rgba(34,211,238,0.55)_rgba(15,23,42,0.65)] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-slate-900/70 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-slate-950 [&::-webkit-scrollbar-thumb]:bg-cyan-400/60 [&::-webkit-scrollbar-thumb:hover]:bg-cyan-300/80">
            {messages.map((message) => (
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-6 ${
                  message.role === 'user'
                    ? 'ml-auto bg-blue-500 text-white'
                    : 'mr-auto border border-blue-200/10 bg-white/[0.06] text-slate-100'
                }`}
                key={message.id}
              >
                <p>{message.text}</p>
                {message.timestamp ? (
                  <time
                    className={`mt-1 block text-[10px] leading-none ${
                      message.role === 'user' ? 'text-blue-100/75' : 'text-slate-500'
                    }`}
                    dateTime={new Date(message.timestamp).toISOString()}
                  >
                    {formatMessageTime(message.timestamp)}
                  </time>
                ) : null}
              </div>
            ))}
            {messages.length === 1 ? (
              <div className="mr-auto grid w-full gap-2 pt-1">
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Frequently Asked
                </p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((question) => (
                    <button
                      className="rounded-full border border-blue-200/15 bg-white/[0.05] px-3 py-2 text-left text-xs font-semibold text-slate-200 transition hover:border-blue-300/40 hover:bg-blue-500/15 hover:text-white disabled:cursor-wait disabled:opacity-60"
                      key={question}
                      type="button"
                      onClick={() => sendMessage(question)}
                      disabled={isSending}
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {isSending && !isTypingAnswer ? (
              <div className="mr-auto flex items-center gap-2 rounded-lg border border-blue-200/10 bg-white/[0.06] px-3 py-3 text-sm text-slate-300">
                <span>Typing</span>
                <span className="flex gap-1" aria-hidden="true">
                  <span className="h-1.5 w-1.5 animate-[chatTypingBounce_1.15s_ease-in-out_infinite] rounded-full bg-cyan-300" />
                  <span className="h-1.5 w-1.5 animate-[chatTypingBounce_1.15s_ease-in-out_infinite] rounded-full bg-cyan-300 [animation-delay:0.16s]" />
                  <span className="h-1.5 w-1.5 animate-[chatTypingBounce_1.15s_ease-in-out_infinite] rounded-full bg-cyan-300 [animation-delay:0.32s]" />
                </span>
              </div>
            ) : null}
            <div ref={messagesEndRef} />
          </div>

          <form className="flex items-center gap-2 border-t border-blue-200/10 p-3" onSubmit={handleSubmit}>
            <input
              className="h-12 min-w-0 flex-1 rounded-md border border-blue-200/10 bg-white/[0.07] px-4 text-sm leading-none text-white outline-none transition placeholder:text-slate-500 focus:border-blue-300 focus:bg-white/[0.1]"
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about services..."
              aria-label="Chat message"
            />
            <button
              className="h-12 shrink-0 rounded-md bg-cyan-400 px-5 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60"
              type="submit"
              disabled={isSending}
            >
              Send
            </button>
          </form>
        </section>
      ) : null}

      <button
        className="flex h-14 items-center gap-3 rounded-full border border-blue-200/20 bg-blue-500 px-5 font-bold text-white shadow-xl shadow-blue-950/40 transition hover:-translate-y-0.5 hover:bg-blue-400"
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open chat"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-white/15">AI</span>
        Chat
      </button>
    </div>
  );

  return createPortal(widget, document.body);
}

export default ChatWidget;
