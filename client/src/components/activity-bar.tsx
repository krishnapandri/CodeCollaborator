import { useState } from 'react';
import { cn } from '@/lib/utils';

interface ActivityBarProps {
  onViewChange: (view: string) => void;
  activeView: string;
}

export function ActivityBar({ onViewChange, activeView }: ActivityBarProps) {
  const activities = [
    { id: 'explorer', icon: 'folder', label: 'Explorer' },
    { id: 'search', icon: 'search', label: 'Search' },
    { id: 'git', icon: 'git-branch', label: 'Source Control' },
    { id: 'run', icon: 'play', label: 'Run and Debug' },
    { id: 'chat', icon: 'message-square', label: 'Chat' },
  ];

  return (
    <div className="w-12 bg-vscode-panel border-r border-vscode-border flex flex-col items-center py-2">
      <div className="mb-4">
        <div className="w-8 h-8 bg-vscode-blue rounded flex items-center justify-center text-white text-sm font-bold">
          CC
        </div>
      </div>
      
      <div className="space-y-3">
        {activities.map((activity) => (
          <button
            key={activity.id}
            onClick={() => onViewChange(activity.id)}
            className={cn(
              "w-8 h-8 flex items-center justify-center text-vscode-text hover:text-white cursor-pointer rounded transition-colors",
              activeView === activity.id && "bg-vscode-blue/20 text-white"
            )}
            title={activity.label}
          >
            <i className={`fas fa-${activity.icon} text-sm`}></i>
          </button>
        ))}
      </div>
      
      <div className="mt-auto space-y-3">
        <button className="w-8 h-8 flex items-center justify-center text-vscode-text hover:text-white cursor-pointer">
          <i className="fas fa-cog text-sm"></i>
        </button>
        <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-vscode-panel"></div>
      </div>
    </div>
  );
}
