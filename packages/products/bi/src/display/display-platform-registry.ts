export type BiDisplayPlatformDefinition = {
  accent: string;
  coverLines: string[];
  description: string;
  heroLabel: string;
  heroValue: string;
  platformCode: string;
  rootNodeCode: string;
  subtitle: string;
  title: string;
};

export const DEFAULT_BI_DISPLAY_PLATFORM_CODE = 'langsu';

export const biDisplayPlatforms: BiDisplayPlatformDefinition[] = [
  {
    accent: '#00f0ff',
    coverLines: ['\u7ec4\u7ec7\u67b6\u6784\u9a71\u52a8', '\u4e00\u4f53\u5316 BI \u5927\u5c4f'],
    description:
      '\u4ee5\u7ec4\u7ec7\u5c42\u7ea7\u4e3a\u4e3b\u7ebf\uff0c\u5728\u540c\u4e00\u4e2a\u5c55\u793a\u9875\u5185\u5b8c\u6210\u5207\u6362\u3001\u4e0b\u94bb\u548c\u5927\u5c4f\u8fd0\u884c\u3002',
    heroLabel: '\u7ec4\u7ec7\u7ef4\u5ea6',
    heroValue: '01',
    platformCode: 'langsu',
    rootNodeCode: 'root',
    subtitle: '\u6717\u901f\u7ec4\u7ec7\u5c55\u793a\u5e73\u53f0',
    title: '\u6717\u901f BI \u5c55\u793a\u5e73\u53f0',
  },
];

export function getBiDisplayPlatform(platformCode: string) {
  return biDisplayPlatforms.find((platform) => platform.platformCode === platformCode) ?? null;
}

export function getDefaultBiDisplayPath() {
  return `/bi-display/platform/${DEFAULT_BI_DISPLAY_PLATFORM_CODE}`;
}
