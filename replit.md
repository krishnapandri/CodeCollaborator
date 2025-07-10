# CodeCollab - Collaborative Coding Environment

## Overview

CodeCollab is a full-stack collaborative coding environment built with a modern tech stack. It provides real-time code editing, file management, chat functionality, and project collaboration features similar to Replit or VS Code Live Share.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **State Management**: React Query for server state, local React state for UI
- **Routing**: Wouter for client-side routing
- **Code Editor**: Monaco Editor (VS Code's editor)
- **Build Tool**: Vite for development and production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **WebSocket**: Native WebSocket for real-time collaboration
- **Authentication**: Replit OAuth integration with session management
- **Database**: PostgreSQL with Drizzle ORM
- **Session Storage**: PostgreSQL-based session store

## Key Components

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Connection**: Neon serverless database with connection pooling
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for schema migrations

### Authentication System
- **Provider**: Replit OAuth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: HTTP-only cookies with secure flags
- **Middleware**: Route-level authentication protection

### Real-time Collaboration
- **WebSocket Server**: Native WebSocket implementation
- **Features**: File changes, cursor positions, user presence, chat messages
- **Message Types**: Structured message system for different collaboration events

### Code Editor Integration
- **Editor**: Monaco Editor with TypeScript support
- **Features**: Syntax highlighting, IntelliSense, multi-language support
- **Collaboration**: Real-time cursor tracking and change synchronization

### Project Management
- **Structure**: Projects contain multiple files with hierarchical organization
- **Permissions**: Owner-based access control with collaboration features
- **File Types**: Support for multiple programming languages

## Data Flow

### Authentication Flow
1. User initiates login through Replit OAuth
2. OAuth callback validates and creates/updates user session
3. Session stored in PostgreSQL with automatic expiration
4. Client receives authentication status via HTTP-only cookies

### Real-time Collaboration Flow
1. WebSocket connection established after authentication
2. Users join project rooms based on project ID
3. File changes broadcast to all connected users in the same project
4. Cursor positions and user presence updated in real-time
5. Chat messages distributed to project participants

### File Management Flow
1. CRUD operations on files through REST API
2. File content stored in database with metadata
3. Changes tracked and synchronized across connected clients
4. Version history maintained through database updates

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Connection**: Environment variable `DATABASE_URL` required

### Authentication
- **Replit OAuth**: Integration with Replit's identity provider
- **Environment Variables**: `REPL_ID`, `ISSUER_URL`, `SESSION_SECRET`

### Code Execution
- **Planned**: Docker-based sandboxing for safe code execution
- **Current**: Terminal panel with execution API endpoint structure

### UI Components
- **Radix UI**: Accessible component primitives
- **shadcn/ui**: Pre-built component library
- **Tailwind CSS**: Utility-first styling framework

## Deployment Strategy

### Development
- **Server**: Node.js development server with hot reload
- **Client**: Vite dev server with HMR
- **Database**: Neon development database

### Production
- **Build Process**: 
  - Client built with Vite to `dist/public`
  - Server bundled with esbuild to `dist/index.js`
- **Deployment**: Single Node.js process serving both client and API
- **Environment**: Production environment variables required

### Key Configuration
- **Database**: Automatic schema push with `npm run db:push`
- **Sessions**: PostgreSQL-based session storage
- **Static Assets**: Served from `dist/public` in production
- **WebSocket**: Integrated with HTTP server for real-time features

The application is designed to be deployed on platforms like Replit, with integrated authentication and database provisioning. The architecture supports both development and production environments with appropriate build processes and environment-specific configurations.