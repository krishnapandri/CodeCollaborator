import { useTheme } from './theme-provider';
import { useAuth } from '@/hooks/useAuth';

interface ToolbarProps {
  onRun: () => void;
  onSave: () => void;
  onShare: () => void;
  isConnected: boolean;
}

export function Toolbar({ onRun, onSave, onShare, isConnected }: ToolbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="h-10 bg-vscode-panel border-b border-vscode-border flex items-center justify-between px-4">
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <button 
            onClick={onRun}
            className="px-3 py-1 bg-vscode-blue text-white rounded text-sm hover:bg-vscode-blue/80 transition-colors"
          >
            <i className="fas fa-play mr-1"></i>
            Run
          </button>
          <button 
            onClick={onSave}
            className="px-3 py-1 bg-vscode-border text-vscode-text rounded text-sm hover:bg-vscode-border/80 transition-colors"
          >
            <i className="fas fa-save mr-1"></i>
            Save
          </button>
          <button 
            onClick={onShare}
            className="px-3 py-1 bg-vscode-border text-vscode-text rounded text-sm hover:bg-vscode-border/80 transition-colors"
          >
            <i className="fas fa-share mr-1"></i>
            Share
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-vscode-text-muted">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleTheme}
            className="w-8 h-8 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-bg rounded transition-colors"
          >
            <i className={`fas fa-${theme === 'dark' ? 'sun' : 'moon'} text-sm`}></i>
          </button>
          <div className="w-8 h-8 flex items-center justify-center">
            {user?.profileImageUrl ? (
              <img 
                src={user.profileImageUrl} 
                alt={user.firstName || 'User'} 
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <div className="w-6 h-6 bg-vscode-blue rounded-full flex items-center justify-center text-white text-xs">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
