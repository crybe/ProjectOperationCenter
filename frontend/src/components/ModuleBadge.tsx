import { Shield, Lock, FlaskConical, Activity } from 'lucide-react';

export type BadgeStatus = 'LIVE' | 'LOCKED' | 'EXPERIMENTAL' | 'SECURE' | 'TACTICAL';

interface ModuleBadgeProps {
  status: BadgeStatus;
  className?: string;
}

export default function ModuleBadge({ status, className = "" }: ModuleBadgeProps) {
  const config = {
    LIVE: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: Activity,
      label: 'SYSTEM_LIVE',
      glow: 'shadow-[0_0_10px_rgba(16,185,129,0.3)]'
    },
    LOCKED: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      icon: Lock,
      label: 'ENCRYPTED',
      glow: 'shadow-[0_0_10px_rgba(244,63,94,0.3)]'
    },
    EXPERIMENTAL: {
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      icon: FlaskConical,
      label: 'UNSTABLE_V1',
      glow: 'shadow-[0_0_10px_rgba(245,158,11,0.3)]'
    },
    SECURE: {
      color: 'text-cyan-500',
      bg: 'bg-cyan-500/10',
      border: 'border-cyan-500/20',
      icon: Shield,
      label: 'HARDENED',
      glow: 'shadow-[0_0_10px_rgba(6,182,212,0.3)]'
    },
    TACTICAL: {
      color: 'text-emerald-500',
      bg: 'bg-emerald-600/10',
      border: 'border-emerald-600/30',
      icon: Shield,
      label: 'TACTICAL_LINK',
      glow: 'shadow-[0_0_15px_rgba(225,29,72,0.4)]'
    }
  }[status];

  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border ${config.bg} ${config.border} ${config.glow} ${className} backdrop-blur-md`}>
      <Icon className={`w-3 h-3 ${config.color}`} />
      <span className={`text-[9px] font-black tracking-[0.2em] uppercase ${config.color} italic`}>
        {config.label}
      </span>
      <div className={`w-1 h-1 rounded-full ${config.color.replace('text-', 'bg-')} animate-pulse ml-0.5`} />
    </div>
  );
}
