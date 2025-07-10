import {
  users,
  projects,
  projectFiles,
  projectCollaborators,
  chatMessages,
  type User,
  type UpsertUser,
  type Project,
  type InsertProject,
  type ProjectFile,
  type InsertProjectFile,
  type ProjectCollaborator,
  type InsertProjectCollaborator,
  type ChatMessage,
  type InsertChatMessage,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";

export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Project operations
  createProject(project: InsertProject): Promise<Project>;
  getProject(id: number): Promise<Project | undefined>;
  getUserProjects(userId: string): Promise<Project[]>;
  getProjectWithFiles(id: number): Promise<(Project & { files: ProjectFile[] }) | undefined>;
  updateProject(id: number, updates: Partial<InsertProject>): Promise<Project>;
  deleteProject(id: number): Promise<void>;
  
  // Project file operations
  createProjectFile(file: InsertProjectFile): Promise<ProjectFile>;
  getProjectFile(id: number): Promise<ProjectFile | undefined>;
  getProjectFiles(projectId: number): Promise<ProjectFile[]>;
  updateProjectFile(id: number, updates: Partial<InsertProjectFile>): Promise<ProjectFile>;
  deleteProjectFile(id: number): Promise<void>;
  
  // Collaboration operations
  addCollaborator(collaboration: InsertProjectCollaborator): Promise<ProjectCollaborator>;
  getProjectCollaborators(projectId: number): Promise<(ProjectCollaborator & { user: User })[]>;
  removeCollaborator(projectId: number, userId: string): Promise<void>;
  isUserCollaborator(projectId: number, userId: string): Promise<boolean>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getProjectChatMessages(projectId: number): Promise<(ChatMessage & { user: User })[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Project operations
  async createProject(project: InsertProject): Promise<Project> {
    const [newProject] = await db
      .insert(projects)
      .values(project)
      .returning();
    return newProject;
  }

  async getProject(id: number): Promise<Project | undefined> {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, id));
    return project;
  }

  async getUserProjects(userId: string): Promise<Project[]> {
    return await db
      .select()
      .from(projects)
      .where(eq(projects.ownerId, userId))
      .orderBy(desc(projects.updatedAt));
  }

  async getProjectWithFiles(id: number): Promise<(Project & { files: ProjectFile[] }) | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const files = await this.getProjectFiles(id);
    return { ...project, files };
  }

  async updateProject(id: number, updates: Partial<InsertProject>): Promise<Project> {
    const [updatedProject] = await db
      .update(projects)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projects.id, id))
      .returning();
    return updatedProject;
  }

  async deleteProject(id: number): Promise<void> {
    await db.delete(projects).where(eq(projects.id, id));
  }

  // Project file operations
  async createProjectFile(file: InsertProjectFile): Promise<ProjectFile> {
    const [newFile] = await db
      .insert(projectFiles)
      .values(file)
      .returning();
    return newFile;
  }

  async getProjectFile(id: number): Promise<ProjectFile | undefined> {
    const [file] = await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.id, id));
    return file;
  }

  async getProjectFiles(projectId: number): Promise<ProjectFile[]> {
    return await db
      .select()
      .from(projectFiles)
      .where(eq(projectFiles.projectId, projectId))
      .orderBy(projectFiles.path);
  }

  async updateProjectFile(id: number, updates: Partial<InsertProjectFile>): Promise<ProjectFile> {
    const [updatedFile] = await db
      .update(projectFiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(projectFiles.id, id))
      .returning();
    return updatedFile;
  }

  async deleteProjectFile(id: number): Promise<void> {
    await db.delete(projectFiles).where(eq(projectFiles.id, id));
  }

  // Collaboration operations
  async addCollaborator(collaboration: InsertProjectCollaborator): Promise<ProjectCollaborator> {
    const [newCollaborator] = await db
      .insert(projectCollaborators)
      .values(collaboration)
      .returning();
    return newCollaborator;
  }

  async getProjectCollaborators(projectId: number): Promise<(ProjectCollaborator & { user: User })[]> {
    return await db
      .select()
      .from(projectCollaborators)
      .leftJoin(users, eq(projectCollaborators.userId, users.id))
      .where(eq(projectCollaborators.projectId, projectId))
      .then(results => 
        results.map(result => ({
          ...result.project_collaborators,
          user: result.users!
        }))
      );
  }

  async removeCollaborator(projectId: number, userId: string): Promise<void> {
    await db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
  }

  async isUserCollaborator(projectId: number, userId: string): Promise<boolean> {
    const [collaboration] = await db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return !!collaboration;
  }

  // Chat operations
  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [newMessage] = await db
      .insert(chatMessages)
      .values(message)
      .returning();
    return newMessage;
  }

  async getProjectChatMessages(projectId: number): Promise<(ChatMessage & { user: User })[]> {
    return await db
      .select()
      .from(chatMessages)
      .leftJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.projectId, projectId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100)
      .then(results => 
        results.map(result => ({
          ...result.chat_messages,
          user: result.users!
        }))
      );
  }
}

export const storage = new DatabaseStorage();
