import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { HABIT_ICONS } from '../../constants/habitIcons';

interface HabitIconProps {
  name: string;
  className?: string;
}

export const HabitIcon: React.FC<HabitIconProps> = ({ name, className = 'w-5 h-5' }) => {
  const found = HABIT_ICONS.find((item) => item.id === name);
  const IconComponent = found ? found.icon : CheckCircle2;
  return <IconComponent className={className} />;
};
