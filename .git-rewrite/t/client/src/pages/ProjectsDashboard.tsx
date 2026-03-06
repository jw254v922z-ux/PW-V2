import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, Copy, Download } from 'lucide-react';

export default function ProjectsDashboard() {
  const [, setLocation] = useLocation();
  const [newProjectName, setNewProjectName] = useState('');
  const [duplicateProjectName, setDuplicateProjectName] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery();
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: (data) => {
      toast.success('Project created successfully!');
      setNewProjectName('');
      refetch();
      // Load the new project in the calculator
      setLocation(`/?projectId=${data.projectId}`);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create project');
    },
  });

  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success('Project deleted successfully');
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete project');
    },
  });

  const duplicateMutation = trpc.projects.duplicate.useMutation({
    onSuccess: (data) => {
      toast.success('Project duplicated successfully!');
      setDuplicateProjectName('');
      setSelectedProjectId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to duplicate project');
    },
  });

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) {
      toast.error('Please enter a project name');
      return;
    }

    // Create a new project with current calculator state
    // This would need to be integrated with the calculator state
    await createMutation.mutateAsync({
      name: newProjectName,
      description: null,
      inputs: {},
      results: {},
    });
  };

  const handleDeleteProject = async (projectId: number) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
      await deleteMutation.mutateAsync({ projectId });
    }
  };

  const handleDuplicateProject = async (projectId: number) => {
    if (!duplicateProjectName.trim()) {
      toast.error('Please enter a name for the duplicated project');
      return;
    }
    await duplicateMutation.mutateAsync({
      projectId,
      newName: duplicateProjectName,
    });
  };

  const handleLoadProject = (projectId: number) => {
    setLocation(`/?projectId=${projectId}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold">My Projects</h1>
            <p className="text-muted-foreground mt-2">Manage and organize your solar projects</p>
          </div>
          <Button onClick={() => setLocation('/')}>Back to Calculator</Button>
        </div>

        {/* Create New Project */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Create New Project</CardTitle>
            <CardDescription>Start a new solar project calculation</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateProject} className="flex gap-2">
              <Input
                placeholder="Project name (e.g., North Ridge Solar Farm)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                disabled={createMutation.isPending}
              />
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'Creating...' : 'Create Project'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Projects List */}
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Projects</h2>
          {isLoading ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Loading projects...</p>
            </div>
          ) : !projects || projects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">No projects yet. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {project.description || 'No description'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      <p>Created {project.createdAt ? formatDistanceToNow(new Date(project.createdAt), { addSuffix: true }) : 'N/A'}</p>
                      <p>Updated {project.updatedAt ? formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true }) : 'N/A'}</p>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleLoadProject(project.id)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Load
                      </Button>

                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedProjectId(project.id);
                              setDuplicateProjectName(`${project.name} (Copy)`);
                            }}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Duplicate Project</DialogTitle>
                            <DialogDescription>
                              Enter a name for the duplicated project
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <Input
                              placeholder="New project name"
                              value={duplicateProjectName}
                              onChange={(e) => setDuplicateProjectName(e.target.value)}
                            />
                            <Button
                              onClick={() => handleDuplicateProject(project.id)}
                              disabled={duplicateMutation.isPending}
                              className="w-full"
                            >
                              {duplicateMutation.isPending ? 'Duplicating...' : 'Duplicate'}
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>

                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteProject(project.id)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
