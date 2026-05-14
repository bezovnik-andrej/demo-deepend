import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Sparkles, FolderOpen, Bookmark, ChevronLeft, ChevronRight } from 'lucide-react';
import { useApp } from '../../store';
import { PROJECT_TEMPLATES } from '../../data/projectTemplates';
import type { ProjectTemplate } from '../../data/projectTemplates';
import { getProjectProfile } from '../../data/projectProfiles';
import { MOCK_PROJECTS } from '../BackOffice/mockProjects';
import { STEP_DEFINITIONS, STEP_GROUPS } from '../../types';
import type { ConfigStep, ProjectData, StepGroup, StepMeta } from '../../types';
import { WIZARD_STEP_FORMS } from '../StepEditor/StepEditor';
import { isStepPrefilledFromTemplate } from '../../utils/stepPrefill';
import { ProjectChat } from '../ProjectChat/ProjectChat';
import styles from './WorkspaceLanding.module.css';

/** Short labels for stepper circles (fits narrow layout). */
const GROUP_LABEL_SHORT: Record<StepGroup, string> = {
  'Project Information': 'Project',
  'Local Code': 'Code',
  'Pool Volumes': 'Volume',
  'Pool Design': 'Pool',
  'Mechanical Systems': 'Mechanical',
  Finishes: 'Finishes',
  Features: 'Features',
  Review: 'Review',
};

function buildGroupedWizard(
  visibleSteps: StepMeta[],
  data: ProjectData,
  activeStep: ConfigStep | null,
): { group: StepGroup; steps: StepMeta[]; completedCount: number; totalCount: number; isFullyComplete: boolean; isActive: boolean }[] {
  return STEP_GROUPS.map((group) => {
    const steps = visibleSteps.filter((s) => s.group === group);
    const completedCount = steps.filter((s) => s.isComplete(data)).length;
    const totalCount = steps.length;
    // Review / Final Review step is never "complete" in data; treat group as complete only when empty or non-Review with all steps done
    const isFullyComplete =
      totalCount > 0 &&
      (group === 'Review'
        ? false
        : completedCount === totalCount);
    const isActive = activeStep != null && steps.some((s) => s.id === activeStep);
    return { group, steps, completedCount, totalCount, isFullyComplete, isActive };
  }).filter((g) => g.totalCount > 0);
}

export function WorkspaceLanding() {
  const { state } = useApp();

  if (state.wizardPhase === 'chat') {
    return <ProjectChat />;
  }

  if (state.wizardPhase === 'template') {
    return <SourcePicker />;
  }

  return <ConfigWizard />;
}

