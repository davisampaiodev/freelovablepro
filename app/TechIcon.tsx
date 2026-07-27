type TechIconProps = {
  type: string;
  className?: string;
};

export default function TechIcon({ type, className = "" }: TechIconProps) {
  const paths: Record<string, React.ReactNode> = {
    download: <>
      <path d="M12 3.5v10.2" />
      <path d="m8.4 10.4 3.6 3.7 3.6-3.7" />
      <path d="M5 16.5v2.3c0 .9.7 1.7 1.7 1.7h10.6c1 0 1.7-.8 1.7-1.7v-2.3" />
    </>,
    token: <>
      <rect x="5" y="9" width="14" height="11" rx="3" />
      <path d="M8.2 9V7.2a3.8 3.8 0 0 1 7.6 0V9" />
      <circle cx="12" cy="14.2" r="1.2" className="tech-accent-fill" />
      <path d="M12 15.5v1.7" />
    </>,
    ai: <>
      <path d="M12 3.5 13.4 8l4.4 1.4-4.4 1.4L12 15.2l-1.4-4.4-4.4-1.4L10.6 8 12 3.5Z" />
      <path d="m18.2 14 .7 2.2 2.1.7-2.1.7-.7 2.2-.7-2.2-2.2-.7 2.2-.7.7-2.2Z" className="tech-accent" />
      <circle cx="5" cy="17.5" r="1.25" className="tech-node" />
    </>,
    check: <>
      <path d="M20 11.1V12a8 8 0 1 1-4.7-7.3" />
      <path d="m8.2 11.8 2.5 2.5L20 5.2" className="tech-accent" />
    </>,
    infinity: <>
      <path d="M8.3 8.2c-2.3 0-4.1 1.7-4.1 3.8s1.8 3.8 4.1 3.8c3.4 0 4.7-7.6 7.4-7.6 2.3 0 4.1 1.7 4.1 3.8s-1.8 3.8-4.1 3.8c-3.4 0-4.7-7.6-7.4-7.6Z" />
      <circle cx="12" cy="12" r="1.1" className="tech-accent-fill" />
    </>,
    shield: <>
      <path d="M12 3.2 19 6v5.3c0 4.4-2.8 7.8-7 9.5-4.2-1.7-7-5.1-7-9.5V6l7-2.8Z" />
      <path d="m8.7 12 2.1 2.1 4.7-4.8" className="tech-accent" />
    </>,
    mail: <>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2.8" />
      <path d="m5 7 7 5.5L19 7" className="tech-accent" />
      <path d="m5 17 4.7-4.3M19 17l-4.7-4.3" opacity=".55" />
    </>,
    users: <>
      <circle cx="12" cy="8.2" r="3.1" />
      <path d="M6.4 20v-1.8c0-3 2.5-5.4 5.6-5.4s5.6 2.4 5.6 5.4V20" />
      <path d="M5.6 10.7a2.5 2.5 0 0 0-1.4 4.6M18.4 10.7a2.5 2.5 0 0 1 1.4 4.6" className="tech-accent" />
    </>,
    projects: <>
      <path d="M3.8 7.5h6l1.7 2H20v8.7c0 1-.8 1.8-1.8 1.8H5.6c-1 0-1.8-.8-1.8-1.8V7.5Z" />
      <path d="M7.2 14h9.6M9.2 11.3h5.6M9.2 16.7h5.6" className="tech-accent" />
    </>,
    gift: <>
      <rect x="4" y="10" width="16" height="10" rx="2" />
      <path d="M3.2 7h17.6v4H3.2zM12 7v13" />
      <path d="M12 7H8.5a2.3 2.3 0 1 1 0-4.6C10.8 2.4 12 7 12 7Zm0 0h3.5a2.3 2.3 0 1 0 0-4.6C13.2 2.4 12 7 12 7Z" className="tech-accent" />
    </>,
    tap: <>
      <path d="M12 9.5V5.8a1.8 1.8 0 0 0-3.6 0v8.4l-1.1-1.5a1.7 1.7 0 0 0-2.7 2l3.2 4.7c.7 1 1.8 1.6 3 1.6h3.7c2.6 0 4.6-2.1 4.6-4.6v-5.1a1.7 1.7 0 0 0-3.4 0v-1a1.7 1.7 0 0 0-3.4 0v-.8" />
      <path d="M5.5 8.4a6.8 6.8 0 0 1-.3-2A6.8 6.8 0 0 1 12 0" className="tech-accent" />
      <path d="M15.7 1.1A6.8 6.8 0 0 1 18.8 7" className="tech-accent" />
      <path d="M7.2 6.7A4.8 4.8 0 0 1 12 1.8a4.8 4.8 0 0 1 4.8 4.8" opacity=".58" />
    </>,
  };

  return (
    <span className={`tech-icon tech-${type} ${className}`.trim()} aria-hidden="true">
      <svg viewBox="0 0 24 24" focusable="false">
        {paths[type] || paths.ai}
      </svg>
    </span>
  );
}
