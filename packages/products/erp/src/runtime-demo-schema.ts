import type { PlatformPageSchema } from '@lserp/contracts';

export const erpBillDraftSchema: PlatformPageSchema = {
  actions: [
    {
      id: 'resetDraft',
      kind: 'reset',
      messageTemplate: 'Draft reset back to schema defaults.',
    },
    {
      id: 'simulateSubmit',
      kind: 'submit',
      messageTemplate:
        'Submitted {{billNo}} for {{customerName}} with amount {{amount}}.',
      permission: {
        enabledWhen:
          'permissions.canSubmit == true && customerName != "" && approvalMode != ""',
      },
    },
  ],
  behaviorRules: [
    {
      condition: 'amount > 10000',
      effect: 'highlightAmount',
      id: 'rule.amount.highlight',
    },
  ],
  datasources: [
    {
      id: 'approval-mode-options',
      kind: 'static-options',
      options: [
        {
          label: 'Standard Review',
          value: 'standard',
        },
        {
          label: 'Fast Track',
          value: 'fast-track',
          when: 'amount < 10000',
        },
        {
          label: 'High Value Approval',
          value: 'high-value',
          when: 'amount >= 10000',
        },
      ],
    },
  ],
  fields: [
    {
      field: 'billNo',
      initialValue: 'SO-1001',
      label: 'Bill Number',
      valueType: 'string',
    },
    {
      field: 'customerName',
      initialValue: 'Hangzhou Demo Industry',
      label: 'Customer',
      validations: [
        {
          id: 'customer.required',
          kind: 'required',
          message: 'Customer name cannot be empty.',
        },
      ],
      valueType: 'string',
    },
    {
      control: 'select',
      datasourceId: 'approval-mode-options',
      field: 'approvalMode',
      initialValue: 'standard',
      label: 'Approval Mode',
      permission: {
        visibleWhen: 'permissions.canViewApproval == true',
      },
      validations: [
        {
          id: 'approval.required',
          kind: 'required',
          message: 'Approval mode must be selected.',
          when: 'permissions.canViewApproval == true',
        },
      ],
      valueType: 'string',
    },
    {
      field: 'amount',
      initialValue: 12800,
      label: 'Amount',
      permission: {
        editableWhen: 'permissions.canEditAmount == true',
      },
      validations: [
        {
          id: 'amount.min',
          kind: 'min',
          message: 'Amount must stay greater than 0.',
          value: 1,
        },
      ],
      valueType: 'number',
    },
  ],
  id: 'erp.bill.draft',
  template: 'bill',
  title: 'ERP Draft Bill',
  view: {
    root: {
      children: [
        {
          component: 'hero',
          id: 'hero',
          kind: 'section',
          props: {
            eyebrow: 'Runtime Demo',
            title: 'Metadata-driven bill draft',
          },
          slots: {
            default: [
              {
                component: 'text',
                id: 'hero-text',
                kind: 'text',
                props: {
                  template:
                    'This view is driven by schema. Runtime values can change without rewriting the page component.',
                },
              },
            ],
          },
        },
        {
          component: 'field-grid',
          id: 'field-grid',
          kind: 'section',
          children: [
            {
              component: 'field-input',
              id: 'field-bill-no',
              kind: 'field',
              props: {
                field: 'billNo',
                label: 'Bill Number',
                placeholder: 'Enter bill number',
              },
            },
            {
              component: 'field-input',
              id: 'field-customer',
              kind: 'field',
              props: {
                field: 'customerName',
                label: 'Customer',
                placeholder: 'Enter customer name',
              },
            },
            {
              component: 'field-input',
              id: 'field-amount',
              kind: 'field',
              props: {
                field: 'amount',
                label: 'Amount',
                placeholder: 'Enter amount',
              },
            },
            {
              component: 'field-select',
              id: 'field-approval-mode',
              kind: 'field',
              props: {
                control: 'select',
                field: 'approvalMode',
                label: 'Approval Mode',
                placeholder: 'Select approval mode',
              },
            },
          ],
          props: {
            title: 'Template Fields',
          },
        },
        {
          component: 'summary-panel',
          id: 'summary-panel',
          kind: 'section',
          children: [
            {
              component: 'text',
              id: 'summary-text',
              kind: 'text',
              props: {
                template:
                  'Draft {{billNo}} for {{customerName}} currently totals {{amount}} and uses {{approvalMode}} approval.',
              },
            },
            {
              component: 'text',
              id: 'summary-warning',
              kind: 'text',
              props: {
                template:
                  'High value bill detected. Approval workflow should be enforced.',
              },
              visibleWhen: 'amount > 10000',
            },
          ],
          props: {
            title: 'Runtime Summary',
          },
        },
        {
          component: 'action-row',
          id: 'action-row',
          kind: 'section',
          children: [
            {
              actionRefs: [{ actionId: 'resetDraft', trigger: 'click' }],
              component: 'action-button',
              id: 'action-reset',
              kind: 'action',
              props: {
                label: 'Reset Draft',
                tone: 'ghost',
              },
            },
            {
              actionRefs: [{ actionId: 'simulateSubmit', trigger: 'click' }],
              component: 'action-button',
              id: 'action-submit',
              kind: 'action',
              props: {
                label: 'Simulate Submit',
                tone: 'primary',
              },
            },
          ],
        },
      ],
      component: 'runtime-page',
      id: 'page-root',
      kind: 'page',
    },
    templateKind: 'bill',
    version: '1.0.0',
  },
};
