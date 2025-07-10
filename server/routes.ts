import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertProjectSchema, insertProjectFileSchema, insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";

interface ExtendedWebSocket extends WebSocket {
  userId?: string;
  projectId?: number;
}

interface CollaborationMessage {
  type: "file_change" | "cursor_position" | "user_joined" | "user_left" | "chat_message";
  data: any;
  userId: string;
  projectId: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Project routes
  app.post('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectData = insertProjectSchema.parse({
        ...req.body,
        ownerId: userId,
      });
      
      const project = await storage.createProject(projectData);
      
      // Create initial files
      const initialFiles = [
        {
          projectId: project.id,
          name: "index.html",
          path: "index.html",
          content: "<!DOCTYPE html>\n<html>\n<head>\n  <title>My Project</title>\n</head>\n<body>\n  <h1>Hello World!</h1>\n</body>\n</html>",
          language: "html"
        },
        {
          projectId: project.id,
          name: "script.js",
          path: "script.js",
          content: "console.log('Hello from JavaScript!');",
          language: "javascript"
        },
        {
          projectId: project.id,
          name: "style.css",
          path: "style.css",
          content: "body {\n  font-family: Arial, sans-serif;\n  margin: 20px;\n}",
          language: "css"
        }
      ];
      
      for (const file of initialFiles) {
        await storage.createProjectFile(file);
      }
      
      res.json(project);
    } catch (error) {
      console.error("Error creating project:", error);
      res.status(500).json({ message: "Failed to create project" });
    }
  });

  app.get('/api/projects', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projects = await storage.getUserProjects(userId);
      res.json(projects);
    } catch (error) {
      console.error("Error fetching projects:", error);
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get('/api/projects/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if user has access
      const isOwner = project.ownerId === userId;
      const isCollaborator = await storage.isUserCollaborator(projectId, userId);
      
      if (!isOwner && !isCollaborator && !project.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const projectWithFiles = await storage.getProjectWithFiles(projectId);
      res.json(projectWithFiles);
    } catch (error) {
      console.error("Error fetching project:", error);
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // File routes
  app.post('/api/projects/:id/files', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const isOwner = project.ownerId === userId;
      const isCollaborator = await storage.isUserCollaborator(projectId, userId);
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const fileData = insertProjectFileSchema.parse({
        ...req.body,
        projectId,
      });
      
      const file = await storage.createProjectFile(fileData);
      res.json(file);
    } catch (error) {
      console.error("Error creating file:", error);
      res.status(500).json({ message: "Failed to create file" });
    }
  });

  app.put('/api/files/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const fileId = parseInt(req.params.id);
      
      const file = await storage.getProjectFile(fileId);
      if (!file) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const project = await storage.getProject(file.projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const isOwner = project.ownerId === userId;
      const isCollaborator = await storage.isUserCollaborator(file.projectId, userId);
      
      if (!isOwner && !isCollaborator) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedFile = await storage.updateProjectFile(fileId, req.body);
      res.json(updatedFile);
    } catch (error) {
      console.error("Error updating file:", error);
      res.status(500).json({ message: "Failed to update file" });
    }
  });

  // Chat routes
  app.get('/api/projects/:id/messages', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const projectId = parseInt(req.params.id);
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const isOwner = project.ownerId === userId;
      const isCollaborator = await storage.isUserCollaborator(projectId, userId);
      
      if (!isOwner && !isCollaborator && !project.isPublic) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const messages = await storage.getProjectChatMessages(projectId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Code execution route
  app.post('/api/execute', isAuthenticated, async (req: any, res) => {
    try {
      const { code, language } = req.body;
      
      if (language === 'javascript') {
        // Simple JavaScript execution (be careful with this in production)
        try {
          const result = eval(code);
          res.json({ output: String(result), error: null });
        } catch (error) {
          res.json({ output: null, error: (error as Error).message });
        }
      } else if (language === 'python') {
        // For Python, you would need to use a proper sandbox or external service
        res.json({ output: null, error: "Python execution not implemented yet" });
      } else {
        res.json({ output: null, error: "Language not supported" });
      }
    } catch (error) {
      console.error("Error executing code:", error);
      res.status(500).json({ message: "Failed to execute code" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  wss.on('connection', (ws: ExtendedWebSocket) => {
    console.log('WebSocket client connected');
    
    ws.on('message', async (message) => {
      try {
        const data: CollaborationMessage = JSON.parse(message.toString());
        
        // Store user and project info on the WebSocket
        ws.userId = data.userId;
        ws.projectId = data.projectId;
        
        // Handle different message types
        switch (data.type) {
          case 'file_change':
            // Broadcast file changes to all clients in the same project
            broadcast(data.projectId, data, ws);
            break;
            
          case 'cursor_position':
            // Broadcast cursor position to all clients in the same project
            broadcast(data.projectId, data, ws);
            break;
            
          case 'user_joined':
            // Notify others that a user joined
            broadcast(data.projectId, data, ws);
            break;
            
          case 'user_left':
            // Notify others that a user left
            broadcast(data.projectId, data, ws);
            break;
            
          case 'chat_message':
            // Save chat message to database and broadcast
            try {
              const messageData = insertChatMessageSchema.parse({
                projectId: data.projectId,
                userId: data.userId,
                content: data.data.content,
              });
              
              const chatMessage = await storage.createChatMessage(messageData);
              const user = await storage.getUser(data.userId);
              
              const broadcastData = {
                ...data,
                data: {
                  ...chatMessage,
                  user,
                },
              };
              
              broadcast(data.projectId, broadcastData, null); // Broadcast to all including sender
            } catch (error) {
              console.error("Error saving chat message:", error);
            }
            break;
        }
      } catch (error) {
        console.error("Error handling WebSocket message:", error);
      }
    });
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      
      // Notify others that user left
      if (ws.userId && ws.projectId) {
        broadcast(ws.projectId, {
          type: 'user_left',
          userId: ws.userId,
          projectId: ws.projectId,
          data: { userId: ws.userId },
        }, ws);
      }
    });
  });
  
  function broadcast(projectId: number, message: CollaborationMessage, sender: ExtendedWebSocket | null) {
    wss.clients.forEach((client: ExtendedWebSocket) => {
      if (client.readyState === WebSocket.OPEN && 
          client.projectId === projectId && 
          client !== sender) {
        client.send(JSON.stringify(message));
      }
    });
  }

  return httpServer;
}
