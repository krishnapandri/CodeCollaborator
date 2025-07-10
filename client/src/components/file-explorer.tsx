import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Project, ProjectFile } from '@shared/schema';

interface FileExplorerProps {
  projectId: number;
  onFileSelect: (file: ProjectFile) => void;
  selectedFile?: ProjectFile;
  onlineUsers: Array<{ userId: string; name: string; color: string }>;
}

interface ProjectWithFiles extends Project {
  files: ProjectFile[];
}

export function FileExplorer({ projectId, onFileSelect, selectedFile, onlineUsers }: FileExplorerProps) {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['root']));
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery<ProjectWithFiles>({
    queryKey: ['/api/projects', projectId],
    enabled: !!projectId,
  });

  const createFileMutation = useMutation({
    mutationFn: async (data: { name: string; path: string; content: string; language: string }) => {
      const response = await apiRequest('POST', `/api/projects/${projectId}/files`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', projectId] });
      toast({
        title: "File created",
        description: "New file has been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const [newFileName, setNewFileName] = useState('');
  const [showNewFileInput, setShowNewFileInput] = useState(false);

  const handleCreateFile = () => {
    if (!newFileName.trim()) return;
    
    const extension = newFileName.split('.').pop()?.toLowerCase();
    let language = 'plaintext';
    let content = '';
    
    switch (extension) {
      case 'js':
        language = 'javascript';
        content = '// JavaScript file\n';
        break;
      case 'ts':
        language = 'typescript';
        content = '// TypeScript file\n';
        break;
      case 'html':
        language = 'html';
        content = '<!DOCTYPE html>\n<html>\n<head>\n  <title>Page</title>\n</head>\n<body>\n  \n</body>\n</html>';
        break;
      case 'css':
        language = 'css';
        content = '/* CSS file */\n';
        break;
      case 'py':
        language = 'python';
        content = '# Python file\n';
        break;
      case 'json':
        language = 'json';
        content = '{\n  \n}';
        break;
    }
    
    createFileMutation.mutate({
      name: newFileName,
      path: newFileName,
      content,
      language,
    });
    
    setNewFileName('');
    setShowNewFileInput(false);
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'js':
        return 'fab fa-js text-yellow-400';
      case 'ts':
        return 'fab fa-js text-blue-400';
      case 'html':
        return 'fab fa-html5 text-orange-400';
      case 'css':
        return 'fab fa-css3 text-blue-400';
      case 'py':
        return 'fab fa-python text-blue-400';
      case 'json':
        return 'fas fa-file-code text-gray-400';
      default:
        return 'fas fa-file text-vscode-text-muted';
    }
  };

  const getUserIndicators = (fileName: string) => {
    // Mock user indicators based on file name for demo
    const fileUsers = onlineUsers.filter(user => 
      Math.random() > 0.5 // Random assignment for demo
    );
    
    return fileUsers.slice(0, 3).map(user => (
      <div
        key={user.userId}
        className="w-2 h-2 rounded-full border border-vscode-sidebar"
        style={{ backgroundColor: user.color }}
        title={user.name}
      />
    ));
  };

  if (isLoading) {
    return (
      <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex items-center justify-center">
        <div className="text-vscode-text-muted">Loading...</div>
      </div>
    );
  }

  return (
    <div className="w-64 bg-vscode-sidebar border-r border-vscode-border flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-vscode-border">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">EXPLORER</h2>
          <div className="flex space-x-1">
            <button
              onClick={() => setShowNewFileInput(true)}
              className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors"
              title="New File"
            >
              <i className="fas fa-plus text-xs"></i>
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors">
              <i className="fas fa-folder-plus text-xs"></i>
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors">
              <i className="fas fa-refresh text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Project Info */}
      <div className="px-4 py-2 border-b border-vscode-border">
        <div className="flex items-center space-x-2">
          <i className="fas fa-folder-open text-vscode-accent text-sm"></i>
          <span className="text-sm font-medium">{project?.name}</span>
        </div>
        <div className="flex items-center space-x-2 mt-1">
          <div className="flex -space-x-1">
            {onlineUsers.map(user => (
              <div
                key={user.userId}
                className="w-4 h-4 rounded-full border border-vscode-sidebar"
                style={{ backgroundColor: user.color }}
                title={user.name}
              />
            ))}
          </div>
          <span className="text-xs text-vscode-text-muted">
            {onlineUsers.length} online
          </span>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-2 py-1">
          {/* New File Input */}
          {showNewFileInput && (
            <div className="px-2 py-1 mb-2">
              <input
                type="text"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFile();
                  } else if (e.key === 'Escape') {
                    setShowNewFileInput(false);
                    setNewFileName('');
                  }
                }}
                onBlur={() => {
                  if (newFileName.trim()) {
                    handleCreateFile();
                  } else {
                    setShowNewFileInput(false);
                  }
                }}
                placeholder="filename.ext"
                className="w-full bg-vscode-panel border border-vscode-border rounded px-2 py-1 text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:border-vscode-blue"
                autoFocus
              />
            </div>
          )}

          {/* Files */}
          {project?.files.map((file) => (
            <div
              key={file.id}
              onClick={() => onFileSelect(file)}
              className={cn(
                "px-2 py-1 text-sm flex items-center space-x-2 cursor-pointer rounded hover:bg-vscode-panel/50 transition-colors",
                selectedFile?.id === file.id && "bg-vscode-blue/20"
              )}
            >
              <i className={getFileIcon(file.name)}></i>
              <span className="flex-1">{file.name}</span>
              <div className="flex space-x-1">
                {getUserIndicators(file.name)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
