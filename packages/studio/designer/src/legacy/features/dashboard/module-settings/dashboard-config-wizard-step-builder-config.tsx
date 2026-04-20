import { buildDashboardConfigWizardStepNodes } from './dashboard-config-wizard-step-nodes';
import { SimpleProcessDesignHostPanel } from './simple-process-design-host-panel';

type DashboardConfigWizardStepNodesInput = Parameters<typeof buildDashboardConfigWizardStepNodes>[0];

type DashboardConfigWizardStepBuilderConfig = {
  menuInfo: DashboardConfigWizardStepNodesInput['menuInfo'];
  moduleIntro: DashboardConfigWizardStepNodesInput['moduleIntro'];
  processDesign: {
    createRestrictionProcessDesignEntry: (name?: string) => void;
    currentModuleName: string;
    currentUserName: string;
    selectedRestrictionProcessDesign: any;
    showToast: (message: string) => void;
    updateSelectedRestrictionProcessDesign: (updater: any) => void;
  };
  survey: {
    generateSurveyPlan: (mode: string, dataSource: string) => Promise<void>;
    isGenerating: DashboardConfigWizardStepNodesInput['survey']['isGenerating'];
    resetSurveyFlow: DashboardConfigWizardStepNodesInput['survey']['onResetSurveyFlow'];
    setSurveyAnswers: (answers: string[]) => void;
    setSurveyStep: (step: number) => void;
    surveyAnswers: DashboardConfigWizardStepNodesInput['survey']['surveyAnswers'];
    surveyError: DashboardConfigWizardStepNodesInput['survey']['surveyError'];
    surveyPlan: DashboardConfigWizardStepNodesInput['survey']['surveyPlan'];
    surveyPlanModel: DashboardConfigWizardStepNodesInput['survey']['surveyPlanModel'];
    surveyStep: DashboardConfigWizardStepNodesInput['survey']['surveyStep'];
  };
  typeSelection: DashboardConfigWizardStepNodesInput['typeSelection'];
};

export function buildDashboardConfigWizardStepBuilderConfig({
  menuInfo,
  moduleIntro,
  processDesign,
  survey,
  typeSelection,
}: DashboardConfigWizardStepBuilderConfig): DashboardConfigWizardStepNodesInput {
  return {
    menuInfo,
    moduleIntro,
    processDesign: {
      processDesignNode: (
        <SimpleProcessDesignHostPanel
          currentModuleName={processDesign.currentModuleName}
          currentUserName={processDesign.currentUserName}
          emptyHint="先创建流程方案，再在这里完成审批流画布和节点属性配置。"
          mode="wizard"
          onCreate={processDesign.createRestrictionProcessDesignEntry}
          onToast={processDesign.showToast}
          onUpdate={processDesign.updateSelectedRestrictionProcessDesign}
          processDesign={processDesign.selectedRestrictionProcessDesign}
        />
      ),
    },
    preview: {
      previewTitle: '模块预览',
    },
    survey: {
      isGenerating: survey.isGenerating,
      onGenerateSurveyPlan: (mode, dataSource) => {
        if (!dataSource) {
          survey.setSurveyAnswers([mode]);
          survey.setSurveyStep(1);
          return;
        }

        void survey.generateSurveyPlan(mode, dataSource);
      },
      onResetSurveyFlow: survey.resetSurveyFlow,
      surveyAnswers: survey.surveyAnswers,
      surveyError: survey.surveyError,
      surveyPlan: survey.surveyPlan,
      surveyPlanModel: survey.surveyPlanModel,
      surveyStep: survey.surveyStep,
    },
    typeSelection,
  };
}
