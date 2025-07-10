import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-vscode-bg via-vscode-sidebar to-vscode-panel flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <div className="w-16 h-16 bg-vscode-blue rounded-lg flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
            CC
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">CodeCollab</h1>
          <p className="text-xl text-vscode-text-muted mb-8">
            Collaborative Coding Environment for Real-time Development
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-vscode-sidebar border-vscode-border">
            <CardHeader>
              <CardTitle className="text-vscode-text flex items-center">
                <i className="fas fa-users text-vscode-blue mr-2"></i>
                Real-time Collaboration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-vscode-text-muted">
                Code together with your team in real-time. See cursor positions, changes, and chat with collaborators.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-vscode-sidebar border-vscode-border">
            <CardHeader>
              <CardTitle className="text-vscode-text flex items-center">
                <i className="fas fa-code text-vscode-blue mr-2"></i>
                Monaco Editor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-vscode-text-muted">
                Professional code editing experience with syntax highlighting, IntelliSense, and VS Code features.
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-vscode-sidebar border-vscode-border">
            <CardHeader>
              <CardTitle className="text-vscode-text flex items-center">
                <i className="fas fa-play text-vscode-blue mr-2"></i>
                Code Execution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-vscode-text-muted">
                Run your code instantly with support for JavaScript, Python, and other popular languages.
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={() => window.location.href = '/api/login'}
            className="bg-vscode-blue hover:bg-vscode-blue/80 text-white px-8 py-3 text-lg"
          >
            Get Started with CodeCollab
          </Button>
          
          <div className="text-sm text-vscode-text-muted">
            Sign in with your Replit account to start collaborating
          </div>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-8 text-left">
          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Key Features</h3>
            <ul className="space-y-2 text-vscode-text-muted">
              <li className="flex items-center">
                <i className="fas fa-check text-green-400 mr-2"></i>
                Real-time collaborative editing
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-400 mr-2"></i>
                Multi-language support
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-400 mr-2"></i>
                Integrated chat system
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-400 mr-2"></i>
                Project management
              </li>
              <li className="flex items-center">
                <i className="fas fa-check text-green-400 mr-2"></i>
                Code execution sandbox
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-3">Perfect for</h3>
            <ul className="space-y-2 text-vscode-text-muted">
              <li className="flex items-center">
                <i className="fas fa-graduation-cap text-vscode-blue mr-2"></i>
                Learning and education
              </li>
              <li className="flex items-center">
                <i className="fas fa-handshake text-vscode-blue mr-2"></i>
                Pair programming
              </li>
              <li className="flex items-center">
                <i className="fas fa-users text-vscode-blue mr-2"></i>
                Team collaboration
              </li>
              <li className="flex items-center">
                <i className="fas fa-clipboard-check text-vscode-blue mr-2"></i>
                Code interviews
              </li>
              <li className="flex items-center">
                <i className="fas fa-rocket text-vscode-blue mr-2"></i>
                Rapid prototyping
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
