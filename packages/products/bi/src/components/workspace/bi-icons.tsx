import type React from 'react';

type IconProps = React.SVGProps<SVGSVGElement>;

function IconBase(props: IconProps) {
  return (
    <svg fill="none" viewBox="0 0 24 24" {...props}>
      {props.children}
    </svg>
  );
}

export function FolderIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M3 7.5A2.5 2.5 0 0 1 5.5 5h3.2c.5 0 1 .2 1.4.56l1.14 1.03c.18.17.42.26.67.26h6.63A2.5 2.5 0 0 1 21 9.35v8.15A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconBase>
  );
}

export function BoxIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="m12 3 7 4v10l-7 4-7-4V7z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="m5 7 7 4 7-4M12 11v10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function BotIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M8 9.5h8A2.5 2.5 0 0 1 18.5 12v4A2.5 2.5 0 0 1 16 18.5H8A2.5 2.5 0 0 1 5.5 16v-4A2.5 2.5 0 0 1 8 9.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M12 5.5V8M8.5 14h.01M15.5 14h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="m12 4 1.4 1.23 1.84-.26.8 1.67 1.74.66-.17 1.85 1.23 1.35-1.23 1.35.17 1.85-1.74.66-.8 1.67-1.84-.26L12 20l-1.4-1.23-1.84.26-.8-1.67-1.74-.66.17-1.85L4.16 12l1.23-1.35-.17-1.85 1.74-.66.8-1.67 1.84.26z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="12" r="2.5" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function GridIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconBase>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M4.5 12A7.5 7.5 0 1 0 7 6.43"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.8"
      />
      <path d="M4.5 4.5v4H8.5M12 8v4l2.5 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
    </IconBase>
  );
}

export function PlayIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8 6.5v11l8-5.5z" fill="currentColor" />
    </IconBase>
  );
}

export function ShareIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M15 8.5 9 12l6 3.5M18 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm12 8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconBase>
  );
}

export function ExternalLinkIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path
        d="M14 5h5v5M10 14 19 5M19 13v4.5A1.5 1.5 0 0 1 17.5 19h-11A1.5 1.5 0 0 1 5 17.5v-11A1.5 1.5 0 0 1 6.5 5H11"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </IconBase>
  );
}

export function DatabaseIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <ellipse cx="12" cy="6" rx="7" ry="2.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 6v6c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5V6M5 12v6c0 1.38 3.13 2.5 7 2.5s7-1.12 7-2.5v-6"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </IconBase>
  );
}

export function CodeIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="m9 8-4 4 4 4M15 8l4 4-4 4M13 6l-2 12" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </IconBase>
  );
}
