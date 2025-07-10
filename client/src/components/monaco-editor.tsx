import { useEffect, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import type { ProjectFile } from '@shared/schema';

interface MonacoEditorProps {
  file: ProjectFile;
  onFileChange: (fileId: number, content: string) => void;
  collaborators: Array<{ userId: string; name: string; color: string; cursor?: { line: number; column: number } }>;
}

export function MonacoEditor({ file, onFileChange, collaborators }: MonacoEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [monaco, setMonaco] = useState<any>(null);
  const [editor, setEditor] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateFileMutation = useMutation({
    mutationFn: async (data: { content: string }) => {
      const response = await apiRequest('PUT', `/api/files/${file.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects', file.projectId] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Load Monaco Editor
  useEffect(() => {
    const loadMonaco = async () => {
      if (window.monaco) {
        setMonaco(window.monaco);
        return;
      }

      // Load Monaco Editor from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs/loader.js';
      script.onload = () => {
        window.require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.45.0/min/vs' } });
        window.require(['vs/editor/editor.main'], () => {
          setMonaco(window.monaco);
        });
      };
      document.head.appendChild(script);
    };

    loadMonaco();
  }, []);

  // Initialize editor when Monaco is loaded
  useEffect(() => {
    if (!monaco || !editorRef.current) return;

    const newEditor = monaco.editor.create(editorRef.current, {
      value: file.content,
      language: file.language,
      theme: 'vs-dark',
      fontSize: 14,
      fontFamily: 'Fira Code, Monaco, Menlo, monospace',
      lineNumbers: 'on',
      minimap: { enabled: false },
      automaticLayout: true,
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      tabSize: 2,
      insertSpaces: true,
    });

    // Handle content changes
    newEditor.onDidChangeModelContent(() => {
      const content = newEditor.getValue();
      onFileChange(file.id, content);
      
      // Debounced save to backend
      const timeoutId = setTimeout(() => {
        updateFileMutation.mutate({ content });
      }, 1000);

      return () => clearTimeout(timeoutId);
    });

    setEditor(newEditor);

    return () => {
      newEditor.dispose();
    };
  }, [monaco, file.id]);

  // Update editor content when file changes
  useEffect(() => {
    if (editor && file.content !== editor.getValue()) {
      editor.setValue(file.content);
    }
  }, [editor, file.content]);

  // Render collaborator cursors
  useEffect(() => {
    if (!editor || !monaco) return;

    const decorations: any[] = [];

    collaborators.forEach(collaborator => {
      if (collaborator.cursor) {
        decorations.push({
          range: new monaco.Range(
            collaborator.cursor.line,
            collaborator.cursor.column,
            collaborator.cursor.line,
            collaborator.cursor.column
          ),
          options: {
            className: 'collaborator-cursor',
            beforeContentClassName: 'collaborator-cursor-before',
            afterContentClassName: 'collaborator-cursor-after',
            glyphMarginClassName: 'collaborator-glyph',
            stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          }
        });
      }
    });

    editor.deltaDecorations([], decorations);
  }, [editor, monaco, collaborators]);

  return (
    <div className="flex-1 relative">
      <div 
        ref={editorRef} 
        className="h-full w-full bg-vscode-bg"
        style={{ minHeight: '400px' }}
      />
      
      {/* Collaboration Status Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-6 bg-vscode-panel border-t border-vscode-border flex items-center justify-between px-4 text-xs">
        <div className="flex items-center space-x-4">
          <span className="text-vscode-text-muted">
            {file.language.charAt(0).toUpperCase() + file.language.slice(1)}
          </span>
          <span className="text-vscode-text-muted">UTF-8</span>
          <span className="text-vscode-text-muted">LF</span>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-vscode-text-muted">
            {/* This would show actual cursor position */}
            Ln 1, Col 1
          </span>
          <div className="flex items-center space-x-2">
            {collaborators.map(collaborator => (
              <div key={collaborator.userId} className="flex items-center space-x-1">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: collaborator.color }}
                />
                <span style={{ color: collaborator.color }}>
                  {collaborator.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
