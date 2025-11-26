import React from 'react';
import { CouncilMember } from '../types';
import { Icon } from './Icon';

interface Props {
  member: CouncilMember;
  isActive: boolean;
  onToggle: (id: string) => void;
}

const colorStyles: Record<string, { active: string, icon: string }> = {
  emerald: { active: 'border-emerald-500/50 shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)] bg-emerald-950/20', icon: 'text-emerald-400' },
  rose: { active: 'border-rose-500/50 shadow-[0_0_20px_-5px_rgba(244,63,94,0.2)] bg-rose-950/20', icon: 'text-rose-400' },
  violet: { active: 'border-violet-500/50 shadow-[0_0_20px_-5px_rgba(139,92,246,0.2)] bg-violet-950/20', icon: 'text-violet-400' },
  amber: { active: 'border-amber-500/50 shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] bg-amber-950/20', icon: 'text-amber-400' },
  sky: { active: 'border-sky-500/50 shadow-[0_0_20px_-5px_rgba(14,165,233,0.2)] bg-sky-950/20', icon: 'text-sky-400' },
};

export const CouncilMemberCard: React.FC<Props> = ({ member, isActive, onToggle }) => {
  const styles = colorStyles[member.color];
  
  return (
    <div 
      className={`
        relative flex items-center p-3 rounded-lg border transition-all duration-300 cursor-pointer group select-none
        ${isActive 
          ? `${styles.active}` 
          : 'border-slate-800/50 bg-slate-900/30 text-slate-500 hover:border-slate-700 hover:bg-slate-800'
        }
      `}
      onClick={() => onToggle(member.id)}
    >
      <div className={`p-2 rounded-md bg-slate-900 border border-slate-800 transition-colors ${isActive ? styles.icon : 'text-slate-600 group-hover:text-slate-400'}`}>
        <Icon name={member.icon} size={18} />
      </div>
      
      <div className="flex-1 ml-3 min-w-0">
        <div className="flex items-center justify-between">
           <h3 className={`text-sm font-medium truncate ${isActive ? 'text-slate-200' : 'text-slate-500'}`}>{member.name}</h3>
           {isActive && <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)] animate-pulse"></div>}
        </div>
        <p className="text-[10px] text-slate-500 truncate font-mono mt-0.5 opacity-80">{member.role}</p>
      </div>
    </div>
  );
};