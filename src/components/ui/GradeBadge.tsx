import React from 'react';

interface GradeBadgeProps {
  grade?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const gradeConfig: Record<string, { label: string; className: string; dot: string }> = {
  A: { label: 'Grade A', className: 'grade-badge-a', dot: 'bg-green-600' },
  'A+': { label: 'Grade A+', className: 'grade-badge-a', dot: 'bg-green-600' },
  B: { label: 'Grade B', className: 'grade-badge-b', dot: 'bg-blue-600' },
  'B+': { label: 'Grade B+', className: 'grade-badge-b', dot: 'bg-blue-600' },
  C: { label: 'Grade C', className: 'grade-badge-c', dot: 'bg-amber-700' },
  D: { label: 'Grade D', className: 'grade-badge-d', dot: 'bg-red-700' },
};

const defaultGradeConfig = { label: 'Grade A', className: 'grade-badge-a', dot: 'bg-green-600' };

const sizeClasses = {
  sm: 'text-2xs px-1.5 py-0.5',
  md: 'text-xs px-2.5 py-0.5',
  lg: 'text-sm px-3 py-1',
};

export default function GradeBadge({ grade = 'A', size = 'md', showLabel = true }: GradeBadgeProps) {
  const cleanGrade = (grade || 'A').toString().trim().toUpperCase();
  const normalizedKey = cleanGrade.startsWith('GRADE ') ? cleanGrade.replace('GRADE ', '') : cleanGrade;
  const config = gradeConfig[normalizedKey] || gradeConfig[cleanGrade] || defaultGradeConfig;

  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold ${config.className} ${sizeClasses[size]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {showLabel ? (config.label || `Grade ${grade}`) : grade}
    </span>
  );
}