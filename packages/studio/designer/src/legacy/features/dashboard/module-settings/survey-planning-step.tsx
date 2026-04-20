import React from 'react';
import { motion } from 'framer-motion';

import type { SurveyPlan } from '../../../lib/minimax';

type SurveyPlanningStepProps = {
  isGenerating: boolean;
  onGenerateSurveyPlan: (mode: string, dataSource: string) => void;
  onResetSurveyFlow: () => void;
  surveyAnswers: string[];
  surveyError: string | null;
  surveyPlan: SurveyPlan | null;
  surveyPlanModel: string;
  surveyStep: number;
};

const MODE_OPTIONS = ['标准 CRUD 模式', '复杂审批流模式', '数据看板模式'];
const DATA_SOURCE_OPTIONS = ['手工录入为主', '外部系统对接 (API)', 'Excel 批量导入'];

export function SurveyPlanningStep({
  isGenerating,
  onGenerateSurveyPlan,
  onResetSurveyFlow,
  surveyAnswers,
  surveyError,
  surveyPlan,
  surveyPlanModel,
  surveyStep,
}: SurveyPlanningStepProps) {
  return (
    <div className="grid min-h-[650px] flex-1 grid-cols-1 gap-8 lg:grid-cols-2">
      <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
        <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/50 p-5 dark:border-slate-800 dark:bg-slate-800/50">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-[20px]">smart_toy</span>
          </div>
          <div>
            <h3 className="text-[16px] font-bold text-slate-800 dark:text-slate-200">AI 架构助手</h3>
            <p className="text-[12px] text-slate-500">正在为您进行需求调研...</p>
          </div>
        </div>

        <div className="custom-scrollbar flex-1 space-y-6 overflow-y-auto bg-slate-50/30 p-6 dark:bg-slate-900/30">
          <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20">
              <span className="material-symbols-outlined text-[20px]">smart_toy</span>
            </div>
            <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
              您好。为了更好地为您构建【成本控制】模块，我需要先确认开发模式。您希望采用哪一种？
            </div>
          </div>

          {surveyStep === 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3 pl-14">
              {MODE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => onGenerateSurveyPlan(option, '')}
                  className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-2.5 text-[14px] font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-white"
                >
                  {option}
                </button>
              ))}
            </motion.div>
          ) : null}

          {surveyStep > 0 ? (
            <div className="flex flex-row-reverse gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary p-4 text-[14px] leading-relaxed text-white shadow-sm">
                {surveyAnswers[0]}
              </div>
            </div>
          ) : null}

          {surveyStep > 0 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-md shadow-primary/20">
                <span className="material-symbols-outlined text-[20px]">smart_toy</span>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                好的，已选择“{surveyAnswers[0]}”。请问该模块的数据来源主要是什么？
              </div>
            </motion.div>
          ) : null}

          {surveyStep === 1 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap gap-3 pl-14">
              {DATA_SOURCE_OPTIONS.map((option) => (
                <button
                  key={option}
                  onClick={() => onGenerateSurveyPlan(surveyAnswers[0], option)}
                  className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-2.5 text-[14px] font-bold text-primary shadow-sm transition-all hover:bg-primary hover:text-white"
                >
                  {option}
                </button>
              ))}
            </motion.div>
          ) : null}

          {surveyStep > 1 ? (
            <div className="flex flex-row-reverse gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                <span className="material-symbols-outlined text-[20px]">person</span>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tr-none bg-primary p-4 text-[14px] leading-relaxed text-white shadow-sm">
                {surveyAnswers[1]}
              </div>
            </div>
          ) : null}

          {surveyStep > 1 ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/20">
                <span className="material-symbols-outlined text-[20px]">check</span>
              </div>
              <div className="max-w-[85%] rounded-2xl rounded-tl-none border border-slate-100 bg-white p-4 text-[14px] leading-relaxed text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                调研完成，我已经理解您的需求。右侧是为您生成的底层领域模型与执行计划，请查阅。
              </div>
            </motion.div>
          ) : null}
        </div>

        {surveyStep > 1 ? (
          <div className="border-t border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/50">
            <button
              onClick={onResetSurveyFlow}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-3 text-[14px] font-bold text-slate-600 shadow-sm transition-all hover:text-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:text-primary"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              重新开始调研
            </button>
          </div>
        ) : null}
      </div>

      <div className="relative flex flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="pointer-events-none absolute left-1/2 top-0 h-48 w-[120%] -translate-x-1/2 bg-primary/20 blur-[80px]"></div>

        <div className="relative z-10 mb-8 flex items-center justify-between">
          <h3 className="flex items-center gap-3 text-[16px] font-bold text-white">
            <span className="material-symbols-outlined text-[24px] text-emerald-400">terminal</span>
            执行计划
          </h3>
          {surveyStep >= 2 ? (
            <span className={`rounded-full border px-3 py-1.5 text-[12px] font-mono font-bold ${isGenerating ? 'border-amber-500/30 bg-amber-500/20 text-amber-400' : 'border-emerald-500/30 bg-emerald-500/20 text-emerald-400'}`}>
              {isGenerating ? 'RUNNING' : 'COMPLETED'}
            </span>
          ) : null}
        </div>

        <div className="custom-scrollbar relative z-10 flex-1 space-y-8 overflow-y-auto pr-4">
          {surveyStep < 2 ? (
            <div className="flex h-full flex-col items-center justify-center space-y-4 text-slate-500">
              <span className="material-symbols-outlined text-5xl opacity-20">hourglass_empty</span>
              <p className="text-[14px]">等待调研完成以生成执行计划...</p>
            </div>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              <div className="flex gap-5">
                <div className="relative mt-0.5">
                  <span className="material-symbols-outlined relative z-10 bg-slate-900 text-[24px] text-emerald-500">check_circle</span>
                  <div className="absolute left-1/2 top-6 h-10 w-px -translate-x-1/2 bg-emerald-500/30"></div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-200">解析业务需求</div>
                  <div className="mt-2 text-[14px] leading-relaxed text-slate-400">
                    {surveyPlan?.summary || `已提取核心诉求：模式为“${surveyAnswers[0]}”，数据来源为“${surveyAnswers[1]}”。`}
                  </div>
                  {surveyPlanModel ? (
                    <div className="mt-3 inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-300">
                      模型：{surveyPlanModel}
                    </div>
                  ) : null}
                </div>
              </div>

              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }} className="flex gap-5">
                <div className="relative mt-0.5">
                  <span className={`material-symbols-outlined relative z-10 bg-slate-900 text-[24px] ${isGenerating ? 'animate-spin text-amber-500' : 'text-emerald-500'}`}>
                    {isGenerating ? 'sync' : 'check_circle'}
                  </span>
                  <div className={`absolute left-1/2 top-6 h-32 w-px -translate-x-1/2 ${isGenerating ? 'bg-amber-500/30' : 'bg-emerald-500/30'}`}></div>
                </div>
                <div>
                  <div className="text-[15px] font-bold text-slate-200">构建领域模型 (Domain Model)</div>
                  <div className="mt-2 text-[14px] leading-relaxed text-slate-400">基于 MiniMax 返回结果生成主档、明细与关联建议。</div>
                  <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/80 p-4 font-mono text-[13px] leading-relaxed text-emerald-400/80 shadow-inner">
                    {(surveyPlan?.domainModel?.length ? surveyPlan.domainModel : [
                      '建议补充主表、明细表和日志表。',
                      '建议建立主从关系与基础状态字段。',
                    ]).map((item, index) => (
                      <div key={`domain-model-${index}`}>
                        <span className="mr-2 text-slate-500">$</span>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>

              {!isGenerating && !surveyError ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-5">
                  <div className="relative mt-0.5">
                    <span className="material-symbols-outlined relative z-10 bg-slate-900 text-[24px] text-emerald-500">check_circle</span>
                  </div>
                  <div className="w-full">
                    <div className="text-[15px] font-bold text-slate-200">生成交互原型与架构评估</div>
                    <div className="mt-2 text-[14px] leading-relaxed text-slate-400">已输出架构方案、复杂度和开发周期建议。</div>

                    <div className="mt-4 space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-5 font-mono text-[13px] leading-relaxed text-emerald-400/90 shadow-inner">
                      <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2 text-[14px] font-bold text-white/90">
                        <span className="material-symbols-outlined text-[18px] text-primary">analytics</span>
                        <span>架构方案评估报告 (Architecture Assessment Report)</span>
                      </div>
                      <p><span className="text-slate-500"># 核心模式:</span> {surveyAnswers[0]}</p>
                      <p><span className="text-slate-500"># 数据来源:</span> {surveyAnswers[1]}</p>
                      <p><span className="text-slate-500"># 复杂度评估:</span> <span className="text-amber-400">{surveyPlan?.complexity || '中'}</span></p>
                      <p><span className="text-slate-500"># 预计开发周期:</span> {surveyPlan?.duration || '2-3 周'}</p>
                      <div className="border-t border-slate-800/50 pt-2">
                        <p className="mb-1 text-slate-400">推荐技术栈与中间件:</p>
                        <ul className="list-disc space-y-1 pl-5 text-emerald-500/80">
                          {(surveyPlan?.architecture?.length ? surveyPlan.architecture : [
                            '前端: React + Vite + TailwindCSS',
                            '后端: Node.js 代理 MiniMax API',
                            '存储: PostgreSQL 或 SQL Server',
                            '缓存: Redis 或本地缓存层',
                          ]).map((item, index) => (
                            <li key={`architecture-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-t border-slate-800/50 pt-2">
                        <p className="mb-1 text-slate-400">实施建议:</p>
                        <ul className="list-disc space-y-1 pl-5 text-emerald-300">
                          {(surveyPlan?.recommendations?.length ? surveyPlan.recommendations : [
                            '先完成主档与明细结构定义。',
                            '把 AI 结果作为配置建议，不直接覆盖业务规则。',
                          ]).map((item, index) => (
                            <li key={`recommendation-${index}`}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="border-t border-slate-800/50 pt-2 text-emerald-300">
                        <span className="mr-2 text-slate-500">$</span> MiniMax plan ready for follow-up configuration.
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {!isGenerating && surveyError ? (
                <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-[13px] leading-6 text-rose-200">
                  <div className="font-bold">MiniMax 调用失败</div>
                  <div className="mt-2 break-words text-rose-100/90">{surveyError}</div>
                  <div className="mt-3 text-rose-100/70">请先在 `.env.local` 中放入一个新的可用 API Key，再重新开始调研。</div>
                </div>
              ) : null}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