function SourcePicker() {
  const { state, dispatch } = useApp();
  const { data } = state;
  const [selectedSource, setSelectedSource] = useState<{
    type: 'project' | 'template' | 'chat';
    id: string;
    preset: Partial<ProjectData>;
  } | null>(null);

  const allTemplates: (ProjectTemplate & { source: 'system' | 'user' })[] = [
    ...PROJECT_TEMPLATES.map((t) => ({ ...t, source: 'system' as const })),
    ...state.userTemplates.map((t) => ({ ...t, source: 'user' as const })),
  ];

  const existingProjects = MOCK_PROJECTS;

  const handleSelectProject = (projectId: string) => {
    const proj = existingProjects.find((p) => p.id === projectId);
    if (!proj) return;
    setSelectedSource({ type: 'project', id: projectId, preset: getProjectProfile(proj).preset });
  };

  const handleSelectTemplate = (templateId: string) => {
    const tpl = allTemplates.find((t) => t.id === templateId);
    if (!tpl) return;
    setSelectedSource({ type: 'template', id: templateId, preset: tpl.preset });
  };

  const handleSelectChat = () => {
    setSelectedSource({ type: 'chat', id: '__chat__', preset: {} });
  };

  const handleStart = () => {
    if (!selectedSource) return;
    if (selectedSource.type === 'chat' && Object.keys(selectedSource.preset).length === 0) {
      dispatch({ type: 'START_CHAT' });
    } else {
      dispatch({ type: 'APPLY_WORKSPACE_TEMPLATE', preset: selectedSource.preset });
    }
  };

  const clientLabel = data.clientCompanyName?.trim();
  const projectLabel = data.projectName?.trim() || 'Untitled Project';

  const buttonLabel =
    selectedSource?.type === 'chat'
      ? 'Start chat'
      : selectedSource?.type === 'project'
        ? 'Start from project'
        : selectedSource?.type === 'template'
          ? 'Start from template'
          : 'Start project';

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>{projectLabel}</h1>
        {clientLabel ? (
          <p className={styles.subtitle}>{clientLabel}</p>
        ) : (
          <p className={styles.clientLine}>Pick a starting point, then refine with AI.</p>
        )}
      </div>

      <div className={styles.sections}>
        {/* ── From Existing Project ── */}
        <SourceSection
          icon={<FolderOpen size={16} />}
          label="From Existing Project"
          hint={`${existingProjects.length} projects`}
        >
          <ProjectRow
            projects={existingProjects}
            selectedId={selectedSource?.type === 'project' ? selectedSource.id : null}
            onSelect={handleSelectProject}
          />
        </SourceSection>

        {/* ── From Template ── */}
        <SourceSection
          icon={<Bookmark size={16} />}
          label="From Template"
          hint={`${allTemplates.length} templates`}
        >
          <div className={styles.grid} role="list">
            {allTemplates.map((t) => {
              const Icon = t.icon;
              const selected = selectedSource?.type === 'template' && selectedSource.id === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="listitem"
                  className={`${styles.card} ${selected ? styles.cardSelected : ''} ${t.source === 'user' ? styles.cardUser : ''}`}
                  onClick={() => handleSelectTemplate(t.id)}
                >
                  {Icon ? (
                    <Icon size={28} className={styles.cardIcon} strokeWidth={1.5} />
                  ) : (
                    <Bookmark size={28} className={`${styles.cardIcon} ${styles.cardIconUser}`} strokeWidth={1.5} />
                  )}
                  <span className={styles.cardName}>{t.name}</span>
                  <span className={styles.cardDesc}>{t.desc}</span>
                  {t.source === 'user' && <span className={styles.cardBadge}>Saved</span>}
                </button>
              );
            })}
          </div>
        </SourceSection>

        {/* ── Start Fresh ── */}
        <SourceSection
          icon={<Sparkles size={16} />}
          label="Start Fresh"
        >
          <button
            type="button"
            className={`${styles.card} ${styles.cardChat} ${styles.cardChatWide} ${selectedSource?.type === 'chat' ? styles.cardSelected : ''}`}
            onClick={handleSelectChat}
          >
            <Sparkles size={24} className={styles.cardIcon} strokeWidth={1.5} />
            <div className={styles.cardChatContent}>
              <span className={styles.cardName}>Chat with AI</span>
              <span className={styles.cardDesc}>Answer questions conversationally and let The Deep End configure your project from scratch</span>
            </div>
          </button>
        </SourceSection>
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          className={styles.startBtn}
          disabled={!selectedSource}
          onClick={handleStart}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function SourceSection({ icon, label, hint, children }: {
  icon: React.ReactNode;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <span className={styles.sectionIcon}>{icon}</span>
        <span className={styles.sectionLabel}>{label}</span>
        {hint && <span className={styles.sectionHint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}

function ProjectRow({ projects, selectedId, onSelect }: {
  projects: typeof MOCK_PROJECTS;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    checkScroll();
    const el = scrollRef.current;
    el?.addEventListener('scroll', checkScroll, { passive: true });
    return () => el?.removeEventListener('scroll', checkScroll);
  }, []);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -260 : 260, behavior: 'smooth' });
  };

  return (
    <div className={styles.projectRowWrap}>
      {canScrollLeft && (
        <button type="button" className={`${styles.scrollBtn} ${styles.scrollBtnLeft}`} onClick={() => scroll('left')} aria-label="Scroll left">
          <ChevronLeft size={16} />
        </button>
      )}
      <div className={styles.projectRow} ref={scrollRef}>
        {projects.map((p) => {
          const selected = selectedId === p.id;
          const initials = p.name.split(' ').map((w) => w[0]).join('').slice(0, 2);
          return (
            <button
              key={p.id}
              type="button"
              className={`${styles.projectCard} ${selected ? styles.projectCardSelected : ''}`}
              onClick={() => onSelect(p.id)}
            >
              <div className={styles.projectAvatar} style={{ background: p.avatarColor }}>
                {initials}
              </div>
              <div className={styles.projectInfo}>
                <span className={styles.projectName}>{p.name}</span>
                <span className={styles.projectMeta}>{p.client}</span>
                <span className={styles.projectMeta}>{p.projectType} · {p.poolType}</span>
              </div>
              <span className={`${styles.projectStatus} ${p.status === 'Finalized' ? styles.projectStatusDone : ''}`}>
                {p.status}
              </span>
            </button>
          );
        })}
      </div>
      {canScrollRight && (
        <button type="button" className={`${styles.scrollBtn} ${styles.scrollBtnRight}`} onClick={() => scroll('right')} aria-label="Scroll right">
          <ChevronRight size={16} />
        </button>
      )}
    </div>
  );
}

