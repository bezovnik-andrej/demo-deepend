import { useApp } from '../../store';
import { ConfigStep } from '../../types';
import { ProjectLocationForm } from '../StepForms/ProjectLocationForm';
import { CustomerForm } from '../StepForms/CustomerForm';
import { ProjectTypeForm } from '../StepForms/ProjectTypeForm';
import { LocalCodeAwarenessForm, LocalCodeDetailsForm } from '../StepForms/LocalCodeForm';
import { PoolUseForm } from '../StepForms/PoolUseForm';
import { VolumeForm } from '../StepForms/VolumeForm';
import { DeckForm } from '../StepForms/DeckForm';
import { DivingBoardForm } from '../StepForms/DivingBoardForm';
import { GutterStyleForm } from '../StepForms/GutterStyleForm';
import { CopingStyleForm } from '../StepForms/CopingStyleForm';
import { MechanicalForm } from '../StepForms/MechanicalForm';
import { FiltrationForm } from '../StepForms/FiltrationForm';
import { SanitationForm } from '../StepForms/SanitationForm';
import { ChemicalControlForm } from '../StepForms/ChemicalControlForm';
import { SecondarySanitationForm } from '../StepForms/SecondarySanitationForm';
import { PhBufferForm } from '../StepForms/PhBufferForm';
import { HeatingForm } from '../StepForms/HeatingForm';
import { InteriorFinishForm } from '../StepForms/InteriorFinishForm';
import { WaterFeaturesForm } from '../StepForms/WaterFeaturesForm';
import { FeaturesForm } from '../StepForms/FeaturesForm';
import { FinalReviewForm } from '../StepForms/FinalReviewForm';
import styles from './StepEditor.module.css';

/** Shared with full-screen config wizard — same forms as the workspace ConfigDrawer. */
// eslint-disable-next-line react-refresh/only-export-components -- map is imported by ConfiguratorPage / drawer; splitting only for HMR is low value.
export const WIZARD_STEP_FORMS: Record<ConfigStep, React.FC> = {
  [ConfigStep.ProjectLocation]: ProjectLocationForm,
  [ConfigStep.Customer]: CustomerForm,
  [ConfigStep.ProjectType]: ProjectTypeForm,
  [ConfigStep.LocalCodeAwareness]: LocalCodeAwarenessForm,
  [ConfigStep.LocalCodeDetails]: LocalCodeDetailsForm,
  [ConfigStep.PoolUseType]: PoolUseForm,
  [ConfigStep.Volume]: VolumeForm,
  [ConfigStep.Deck]: DeckForm,
  [ConfigStep.DivingBoard]: DivingBoardForm,
  [ConfigStep.GutterStyle]: GutterStyleForm,
  [ConfigStep.CopingStyle]: CopingStyleForm,
  [ConfigStep.MechanicalKnowledge]: MechanicalForm,
  [ConfigStep.MechanicalBrand]: MechanicalForm,
  [ConfigStep.MechanicalPriorities]: MechanicalForm,
  [ConfigStep.Filtration]: FiltrationForm,
  [ConfigStep.Sanitation]: SanitationForm,
  [ConfigStep.ChemicalControl]: ChemicalControlForm,
  [ConfigStep.SecondarySanitation]: SecondarySanitationForm,
  [ConfigStep.PhBuffer]: PhBufferForm,
  [ConfigStep.Heating]: HeatingForm,
  [ConfigStep.InteriorFinish]: InteriorFinishForm,
  [ConfigStep.TileDetails]: InteriorFinishForm,
  [ConfigStep.WaterFeatures]: WaterFeaturesForm,
  [ConfigStep.Features]: FeaturesForm,
  [ConfigStep.FinalReview]: FinalReviewForm,
};

export function StepEditor() {
  const { state } = useApp();
  const { activeStep } = state;

  if (!activeStep) {
    return (
      <div className={styles.empty}>
        Select a step from the sidebar to begin configuring.
      </div>
    );
  }

  const Form = WIZARD_STEP_FORMS[activeStep];
  return (
    <div className={styles.editor}>
      <Form />
    </div>
  );
}
