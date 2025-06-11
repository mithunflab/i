
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, Edit, Trash2, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'inactive';
  joinDate: string;
  projects: number;
}

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'user' as 'user' | 'admin',
    status: 'active' as 'active' | 'inactive'
  });
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      console.log('Loading users from profiles table...');
      
      // Check if user is authenticated
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser) {
        console.error('User not authenticated');
        toast({
          title: "Error",
          description: "You must be logged in to view users",
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading users:', error);
        toast({
          title: "Error",
          description: `Failed to load users: ${error.message}`,
          variant: "destructive"
        });
        setUsers([]);
      } else {
        console.log('Users loaded successfully:', data?.length || 0, 'users');
        const formattedUsers: User[] = (data || []).map(profile => ({
          id: profile.id,
          name: profile.full_name || 'Unknown User',
          email: profile.email || 'No email',
          role: (profile.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin',
          status: 'active' as 'active' | 'inactive',
          joinDate: new Date(profile.created_at || '').toLocaleDateString(),
          projects: Math.floor(Math.random() * 10)
        }));
        setUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Exception in loadUsers:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive"
      });
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async () => {
    if (!newUser.name || !newUser.email) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsAddingUser(true);
    try {
      console.log('Creating new user:', newUser.email);
      
      const { data, error } = await supabase.auth.signUp({
        email: newUser.email,
        password: 'TempPassword123!',
        options: {
          data: {
            full_name: newUser.name,
            role: newUser.role
          }
        }
      });

      if (error) {
        console.error('Error creating user:', error);
        toast({
          title: "Error",
          description: `Failed to create user: ${error.message}`,
          variant: "destructive"
        });
        return;
      }

      console.log('User created successfully:', data.user?.email);
      toast({
        title: "Success",
        description: "User created successfully",
      });

      setNewUser({ name: '', email: '', role: 'user', status: 'active' });
      await loadUsers();
    } catch (error) {
      console.error('Exception in addUser:', error);
      toast({
        title: "Error",
        description: "Failed to create user",
        variant: "destructive"
      });
    } finally {
      setIsAddingUser(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Card className="bg-white/5 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-white">Loading users...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/5 border-gray-800">
      <CardHeader>
        <CardTitle className="text-white">User Management</CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-gray-800 border-gray-600 text-white"
            />
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 flex items-center gap-2">
                <Plus size={16} />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-gray-900 border-gray-700">
              <DialogHeader>
                <DialogTitle className="text-white">Add New User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-white">Full Name</Label>
                  <Input
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter full name"
                  />
                </div>
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="bg-gray-800 border-gray-600 text-white"
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label className="text-white">Role</Label>
                  <Select value={newUser.role} onValueChange={(value: 'user' | 'admin') => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={addUser} 
                  disabled={isAddingUser}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {isAddingUser ? 'Adding...' : 'Add User'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              {users.length === 0 ? 'No users found in the system' : 'No users match your search'}
            </div>
          ) : (
            filteredUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-4 rounded-lg border border-gray-700 bg-gray-800/30">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-600/20 flex items-center justify-center">
                    <span className="text-white font-semibold">{user.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{user.name}</h3>
                    <p className="text-sm text-gray-400">{user.email}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role}
                  </Badge>
                  <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                    {user.status}
                  </Badge>
                  <span className="text-sm text-gray-400">
                    {user.projects} projects
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-white/10">
                      <Edit size={14} />
                    </Button>
                    <Button size="sm" variant="outline" className="border-gray-600 text-white hover:bg-white/10">
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default UserManagement;
