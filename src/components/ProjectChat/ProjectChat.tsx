import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Sparkles, ArrowRight, Check } from 'lucide-react';
import { useApp } from '../../store';
import type { ProjectData } from '../../types';
import { stripSimpleMarkdown } from '../../utils/chatDisplay';
import { getRecirculationLabels } from '../../data/recirculationOptions';
import { isSuperShallowPoolSection } from '../../data/poolSections';
import styles from './ProjectChat.module.css';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  options?: ChatOption[];
  field?: keyof ProjectData;
  multiSelect?: boolean;
}

interface ChatOption {
  label: string;
  value: string;
}

const UNSURE_VALUE = '__unsure__';

interface UnsureRecommendation {
  message: string;
  suggestedValue: string | string[];
  suggestedLabel: string;
}

interface ConversationStep {
  field: keyof ProjectData;
  question: string;
  options?: ChatOption[];
  multiSelect?: boolean;
  followUp?: (value: string, data: ProjectData) => string | null;
  skip?: (data: ProjectData) => boolean;
  unsureResponse?: (data: ProjectData) => UnsureRecommendation;
}

const CONVERSATION_FLOW: ConversationStep[] = [
  {
    field: 'projectName',
    question: "What's the name of this project? This could be a client name, address, or whatever helps you identify it.",
  },
  {
    field: 'projectType',
    question: 'What type of project is this?',
    options: [
      { label: 'New Construction', value: 'New Construction' },
      { label: 'Renovation', value: 'Renovation' },
      { label: 'Addition', value: 'Addition' },
    ],
  },
  {
    field: 'poolUseType',
    question: 'What will the pool primarily be used for?',
    options: [
      { label: 'Residential', value: 'Residential' },
      { label: 'Commercial', value: 'Commercial' },
      { label: 'Competition', value: 'Competition' },
      { label: 'Therapy / Rehab', value: 'Therapy' },
    ],
    followUp: (value) => {
      if (value === 'Commercial') return "Got it — commercial pools have stricter code requirements. I'll factor that in.";
      if (value === 'Competition') return 'Competition pool — that means specific dimensional requirements. Good to know early.';
      return null;
    },
  },
  {
    field: 'projectCity',
    question: 'Where is the project located? City and state is enough for now — we can add the full address later.',
  },
  {
    field: 'localCodeAwareness',
    question: 'Are you familiar with the local pool codes and regulations for this area?',
    options: [
      { label: "Yes, I know the local codes", value: 'yes' },
      { label: "No, I'll need to look into it", value: 'no' },
      { label: 'I need help figuring this out', value: 'help' },
    ],
    followUp: (value) => {
      if (value === 'help') return "No worries — we can flag code-related items as you configure the project. Local regulations often dictate things like barrier requirements, drain safety, and turnover rates.";
      if (value === 'no') return "That's fine for now. Just be aware that local codes can affect gutter type, drain configuration, and equipment sizing. You can revisit this in the configurator.";
      return null;
    },
  },
  {
    field: 'gutterStyle',
    question: "Let's talk about the pool design. What gutter style are you going with?",
    options: [
      { label: 'Perimeter Overflow', value: 'Perimeter Overflow' },
      { label: 'Deck Level', value: 'Deck Level' },
      { label: 'Rim Flow', value: 'Rim Flow' },
      { label: 'Skimmer', value: 'Skimmer' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    followUp: (value, data) => {
      if (value === 'Skimmer' && data.poolUseType === 'Commercial') return "Heads up — skimmer gutters are less common for commercial pools. Deck-level or perimeter overflow are typically preferred for code compliance, but it depends on your jurisdiction.";
      if (value === 'Deck Level') return 'Deck-level is a clean look. It does require a surge tank — keep that in mind for the mechanical room layout.';
      return null;
    },
    unsureResponse: (data) => {
      if (data.poolUseType === 'Commercial' || data.poolUseType === 'Competition') {
        return {
          message: "For a commercial/competition pool, **Perimeter Overflow** is the standard. It handles higher bather loads, meets most code requirements, and keeps the water level consistent. I'll go with that — you can change it anytime in the configurator.",
          suggestedValue: 'Perimeter Overflow',
          suggestedLabel: 'Perimeter Overflow',
        };
      }
      return {
        message: "For a residential pool, **Skimmer** is the most common and cost-effective option. It's simple, reliable, and works great for most backyard pools. I'll set that as the starting point — easy to change later.",
        suggestedValue: 'Skimmer',
        suggestedLabel: 'Skimmer',
      };
    },
  },
  {
    field: 'copingStyle',
    question: 'What about coping style?',
    options: [
      { label: 'Bull Nose', value: 'Bull Nose' },
      { label: 'Cantilevered', value: 'Cantilevered' },
      { label: 'Grate', value: 'Grate' },
      { label: 'Flat / Flush', value: 'Flat' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    unsureResponse: (data) => {
      const gs = data.gutterStyle;
      const deckLevel =
        gs &&
        ['concrete-deck-level', 'ss-deck-level', 'ss-deck-level-weirs'].includes(gs);
      if (deckLevel) {
        return {
          message: "With a deck-level or overflow gutter, **Grate** coping is the natural fit — it channels water into the gutter system. I'll set that for now.",
          suggestedValue: 'Grate',
          suggestedLabel: 'Grate',
        };
      }
      return {
        message: "**Bull Nose** is the most popular choice for residential pools — it's comfortable, safe, and looks clean. I'll start with that.",
        suggestedValue: 'Bull Nose',
        suggestedLabel: 'Bull Nose',
      };
    },
  },
  {
    field: 'mechanicalKnowledge',
    question: 'For the mechanical systems — do you already know what equipment you want, or would you like guidance based on the project?',
    options: [
      { label: 'I know what I want', value: 'know' },
      { label: 'Help me choose', value: 'help' },
    ],
    followUp: (value) => {
      if (value === 'help') return "I can recommend equipment based on your pool size, use type, and budget. Let's go through the key systems.";
      return null;
    },
  },
  {
    field: 'filtrationType',
    question: 'What filtration system do you want to use?',
    options: [
      { label: 'Sand', value: 'Sand' },
      { label: 'Cartridge', value: 'Cartridge' },
      { label: 'Diatomaceous Earth (DE)', value: 'DE' },
      { label: 'Glass Media', value: 'Glass Media' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    followUp: (value, data) => {
      if (value === 'Cartridge' && data.poolUseType === 'Commercial') return 'Cartridge can work for commercial, but you may need multiple units for the flow rate. Something to validate in engineering.';
      return null;
    },
    unsureResponse: (data) => {
      if (data.poolUseType === 'Commercial' || data.poolUseType === 'Competition') {
        return {
          message: "For commercial pools, **Sand filtration** is the industry standard — it handles high flow rates, is easy to maintain, and meets code in most jurisdictions. I'll go with that.",
          suggestedValue: 'Sand',
          suggestedLabel: 'Sand',
        };
      }
      return {
        message: "For residential, **Cartridge** is a great default — no backwash waste, filters finer particles than sand, and saves water. It's low-maintenance and energy-efficient. I'll set that as your starting point.",
        suggestedValue: 'Cartridge',
        suggestedLabel: 'Cartridge',
      };
    },
  },
  {
    field: 'sanitationType',
    question: 'How about sanitation?',
    options: [
      { label: 'Salt Chlorine', value: 'Salt Chlorine' },
      { label: 'Liquid Chlorine', value: 'Liquid Chlorine' },
      { label: 'UV + Chlorine', value: 'UV + Chlorine' },
      { label: 'Ozone + Chlorine', value: 'Ozone + Chlorine' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    unsureResponse: (data) => {
      if (data.poolUseType === 'Commercial' || data.poolUseType === 'Competition') {
        return {
          message: "Commercial pools almost always use **Liquid Chlorine** — it's the most reliable, code-compliant option for high bather loads. Easy to dose automatically too. I'll set that.",
          suggestedValue: 'Liquid Chlorine',
          suggestedLabel: 'Liquid Chlorine',
        };
      }
      return {
        message: "**Salt Chlorine** is the most popular choice for residential pools right now — it generates chlorine automatically, the water feels softer, and ongoing chemical costs are lower. I'll go with that.",
        suggestedValue: 'Salt Chlorine',
        suggestedLabel: 'Salt Chlorine',
      };
    },
  },
  {
    field: 'heatingSystem',
    question: 'What heating system(s) do you want? You can pick more than one.',
    multiSelect: true,
    options: [
      { label: 'Gas Heater', value: 'Gas Heater' },
      { label: 'Heat Pump', value: 'Heat Pump' },
      { label: 'Solar', value: 'Solar' },
      { label: 'Electric', value: 'Electric' },
      { label: 'None', value: 'None' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    unsureResponse: (data) => {
      if (data.poolUseType === 'Commercial' || data.poolUseType === 'Competition') {
        return {
          message: "For commercial pools, a **Gas Heater** is the go-to — it heats fast and handles large volumes. If you want efficiency too, pairing it with a heat pump is common. I'll start with gas.",
          suggestedValue: ['Gas Heater'],
          suggestedLabel: 'Gas Heater',
        };
      }
      return {
        message: "For residential, a **Heat Pump** is the most energy-efficient option for regular use. If you need fast heat-up for occasional use, **Gas Heater** is better. I'll go with heat pump as a solid default.",
        suggestedValue: ['Heat Pump'],
        suggestedLabel: 'Heat Pump',
      };
    },
  },
  {
    field: 'finishType',
    question: 'Last big decision — what interior finish are you thinking?',
    options: [
      { label: 'Plaster', value: 'Plaster' },
      { label: 'Pebble', value: 'Pebble' },
      { label: 'Tile', value: 'Tile' },
      { label: 'Vinyl', value: 'Vinyl' },
      { label: "Not sure — help me decide", value: UNSURE_VALUE },
    ],
    followUp: (value) => {
      if (value === 'Tile') return 'Full tile finish — premium choice. I\'ll add tile detail questions to your configurator for band height and nosing.';
      return null;
    },
    unsureResponse: (data) => {
      if (data.poolUseType === 'Commercial' || data.poolUseType === 'Competition') {
        return {
          message: "For commercial pools, **Tile** is the premium standard — it's durable, easy to clean, and meets health codes everywhere. **Plaster** works too if budget is tighter. I'll go with tile.",
          suggestedValue: 'Tile',
          suggestedLabel: 'Tile',
        };
      }
      return {
        message: "**Plaster** is the most common residential finish — it's affordable, looks clean, and lasts 7-12 years. If you want something more durable, pebble is a step up. I'll start with plaster.",
        suggestedValue: 'Plaster',
        suggestedLabel: 'Plaster',
      };
    },
  },
  {
    field: 'inletStrategy',
    question:
      'We detected a very shallow section (for example a sun shelf under 2 ft). Should circulation use **dedicated floor returns** in that zone, or **wall returns only**?',
    options: [
      { label: 'Dedicated floor returns', value: 'floor-only' },
      { label: 'Wall returns only', value: 'wall-only' },
    ],
    skip: (data) =>
      data.inletStrategy !== 'auto-shelf' ||
      !data.poolSections.some((s) => isSuperShallowPoolSection(s)),
    followUp: (value) => {
      if (value === 'floor-only') {
        return 'Floor returns will follow the shelf area share of design GPM. Procurement counts update automatically.';
      }
      if (value === 'wall-only') {
        return 'Wall returns only — floor return count will go to zero. You can change this anytime in Mechanical.';
      }
      return null;
    },
  },
];

const PROGRESS_SECTIONS = [
  { label: 'Basics', fields: ['projectName', 'projectType', 'poolUseType', 'projectCity'] as (keyof ProjectData)[] },
  { label: 'Codes', fields: ['localCodeAwareness'] as (keyof ProjectData)[] },
  { label: 'Design', fields: ['gutterStyle', 'copingStyle'] as (keyof ProjectData)[] },
  { label: 'Systems', fields: ['mechanicalKnowledge', 'filtrationType', 'sanitationType', 'heatingSystem', 'inletStrategy'] as (keyof ProjectData)[] },
  { label: 'Finish', fields: ['finishType'] as (keyof ProjectData)[] },
];

function normalizeChatPayload(
  field: keyof ProjectData,
  value: string | string[],
  data: ProjectData,
): Partial<ProjectData> {
  const text = Array.isArray(value) ? value.join(', ') : value;
  switch (field) {
    case 'projectCity': {
      const [city, state] = text.split(',').map((part) => part.trim());
      return {
        projectCity: city || text,
        ...(state ? { projectState: state } : {}),
      };
    }
    case 'poolUseType': {
      const map: Record<string, string> = {
        Commercial: 'Public Pool',
        Competition: 'Competition Pool',
        Therapy: 'Therapeutic Small',
        Residential: 'Residential',
      };
      return { poolUseType: map[text] ?? text };
    }
    case 'gutterStyle': {
      const map: Record<string, string> = {
        'Perimeter Overflow': 'ss-deck-level-weirs',
        'Deck Level': data.poolUseType === 'Residential' ? 'skimmer-12-coping' : 'concrete-deck-level',
        'Rim Flow': 'concrete-rollout',
        Skimmer: 'skimmer-12-coping',
      };
      return { gutterStyle: map[text] ?? text };
    }
    case 'copingStyle': {
      const map: Record<string, string> = {
        Grate: 'Flat',
        'Flat / Flush': 'Flat',
      };
      return { copingStyle: map[text] ?? text };
    }
    case 'sanitationType': {
      const map: Record<string, Partial<ProjectData>> = {
        'Salt Chlorine': { sanitationType: 'Saltwater Chlorine Generator' },
        'Saltwater Chlorine': { sanitationType: 'Saltwater Chlorine Generator' },
        'UV + Chlorine': {
          sanitationType: 'Liquid Chlorine',
          secondarySanitation: ['Ultraviolet Light System'],
        },
        'Ozone + Chlorine': {
          sanitationType: 'Liquid Chlorine',
          secondarySanitation: ['Ozone System'],
        },
      };
      return map[text] ?? { sanitationType: text };
    }
    case 'heatingSystem': {
      const selections = Array.isArray(value) ? value : text.split(',').map((v) => v.trim()).filter(Boolean);
      const heatingSystem = selections.includes('None') ? [] : selections;
      return { heatingSystem };
    }
    case 'inletStrategy':
      return { inletStrategy: value as ProjectData['inletStrategy'] };
    default:
      return { [field]: value } as Partial<ProjectData>;
  }
}

function fieldHasValue(data: ProjectData, field: keyof ProjectData): boolean {
  const v = data[field];
  if (v === null || v === undefined) return false;
  if (Array.isArray(v)) return v.length > 0;
  if (typeof v === 'string') return v.trim() !== '';
  return true;
}

let nextId = 1;
function genId() {
  return nextId++;
}

export function ProjectChat() {
  const { state, dispatch } = useApp();

  const prefilledFields = useRef<Set<keyof ProjectData> | null>(null);
  if (prefilledFields.current === null) {
    const set = new Set<keyof ProjectData>();
    for (const step of CONVERSATION_FLOW) {
      if (step.skip?.(state.data)) {
        set.add(step.field);
        continue;
      }
      if (step.field === 'inletStrategy') continue;
      if (fieldHasValue(state.data, step.field)) set.add(step.field);
    }
    prefilledFields.current = set;
  }
  const hasPrefilledData = prefilledFields.current.size > 0;

  const buildWelcome = (): ChatMessage => {
    if (!hasPrefilledData) {
      return {
        id: 0,
        role: 'assistant',
        text: "Hi! Let's set up your new project. I'll ask a few questions to get the basics in place — you can always change things later in the configurator.\n\nJust answer naturally, or pick from the options I suggest.",
      };
    }
    const filled = prefilledFields.current!;
    const labels: string[] = [];
    if (filled.has('projectType')) labels.push(`**${state.data.projectType}** project`);
    if (filled.has('poolUseType')) labels.push(`**${state.data.poolUseType}** use`);
    if (filled.has('gutterStyle')) {
      const recirculation =
        getRecirculationLabels(state.data.gutterStyle).join(', ') || state.data.gutterStyle || '';
      labels.push(`**${recirculation}** recirculation`);
    }
    if (filled.has('filtrationType')) labels.push(`**${state.data.filtrationType}** filtration`);
    if (filled.has('finishType')) labels.push(`**${state.data.finishType}** finish`);
    const summary = labels.length > 0
      ? `I see this project already has ${labels.join(', ')} configured.`
      : `I see some details are already configured from your source.`;
    return {
      id: 0,
      role: 'assistant',
      text: `${summary} I'll skip what's already set and focus on the remaining decisions.\n\nYou can always change anything later in the configurator.`,
    };
  };

  const [messages, setMessages] = useState<ChatMessage[]>(() => [buildWelcome()]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [multiSelections, setMultiSelections] = useState<string[]>([]);
  const [conversationDone, setConversationDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasAskedFirstQuestion = useRef(false);

  const filledFields = useRef<Set<keyof ProjectData>>(new Set(prefilledFields.current));

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 50);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const addAssistantMessage = useCallback((text: string, options?: ChatOption[], field?: keyof ProjectData, multiSelect?: boolean) => {
    const msg: ChatMessage = { id: genId(), role: 'assistant', text, options, field, multiSelect };
    setMessages((prev) => [...prev, msg]);
  }, []);

  const askNextQuestion = useCallback((fromIndex: number, data: ProjectData) => {
    let idx = fromIndex;
    while (idx < CONVERSATION_FLOW.length) {
      const step = CONVERSATION_FLOW[idx];
      if (step.skip?.(data) || prefilledFields.current!.has(step.field)) {
        filledFields.current.add(step.field);
        idx++;
        continue;
      }
      setStepIndex(idx);
      setIsTyping(true);
      setTimeout(() => {
        addAssistantMessage(step.question, step.options, step.field, step.multiSelect);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
      return;
    }
    setIsTyping(true);
    setTimeout(() => {
      const name = data.projectName || 'your project';
      addAssistantMessage(
        `That covers the essentials for ${name}. You're all set to jump into the workspace — you can refine every detail in the configurator from there.`,
      );
      setConversationDone(true);
      setIsTyping(false);
    }, 600);
  }, [addAssistantMessage]);

  useEffect(() => {
    if (!hasAskedFirstQuestion.current) {
      hasAskedFirstQuestion.current = true;
      setTimeout(() => {
        askNextQuestion(0, state.data);
      }, 800);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const processUnsure = useCallback((currentStep: ConversationStep) => {
    const userMsg: ChatMessage = { id: genId(), role: 'user', text: "I'm not sure — help me decide" };
    setMessages((prev) => [...prev, userMsg]);

    if (!currentStep.unsureResponse) return;

    const recommendation = currentStep.unsureResponse(state.data);
    const field = currentStep.field;

    const payload = normalizeChatPayload(field, recommendation.suggestedValue, state.data);

    setIsTyping(true);
    setTimeout(() => {
      addAssistantMessage(recommendation.message);
      dispatch({ type: 'UPDATE_DATA', payload });
      filledFields.current.add(field);
      setIsTyping(false);

      const updatedData = { ...state.data, ...payload };
      setTimeout(() => {
        askNextQuestion(stepIndex + 1, updatedData as ProjectData);
      }, 300);
    }, 600 + Math.random() * 400);
  }, [state.data, stepIndex, dispatch, addAssistantMessage, askNextQuestion]);

  const processAnswer = useCallback((text: string, currentStep: ConversationStep) => {
    const userMsg: ChatMessage = { id: genId(), role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    const field = currentStep.field;
    let dataValue: string | string[] = text;

    if (currentStep.multiSelect && multiSelections.length > 0) {
      dataValue = [...multiSelections];
      setMultiSelections([]);
    }

    const payload = normalizeChatPayload(field, dataValue, state.data);

    dispatch({ type: 'UPDATE_DATA', payload });
    filledFields.current.add(field);

    const updatedData = { ...state.data, ...payload };

    const followUpText = currentStep.followUp?.(
      Array.isArray(dataValue) ? dataValue.join(', ') : dataValue,
      updatedData as ProjectData,
    );

    if (followUpText) {
      setIsTyping(true);
      setTimeout(() => {
        addAssistantMessage(followUpText);
        setIsTyping(false);
        setTimeout(() => {
          askNextQuestion(stepIndex + 1, updatedData as ProjectData);
        }, 300);
      }, 500 + Math.random() * 300);
    } else {
      askNextQuestion(stepIndex + 1, updatedData as ProjectData);
    }
  }, [state.data, stepIndex, multiSelections, dispatch, addAssistantMessage, askNextQuestion]);

  const handleSend = (text?: string) => {
    const value = (text || input).trim();
    if (!value || isTyping || conversationDone) return;
    setInput('');
    const currentStep = CONVERSATION_FLOW[stepIndex];
    if (!currentStep) return;
    processAnswer(value, currentStep);
  };

  const handleOptionClick = (option: ChatOption) => {
    if (isTyping || conversationDone) return;
    const currentStep = CONVERSATION_FLOW[stepIndex];
    if (!currentStep) return;

    if (option.value === UNSURE_VALUE) {
      if (currentStep.multiSelect) setMultiSelections([]);
      processUnsure(currentStep);
      return;
    }

    if (currentStep.multiSelect) {
      setMultiSelections((prev) =>
        prev.includes(option.value)
          ? prev.filter((v) => v !== option.value)
          : [...prev, option.value],
      );
    } else {
      processAnswer(option.value, currentStep);
    }
  };

  const handleMultiSelectConfirm = () => {
    if (multiSelections.length === 0 || isTyping) return;
    const currentStep = CONVERSATION_FLOW[stepIndex];
    if (!currentStep) return;
    const labels = multiSelections.map((v) => {
      const opt = currentStep.options?.find((o) => o.value === v);
      return opt?.label || v;
    });
    processAnswer(labels.join(', '), currentStep);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleEnterWorkspace = () => {
    dispatch({ type: 'FINISH_WIZARD' });
  };

  const currentStep = CONVERSATION_FLOW[stepIndex];
  const isMultiSelecting = currentStep?.multiSelect && !conversationDone && !isTyping;

  const progress = Math.min(
    100,
    Math.round((filledFields.current.size / CONVERSATION_FLOW.length) * 100),
  );

  const sectionStatus = PROGRESS_SECTIONS.map((section) => {
    const completed = section.fields.filter((f) => filledFields.current.has(f)).length;
    const total = section.fields.length;
    const isCurrent =
      !conversationDone &&
      completed < total &&
      PROGRESS_SECTIONS.every(
        (prev, i) =>
          i >= PROGRESS_SECTIONS.indexOf(section) ||
          prev.fields.every((f) => filledFields.current.has(f)),
      );
    return { ...section, completed, total, isCurrent, isDone: completed === total };
  });

  return (
    <div className={styles.root}>
      <div className={styles.container}>
        <div className={styles.progressStrip}>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}>
              <div className={styles.progressShimmer} />
            </div>
          </div>
          <div className={styles.progressSegments}>
            {sectionStatus.map((s, i) => (
              <div key={s.label} className={styles.progressSegment}>
                <span
                  className={`${styles.progressDot} ${s.isDone ? styles.progressDotDone : ''} ${s.isCurrent ? styles.progressDotCurrent : ''}`}
                >
                  {s.isDone && <Check size={10} strokeWidth={3} />}
                </span>
                <span
                  className={`${styles.progressSegLabel} ${s.isCurrent ? styles.progressSegLabelActive : ''} ${s.isDone ? styles.progressSegLabelDone : ''}`}
                >
                  {s.label}
                </span>
                {i < sectionStatus.length - 1 && (
                  <div className={`${styles.progressConnector} ${s.isDone ? styles.progressConnectorDone : ''}`} />
                )}
              </div>
            ))}
          </div>
          {progress > 0 && (
            <span className={styles.progressPct}>{progress}%</span>
          )}
        </div>

        <div className={styles.messages}>
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAssistant}`}
            >
              {msg.role === 'assistant' && (
                <div className={styles.avatar}>
                  <Sparkles size={14} />
                </div>
              )}
              <div className={styles.bubble}>
                <p className={styles.bubbleText}>{stripSimpleMarkdown(msg.text)}</p>
                {msg.role === 'assistant' && msg.options && msg.options.length > 0 && (
                  <div className={`${styles.options} ${msg.multiSelect ? styles.optionsMulti : ''}`}>
                    {msg.options.map((opt) => {
                      const isUnsure = opt.value === UNSURE_VALUE;
                      const isSelected = msg.multiSelect && multiSelections.includes(opt.value);
                      const isLatestAssistant = messages.filter((m) => m.role === 'assistant').pop()?.id === msg.id;
                      const disabled = !isLatestAssistant || isTyping || conversationDone;
                      return (
                        <button
                          key={opt.value}
                          className={`${styles.optionBtn} ${isSelected ? styles.optionSelected : ''} ${isUnsure ? styles.optionUnsure : ''}`}
                          onClick={() => handleOptionClick(opt)}
                          disabled={disabled}
                        >
                          {msg.multiSelect && !isUnsure && (
                            <span className={styles.checkbox}>
                              {isSelected && <span className={styles.checkmark} />}
                            </span>
                          )}
                          {opt.label}
                        </button>
                      );
                    })}
                    {msg.multiSelect && !conversationDone && messages.filter((m) => m.role === 'assistant').pop()?.id === msg.id && (
                      <button
                        className={styles.confirmMultiBtn}
                        onClick={handleMultiSelectConfirm}
                        disabled={multiSelections.length === 0 || isTyping}
                      >
                        Confirm selection ({multiSelections.length})
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className={`${styles.msg} ${styles.msgAssistant}`}>
              <div className={styles.avatar}>
                <Sparkles size={14} />
              </div>
              <div className={styles.bubble}>
                <div className={styles.typing}>
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <div className={styles.bottomBar}>
          {conversationDone ? (
            <div className={styles.doneRow}>
              <button className={styles.enterBtn} onClick={handleEnterWorkspace}>
                Enter workspace
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <div className={styles.inputRow}>
              <input
                ref={inputRef}
                className={styles.input}
                placeholder={
                  isMultiSelecting
                    ? 'Select options above, then confirm...'
                    : 'Type your answer...'
                }
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isTyping || conversationDone}
              />
              <button
                className={styles.sendBtn}
                onClick={() => handleSend()}
                disabled={!input.trim() || isTyping || conversationDone}
              >
                <Send size={16} />
              </button>
            </div>
          )}
          {!conversationDone && (
            <button className={styles.skipLink} onClick={handleEnterWorkspace}>
              Skip to workspace — I'll configure later
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
