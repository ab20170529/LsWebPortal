import { useCallback, useState } from 'react';

import { requestSurveyPlan, type SurveyPlan } from '../../../lib/minimax';

export function useDashboardSurveyFlow({ showToast }: { showToast: (message: string) => void }) {
  const [surveyStep, setSurveyStep] = useState(0);
  const [surveyAnswers, setSurveyAnswers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [surveyPlan, setSurveyPlan] = useState<SurveyPlan | null>(null);
  const [surveyPlanModel, setSurveyPlanModel] = useState('');
  const [surveyError, setSurveyError] = useState<string | null>(null);
  const [isGeneratingSqlDraft, setIsGeneratingSqlDraft] = useState(false);
  const [isTranslatingIdentifiers, setIsTranslatingIdentifiers] = useState(false);

  const resetSurveyFlow = useCallback(() => {
    setSurveyStep(0);
    setSurveyAnswers([]);
    setIsGenerating(false);
    setSurveyPlan(null);
    setSurveyPlanModel('');
    setSurveyError(null);
  }, []);

  const generateSurveyPlan = useCallback(async (mode: string, dataSource: string) => {
    setSurveyStep(2);
    setSurveyAnswers([mode, dataSource]);
    setSurveyPlan(null);
    setSurveyPlanModel('');
    setSurveyError(null);
    setIsGenerating(true);

    try {
      const response = await requestSurveyPlan(mode, dataSource);
      setSurveyPlan(response.plan);
      setSurveyPlanModel(response.model);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MiniMax 生成失败，请稍后再试。';
      setSurveyError(message);
      showToast(message);
    } finally {
      setIsGenerating(false);
    }
  }, [showToast]);

  return {
    generateSurveyPlan,
    isGenerating,
    isGeneratingSqlDraft,
    isTranslatingIdentifiers,
    resetSurveyFlow,
    setIsGenerating,
    setIsGeneratingSqlDraft,
    setIsTranslatingIdentifiers,
    setSurveyAnswers,
    setSurveyError,
    setSurveyPlan,
    setSurveyPlanModel,
    setSurveyStep,
    surveyAnswers,
    surveyError,
    surveyPlan,
    surveyPlanModel,
    surveyStep,
  };
}
