import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ActivityBar } from '@/components/activity-bar';
import { FileExplorer } from '@/components/file-explorer';
import { MonacoEditor } from '@/components/monaco-editor';
import { ChatPanel } from '@/components/chat-panel';
import { TerminalPanel } from '@/components/terminal-panel';
import { Toolbar } from '@/components/toolbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { isUnauthorizedError } from '@/lib/authUtils';
import type { Project, ProjectFile, ChatMessage, User } from '@shared/schema';

interface OnlineUser {
  userId: string;
  name: string;
  color: string;
  status: 'online' | 'away' | 'busy';
  cursor?: { line: number; column: number };
}

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeView, setActiveView] = useState('explorer');
  const [currentProject, setCurrentProject] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [openFiles, setOpenFiles] = useState<ProjectFile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [chatMessages, setChatMessages] = useState<Array<ChatMessage & { user: User }>>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Project creation form
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectDescription, setProjectDescription] = useState('');

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [user, authLoading, toast]);

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['/api/projects'],
    enabled: !!user,
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  const { data: messages } = useQuery({
    queryKey: ['/api/projects', currentProject, 'messages'],
    enabled: !!currentProject,
    onSuccess: (data) => {
      setChatMessages(data || []);
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest('POST', '/api/projects', data);
      return response.json();
    },
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      setCurrentProject(project.id);
      setShowCreateProject(false);
      setProjectName('');
      setProjectDescription('');
      toast({
        title: "Project created",
        description: `${project.name} has been created successfully.`,
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // WebSocket connection
  useEffect(() => {
    if (!user || !currentProject) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setOnlineUsers([{
        userId: user.id,
        name: user.firstName || user.email || 'You',
        color: '#4FC3F7',
        status: 'online',
      }]);
      
      // Send user joined message
      ws.send(JSON.stringify({
        type: 'user_joined',
        userId: user.id,
        projectId: currentProject,
        data: {
          userId: user.id,
          name: user.firstName || user.email || 'You',
          color: '#4FC3F7',
        },
      }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      
      switch (message.type) {
        case 'user_joined':
          setOnlineUsers(prev => {
            const existing = prev.find(u => u.userId === message.data.userId);
            if (existing) return prev;
            return [...prev, {
              userId: message.data.userId,
              name: message.data.name,
              color: message.data.color,
              status: 'online',
            }];
          });
          break;
          
        case 'user_left':
          setOnlineUsers(prev => prev.filter(u => u.userId !== message.data.userId));
          break;
          
        case 'chat_message':
          setChatMessages(prev => [message.data, ...prev]);
          break;
          
        case 'file_change':
          // Handle file changes from other users
          break;
          
        case 'cursor_position':
          setOnlineUsers(prev => prev.map(u => 
            u.userId === message.userId 
              ? { ...u, cursor: message.data.cursor }
              : u
          ));
          break;
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, [user, currentProject]);

  const handleFileSelect = (file: ProjectFile) => {
    setSelectedFile(file);
    if (!openFiles.find(f => f.id === file.id)) {
      setOpenFiles(prev => [...prev, file]);
    }
  };

  const handleFileChange = (fileId: number, content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'file_change',
        userId: user?.id,
        projectId: currentProject,
        data: { fileId, content },
      }));
    }
  };

  const handleSendMessage = (content: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN && user) {
      wsRef.current.send(JSON.stringify({
        type: 'chat_message',
        userId: user.id,
        projectId: currentProject,
        data: { content },
      }));
    }
  };

  const handleRun = () => {
    if (selectedFile) {
      toast({
        title: "Running code",
        description: "Check the terminal output below.",
      });
    }
  };

  const handleSave = () => {
    toast({
      title: "Saved",
      description: "All changes have been saved.",
    });
  };

  const handleShare = () => {
    if (currentProject) {
      const shareUrl = `${window.location.origin}/project/${currentProject}`;
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied",
        description: "Project link has been copied to clipboard.",
      });
    }
  };

  if (authLoading || projectsLoading) {
    return (
      <div className="min-h-screen bg-vscode-bg flex items-center justify-center">
        <div className="text-vscode-text">Loading...</div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen bg-vscode-bg flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-vscode-blue rounded-lg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              CC
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Welcome to CodeCollab</h1>
            <p className="text-vscode-text-muted">Choose a project to start coding</p>
          </div>

          <div className="space-y-4">
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button className="w-full bg-vscode-blue hover:bg-vscode-blue/80">
                  <i className="fas fa-plus mr-2"></i>
                  Create New Project
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-vscode-sidebar border-vscode-border">
                <DialogHeader>
                  <DialogTitle className="text-white">Create New Project</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-vscode-text">Project Name</Label>
                    <Input
                      id="name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="My Awesome Project"
                      className="bg-vscode-panel border-vscode-border text-vscode-text"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description" className="text-vscode-text">Description</Label>
                    <Textarea
                      id="description"
                      value={projectDescription}
                      onChange={(e) => setProjectDescription(e.target.value)}
                      placeholder="A brief description of your project..."
                      className="bg-vscode-panel border-vscode-border text-vscode-text"
                    />
                  </div>
                  <Button
                    onClick={() => createProjectMutation.mutate({ name: projectName, description: projectDescription })}
                    disabled={!projectName.trim() || createProjectMutation.isPending}
                    className="w-full bg-vscode-blue hover:bg-vscode-blue/80"
                  >
                    {createProjectMutation.isPending ? 'Creating...' : 'Create Project'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {projects && projects.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-vscode-text-muted">Your Projects</h3>
                {projects.map((project: Project) => (
                  <Button
                    key={project.id}
                    variant="outline"
                    className="w-full justify-start bg-vscode-panel border-vscode-border text-vscode-text hover:bg-vscode-panel/80"
                    onClick={() => setCurrentProject(project.id)}
                  >
                    <i className="fas fa-folder-open mr-2 text-vscode-accent"></i>
                    {project.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-vscode-bg text-vscode-text">
      <ActivityBar activeView={activeView} onViewChange={setActiveView} />
      
      {activeView === 'explorer' && (
        <FileExplorer
          projectId={currentProject}
          onFileSelect={handleFileSelect}
          selectedFile={selectedFile}
          onlineUsers={onlineUsers}
        />
      )}
      
      <div className="flex-1 flex flex-col">
        <Toolbar
          onRun={handleRun}
          onSave={handleSave}
          onShare={handleShare}
          isConnected={isConnected}
        />
        
        {/* Editor Tabs */}
        <div className="h-10 bg-vscode-bg border-b border-vscode-border flex items-center">
          <div className="flex">
            {openFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => setSelectedFile(file)}
                className={`flex items-center px-4 py-2 border-r border-vscode-border text-sm cursor-pointer ${
                  selectedFile?.id === file.id 
                    ? 'bg-vscode-panel text-white' 
                    : 'text-vscode-text-muted hover:text-white'
                }`}
              >
                <i className={`fas fa-file-code mr-2 ${
                  file.language === 'javascript' ? 'text-yellow-400' :
                  file.language === 'html' ? 'text-orange-400' :
                  file.language === 'css' ? 'text-blue-400' :
                  'text-gray-400'
                }`}></i>
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenFiles(prev => prev.filter(f => f.id !== file.id));
                    if (selectedFile?.id === file.id) {
                      setSelectedFile(openFiles[0] || null);
                    }
                  }}
                  className="ml-2 w-4 h-4 flex items-center justify-center text-vscode-text-muted hover:text-white"
                >
                  <i className="fas fa-times text-xs"></i>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor and Chat */}
        <div className="flex-1 flex">
          {selectedFile ? (
            <MonacoEditor
              file={selectedFile}
              onFileChange={handleFileChange}
              collaborators={onlineUsers}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-vscode-bg">
              <div className="text-center">
                <i className="fas fa-file-code text-4xl text-vscode-text-muted mb-4"></i>
                <p className="text-vscode-text-muted">Select a file to start editing</p>
              </div>
            </div>
          )}
          
          <ChatPanel
            projectId={currentProject}
            onlineUsers={onlineUsers}
            onSendMessage={handleSendMessage}
            messages={chatMessages}
          />
        </div>

        <TerminalPanel
          currentFile={selectedFile ? { content: selectedFile.content, language: selectedFile.language } : undefined}
        />
      </div>
    </div>
  );
}
