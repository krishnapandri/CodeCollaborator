import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TerminalPanelProps {
  currentFile?: { content: string; language: string };
}

interface ExecutionResult {
  output: string | null;
  error: string | null;
}

export function TerminalPanel({ currentFile }: TerminalPanelProps) {
  const [activeTab, setActiveTab] = useState<'terminal' | 'debug' | 'problems'>('terminal');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '$ Welcome to CodeCollab Terminal',
    '$ Type "run" to execute the current file',
    '$ ',
  ]);
  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const executeCodeMutation = useMutation({
    mutationFn: async (data: { code: string; language: string }) => {
      const response = await apiRequest('POST', '/api/execute', data);
      return response.json();
    },
    onSuccess: (result: ExecutionResult) => {
      if (result.output) {
        setTerminalOutput(prev => [...prev, `Output: ${result.output}`, '$ ']);
      }
      if (result.error) {
        setTerminalOutput(prev => [...prev, `Error: ${result.error}`, '$ ']);
      }
    },
    onError: (error) => {
      setTerminalOutput(prev => [...prev, `Error: ${error.message}`, '$ ']);
      toast({
        title: "Execution Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [terminalOutput]);

  const handleCommand = (command: string) => {
    setTerminalOutput(prev => [...prev.slice(0, -1), `$ ${command}`]);
    
    switch (command.toLowerCase().trim()) {
      case 'run':
        if (currentFile?.content) {
          setTerminalOutput(prev => [...prev, `Running ${currentFile.language} code...`]);
          executeCodeMutation.mutate({
            code: currentFile.content,
            language: currentFile.language,
          });
        } else {
          setTerminalOutput(prev => [...prev, 'No file selected to run', '$ ']);
        }
        break;
      case 'clear':
        setTerminalOutput(['$ ']);
        break;
      case 'help':
        setTerminalOutput(prev => [
          ...prev,
          'Available commands:',
          '  run    - Execute the current file',
          '  clear  - Clear the terminal',
          '  help   - Show this help message',
          '$ '
        ]);
        break;
      case '':
        setTerminalOutput(prev => [...prev, '$ ']);
        break;
      default:
        setTerminalOutput(prev => [...prev, `Command not found: ${command}`, '$ ']);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCommand(input);
      setInput('');
    }
  };

  return (
    <div className="h-48 bg-vscode-bg border-t border-vscode-border flex flex-col">
      {/* Terminal Tabs */}
      <div className="h-10 border-b border-vscode-border flex items-center px-4">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-2 text-sm cursor-pointer pb-2 ${
              activeTab === 'terminal'
                ? 'text-white border-b-2 border-vscode-blue'
                : 'text-vscode-text-muted hover:text-white'
            }`}
          >
            <i className="fas fa-terminal"></i>
            <span>Terminal</span>
          </button>
          <button
            onClick={() => setActiveTab('debug')}
            className={`flex items-center space-x-2 text-sm cursor-pointer pb-2 ${
              activeTab === 'debug'
                ? 'text-white border-b-2 border-vscode-blue'
                : 'text-vscode-text-muted hover:text-white'
            }`}
          >
            <i className="fas fa-bug"></i>
            <span>Debug Console</span>
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`flex items-center space-x-2 text-sm cursor-pointer pb-2 ${
              activeTab === 'problems'
                ? 'text-white border-b-2 border-vscode-blue'
                : 'text-vscode-text-muted hover:text-white'
            }`}
          >
            <i className="fas fa-exclamation-triangle"></i>
            <span>Problems</span>
          </button>
        </div>
        <div className="ml-auto flex space-x-2">
          <button className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors">
            <i className="fas fa-plus text-xs"></i>
          </button>
          <button
            onClick={() => setTerminalOutput(['$ '])}
            className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors"
          >
            <i className="fas fa-trash text-xs"></i>
          </button>
        </div>
      </div>

      {/* Terminal Content */}
      {activeTab === 'terminal' && (
        <div className="flex-1 flex flex-col">
          <div
            ref={terminalRef}
            className="flex-1 p-4 font-mono text-sm overflow-y-auto bg-vscode-bg"
          >
            {terminalOutput.map((line, index) => (
              <div key={index} className="whitespace-pre-wrap">
                {line.startsWith('Error:') ? (
                  <span className="text-red-400">{line}</span>
                ) : line.startsWith('Output:') ? (
                  <span className="text-green-400">{line}</span>
                ) : line.startsWith('$') ? (
                  <span className="text-green-400">{line}</span>
                ) : (
                  <span className="text-vscode-text">{line}</span>
                )}
              </div>
            ))}
          </div>
          <div className="px-4 pb-4">
            <div className="flex items-center space-x-2">
              <span className="text-green-400">$</span>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1 bg-transparent border-none outline-none text-vscode-text font-mono text-sm"
                placeholder="Type a command..."
                autoFocus
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === 'debug' && (
        <div className="flex-1 p-4 text-sm text-vscode-text-muted">
          Debug console is not implemented yet.
        </div>
      )}

      {activeTab === 'problems' && (
        <div className="flex-1 p-4 text-sm text-vscode-text-muted">
          No problems detected.
        </div>
      )}
    </div>
  );
}