function ConfigWizard() {
  const { state, dispatch } = useApp();
  const { data, activeStep, appliedTemplatePreset } = state;

  const visibleSteps = useMemo(
    () => STEP_DEFINITIONS.filter((s) => s.isVisible(data)),
    [data],
  );

  useEffect(() => {
    if (!visibleSteps.length) return;
    if (!activeStep || !visibleSteps.some((s) => s.id === activeStep)) {
      dispatch({ type: 'SET_STEP', step: visibleSteps[0].id });
    }
  }, [visibleSteps, activeStep, dispatch]);

  const currentIndex = useMemo(() => {
    if (!activeStep || visibleSteps.length === 0) return 0;
    const idx = visibleSteps.findIndex((s) => s.id === activeStep);
    return idx >= 0 ? idx : 0;
  }, [activeStep, visibleSteps]);

  const stepId = (activeStep && visibleSteps.some((s) => s.id === activeStep)
    ? activeStep
    : visibleSteps[0]?.id) as ConfigStep | undefined;

  const currentMeta = stepId ? visibleSteps.find((s) => s.id === stepId) : undefined;
  const Form = stepId ? WIZARD_STEP_FORMS[stepId] : null;
  const isLast = currentIndex >= visibleSteps.length - 1;
  const prefilled = stepId ? isStepPrefilledFromTemplate(stepId, appliedTemplatePreset) : false;

  const groupedSteps = useMemo(
    () => buildGroupedWizard(visibleSteps, data, activeStep),
    [visibleSteps, data, activeStep],
  );

  const goToStep = (step: ConfigStep) => {
    dispatch({ type: 'SET_STEP', step });
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      goToStep(visibleSteps[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    if (currentIndex < visibleSteps.length - 1) {
      goToStep(visibleSteps[currentIndex + 1].id);
    }
  };

  const handlePrimary = () => {
    if (isLast) {
      dispatch({ type: 'FINISH_WIZARD' });
    } else {
      goNext();
    }
  };

  if (!Form || !currentMeta || !visibleSteps.length) {
    return (
      <div className={styles.wizardRoot}>
        <p className={styles.wizardError}>No configuration steps available.</p>
        <button type="button" className={styles.startBtn} onClick={() => dispatch({ type: 'SKIP_WIZARD' })}>
          Enter workspace
        </button>
      </div>
    );
  }

  return (
    <div className={styles.wizardRoot}>
      <div className={styles.wizardProgress}>
        <div className={styles.stepper} role="navigation" aria-label="Configuration groups">
          {groupedSteps.map((g, idx) => {
            const indices = g.steps.map((s) => visibleSteps.findIndex((v) => v.id === s.id)).filter((i) => i >= 0);
            const minIdx = indices.length ? Math.min(...indices) : 0;
            const maxIdx = indices.length ? Math.max(...indices) : 0;
            const isPast = !g.isActive && !g.isFullyComplete && maxIdx < currentIndex;
            const isFuture = !g.isActive && !g.isFullyComplete && minIdx > currentIndex;
            let circleClass = styles.stepperCircleTodo;
            if (g.isFullyComplete) circleClass = styles.stepperCircleDone;
            else if (g.isActive) circleClass = styles.stepperCircleActive;
            else if (isPast) circleClass = styles.stepperCirclePast;
            else if (isFuture) circleClass = styles.stepperCircleFuture;

            return (
              <div key={g.group} className={styles.stepperSegment}>
                {idx > 0 && (
                  <div
                    className={`${styles.stepperLine} ${groupedSteps[idx - 1]!.isFullyComplete ? styles.stepperLineDone : ''}`}
                    aria-hidden
                  />
                )}
                <div className={styles.stepperNode}>
                  <button
                    type="button"
                    className={styles.stepperCircleBtn}
                    onClick={() => goToStep(g.steps[0]!.id)}
                    aria-current={g.isActive ? 'step' : undefined}
                    title={g.group}
                  >
                    <span className={`${styles.stepperCircle} ${circleClass}`}>
                      {g.isFullyComplete ? <Check size={14} strokeWidth={2.5} /> : null}
                    </span>
                  </button>
                  <span className={styles.stepperLabel}>{GROUP_LABEL_SHORT[g.group]}</span>
                  {!g.isFullyComplete && g.totalCount > 0 && g.group !== 'Review' && (
                    <span className={styles.stepperFraction}>
                      {g.completedCount}/{g.totalCount}
                    </span>
                  )}
                  {g.isActive && g.steps.length > 0 && (
                    <div className={styles.subDots} role="tablist" aria-label="Steps in this group">
                      {g.steps.map((s) => {
                        const isDotActive = s.id === activeStep;
                        return (
                          <button
                            key={s.id}
                            type="button"
                            role="tab"
                            aria-selected={isDotActive}
                            className={`${styles.subDot} ${isDotActive ? styles.subDotActive : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              goToStep(s.id);
                            }}
                            title={s.label}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.wizardBody}>
        <div className={styles.wizardFormWrap}>
          {prefilled && (
            <div className={styles.prefillRow}>
              <span className={styles.prefillBadge}>Pre-filled by template</span>
              <span className={styles.prefillMeta}>
                {currentMeta.group} · {currentMeta.label}
              </span>
            </div>
          )}
          <Form />
        </div>
      </div>

      <div className={styles.wizardFooter}>
        <div className={styles.wizardFooterNav}>
          <button
            type="button"
            className={styles.wizardBtnSecondary}
            onClick={goPrev}
            disabled={currentIndex <= 0}
          >
            Back
          </button>
          <button type="button" className={styles.wizardBtnSecondary} onClick={goNext} disabled={isLast}>
            Skip step
          </button>
          <button type="button" className={styles.wizardBtnPrimary} onClick={handlePrimary}>
            {isLast ? 'Enter workspace' : 'Continue'}
          </button>
        </div>
        <button type="button" className={styles.skipWorkspaceLink} onClick={() => dispatch({ type: 'SKIP_WIZARD' })}>
          Skip to workspace
        </button>
      </div>
    </div>
  );
}
