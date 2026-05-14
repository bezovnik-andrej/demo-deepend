import { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User } from 'lucide-react';
import styles from './ChatPanel.module.css';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  options?: string[];
  timestamp: Date;
}

const WELCOME: Message = {
  id: 0,
  role: 'assistant',
  text: "Hi! I'm The Deep End's assistant. I can help with equipment sizing, code requirements, material selection, and project decisions. Ask me anything about your pool design.",
  timestamp: new Date(),
};

const SUGGESTIONS = [
  'Size the pump for this pool',
  'What gutter style do you recommend?',
  "What's missing in my config?",
  'Compare sand vs cartridge filter',
];

interface MockResponse {
  text: string;
  options?: string[];
}

const MOCK_RESPONSES: Record<string, MockResponse> = {
  'size the pump': {
    text: "Based on your pool specs (46,750 gal, 6h turnover), you need **130 GPM** minimum flow. I'd recommend a **2 HP variable-speed pump** — it handles the flow with headroom and saves ~60% on energy vs single-speed. Pentair IntelliFlo or Hayward MaxFlo VS are good options in your price range.",
    options: [
      'Switch pump to Pentair IntelliFlo',
      'Compare cost: Hayward vs Pentair for full mechanical',
      'Show me the flow calculations',
    ],
  },
  'gutter': {
    text: 'For a residential pool with an attached spa like yours, a **skimmer gutter** is the most common and cost-effective choice. Deck-level with grates gives a sleeker look but adds $3-5K. Given your 450 sq ft pool and budget, I\'d go with skimmer unless the client specifically wants the infinity-edge look.',
    options: [
      'Set gutter style to Skimmer',
      'Show me deck-level pricing',
      'Something else',
    ],
  },
  'missing': {
    text: "Looking at your config, you're missing:\n\n• **Pool Use Type** — needed for turnover calculations\n• **Interior Finish** — affects pricing significantly\n• **Waterline Tile** — required for finishes estimate\n• **Pipe Specifications** — below grade, above grade, heater loop\n\nWould you like me to open any of these steps?",
    options: [
      'Open Pool Use Type step',
      'Open Interior Finish step',
      'Auto-fill with residential defaults',
    ],
  },
  'filter': {
    text: "**Sand Filter** — Lower upfront cost ($800-1,200), easy maintenance, lasts 5-7 years between sand changes. Slightly lower filtration (20-40 microns). Best for budget-conscious residential.\n\n**Cartridge Filter** — Higher upfront ($1,000-1,800), no backwash waste, filters to 10-15 microns. Lower operating pressure saves pump energy. Best for eco-conscious or areas with water restrictions.\n\nFor your 46,750 gal pool, either works. Sand is the standard choice; cartridge if the client values water savings.",
    options: [
      'Go with Sand Filter',
      'Go with Cartridge Filter',
      'Compare total cost of ownership over 5 years',
    ],
  },
  'switch pump to pentair': {
    text: "Done — I've updated the pump selection to **Pentair IntelliFlo VSF 3HP**. This changes the budget by +$450 vs the previous selection. The equipment pad and plumbing connections remain compatible.",
    options: [
      'Show updated budget impact',
      'Undo this change',
    ],
  },
};

function findResponse(input: string): MockResponse {
  const lower = input.toLowerCase();
  for (const [key, val] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(key)) return val;
  }
  return {
    text: "I'd need to look into that based on your specific project data. Could you give me a bit more context about what you're trying to decide?",
    options: ['Show project summary', 'Open configuration'],
  };
}

export function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageIdRef = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const send = (text: string) => {
    if (!text.trim()) return;
    messageIdRef.current += 1;
    const userId = messageIdRef.current;
    const userMsg: Message = { id: userId, role: 'user', text: text.trim(), timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    const replyDelayMs = 800 + (userId % 7) * 85;
    setTimeout(() => {
      const response = findResponse(text);
      messageIdRef.current += 1;
      const aiMsg: Message = {
        id: messageIdRef.current,
        role: 'assistant',
        text: response.text,
        options: response.options,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, replyDelayMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.messages}>
        {messages.map((msg) => (
          <div key={msg.id} className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAi}`}>
            <div className={styles.msgIcon}>
              {msg.role === 'assistant' ? <Sparkles size={13} /> : <User size={13} />}
            </div>
            <div className={styles.msgBody}>
              <div className={styles.msgRole}>{msg.role === 'assistant' ? 'Deep End AI' : 'You'}</div>
              <div className={styles.msgText}>{msg.text}</div>
              {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                <div className={styles.options}>
                  {msg.options.map((opt) => (
                    <button
                      key={opt}
                      className={styles.optionBtn}
                      onClick={() => send(opt)}
                      disabled={isTyping}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.msg} ${styles.msgAi}`}>
            <div className={styles.msgIcon}><Sparkles size={13} /></div>
            <div className={styles.msgBody}>
              <div className={styles.msgRole}>Deep End AI</div>
              <div className={styles.typing}>
                <span /><span /><span />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {messages.length <= 1 && (
        <div className={styles.suggestions}>
          {SUGGESTIONS.map((s) => (
            <button key={s} className={styles.suggestion} onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}

      <div className={styles.inputBar}>
        <input
          ref={inputRef}
          className={styles.input}
          placeholder="Ask about your pool design..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className={styles.sendBtn}
          onClick={() => send(input)}
          disabled={!input.trim() || isTyping}
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}
