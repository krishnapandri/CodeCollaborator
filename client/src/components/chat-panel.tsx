import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import type { ChatMessage, User } from '@shared/schema';

interface ChatPanelProps {
  projectId: number;
  onlineUsers: Array<{ userId: string; name: string; color: string; status: 'online' | 'away' | 'busy' }>;
  onSendMessage: (content: string) => void;
  messages: Array<ChatMessage & { user: User }>;
}

export function ChatPanel({ projectId, onlineUsers, onSendMessage, messages }: ChatPanelProps) {
  const [newMessage, setNewMessage] = useState('');
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    onSendMessage(newMessage);
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'busy':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="w-80 bg-vscode-sidebar border-l border-vscode-border flex flex-col">
      {/* Panel Tabs */}
      <div className="h-10 border-b border-vscode-border flex">
        <div className="flex-1 flex items-center justify-center text-sm cursor-pointer bg-vscode-panel border-r border-vscode-border">
          <i className="fas fa-comments mr-2"></i>
          Chat
        </div>
        <div className="flex-1 flex items-center justify-center text-sm cursor-pointer text-vscode-text-muted hover:text-white">
          <i className="fas fa-terminal mr-2"></i>
          Output
        </div>
      </div>

      {/* Chat Header */}
      <div className="px-4 py-3 border-b border-vscode-border">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Team Chat</h3>
          <div className="flex items-center space-x-2">
            <button className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors">
              <i className="fas fa-microphone text-xs"></i>
            </button>
            <button className="w-6 h-6 flex items-center justify-center text-vscode-text hover:text-white hover:bg-vscode-panel rounded transition-colors">
              <i className="fas fa-video text-xs"></i>
            </button>
          </div>
        </div>
      </div>

      {/* Online Users */}
      <div className="px-4 py-2 border-b border-vscode-border">
        <div className="text-xs text-vscode-text-muted mb-2">
          ONLINE ({onlineUsers.length})
        </div>
        <div className="space-y-2">
          {onlineUsers.map(onlineUser => (
            <div key={onlineUser.userId} className="flex items-center space-x-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs"
                style={{ backgroundColor: onlineUser.color }}
              >
                {onlineUser.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm flex-1">
                {onlineUser.name}
                {onlineUser.userId === user?.id && ' (you)'}
              </span>
              <div className={cn("w-2 h-2 rounded-full", getStatusColor(onlineUser.status))} />
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => (
          <div key={message.id} className="flex space-x-2">
            <div 
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
              style={{ 
                backgroundColor: onlineUsers.find(u => u.userId === message.userId)?.color || '#6B7280'
              }}
            >
              {message.user.firstName?.charAt(0) || message.user.email?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium">
                  {message.user.firstName || message.user.email}
                </span>
                <span className="text-xs text-vscode-text-muted">
                  {formatTime(message.createdAt!)}
                </span>
              </div>
              <div className="text-sm text-vscode-text break-words">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="p-4 border-t border-vscode-border">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-vscode-panel border border-vscode-border rounded px-3 py-2 text-sm text-vscode-text placeholder-vscode-text-muted focus:outline-none focus:border-vscode-blue"
          />
          <button
            onClick={handleSendMessage}
            className="px-3 py-2 bg-vscode-blue text-white rounded text-sm hover:bg-vscode-blue/80 transition-colors"
          >
            <i className="fas fa-paper-plane"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
