import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { DashboardOverview } from './dashboard-overview';

export function DashboardOverviewPane({
  contentKey,
  overviewProps,
}: {
  contentKey: string;
  overviewProps: React.ComponentProps<typeof DashboardOverview>;
}) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={contentKey}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="h-full flex flex-col"
      >
        <DashboardOverview {...overviewProps} />
      </motion.div>
    </AnimatePresence>
  );
}
