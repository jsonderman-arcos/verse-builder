import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigation } from "@/components/ui/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Shield, Users, Ban, RotateCcw, KeyRound, Search, Calendar, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface User {
  id: string;
  email: string;
  display_name: string;
  created_at: string;
  status: 'active' | 'suspended' | 'banned' | 'pending_verification';
  last_login_at: string | null;
  login_count: number;
  suspended_at: string | null;
  suspended_by: string | null;
  suspension_reason: string | null;
  suspension_expires_at: string | null;
}

interface AdminAction {
  id: string;
  admin_email: string;
  target_email: string;
  action: string;
  details: any;
  created_at: string;
}

const Admin = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [suspensionReason, setSuspensionReason] = useState("");
  const [suspensionExpiry, setSuspensionExpiry] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchAuditLog();
    }
  }, [isAdmin]);

  const checkAdminStatus = async () => {
    if (!user) return;

    try {
      // Use the new security definer function to avoid RLS recursion
      const { data, error } = await supabase.rpc('check_user_is_admin', {
        user_id: user.id
      });

      if (error) {
        console.error('Error checking admin status:', error);
        setIsAdmin(false);
        return;
      }

      setIsAdmin(data === true);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsAdmin(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          *,
          user_account_status (
            status,
            last_login_at,
            login_count,
            suspended_at,
            suspended_by,
            suspension_reason,
            suspension_expires_at
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers = data.map(user => ({
        id: user.user_id,
        email: user.email,
        display_name: user.display_name,
        created_at: user.created_at,
        status: user.user_account_status?.[0]?.status || 'active',
        last_login_at: user.user_account_status?.[0]?.last_login_at,
        login_count: user.user_account_status?.[0]?.login_count || 0,
        suspended_at: user.user_account_status?.[0]?.suspended_at,
        suspended_by: user.user_account_status?.[0]?.suspended_by,
        suspension_reason: user.user_account_status?.[0]?.suspension_reason,
        suspension_expires_at: user.user_account_status?.[0]?.suspension_expires_at,
      }));

      setUsers(formattedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLog = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_audit_log')
        .select(`
          *,
          admin:admin_user_id (email),
          target:target_user_id (email)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formattedLog = data.map(log => ({
        id: log.id,
        admin_email: log.admin?.email || 'Unknown',
        target_email: log.target?.email || 'System',
        action: log.action,
        details: log.details,
        created_at: log.created_at,
      }));

      setAuditLog(formattedLog);
    } catch (error) {
      console.error('Error fetching audit log:', error);
    }
  };

  const suspendUser = async () => {
    if (!selectedUser) return;

    try {
      const expiryDate = suspensionExpiry ? new Date(suspensionExpiry).toISOString() : null;
      
      const { error } = await supabase.rpc('suspend_user_account', {
        target_user_id: selectedUser.id,
        reason: suspensionReason || null,
        expires_at: expiryDate
      });

      if (error) throw error;

      toast.success('User suspended successfully');
      fetchUsers();
      fetchAuditLog();
      setSelectedUser(null);
      setSuspensionReason("");
      setSuspensionExpiry("");
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error('Failed to suspend user');
    }
  };

  const reactivateUser = async (userId: string) => {
    try {
      const { error } = await supabase.rpc('reactivate_user_account', {
        target_user_id: userId
      });

      if (error) throw error;

      toast.success('User reactivated successfully');
      fetchUsers();
      fetchAuditLog();
    } catch (error) {
      console.error('Error reactivating user:', error);
      toast.error('Failed to reactivate user');
    }
  };

  const forcePasswordReset = async (userId: string, email: string) => {
    try {
      // First log the admin action
      const { error: logError } = await supabase.rpc('admin_force_password_reset', {
        target_user_id: userId
      });

      if (logError) throw logError;

      // Then send the actual password reset email via Supabase Auth
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (resetError) throw resetError;

      toast.success('Password reset email sent successfully');
      fetchAuditLog();
    } catch (error) {
      console.error('Error forcing password reset:', error);
      toast.error('Failed to send password reset email');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "default",
      suspended: "destructive",
      banned: "destructive",
      pending_verification: "secondary"
    } as const;

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  if (!user) {
    return <div>Please log in to access the admin area.</div>;
  }

  if (!isAdmin) {
    return (
      <>
        <Navigation />
        <div className="pt-20 min-h-screen bg-gradient-peaceful flex items-center justify-center">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Access Denied</span>
              </CardTitle>
              <CardDescription>
                You don't have admin privileges to access this area.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <main className="pt-20 min-h-screen bg-gradient-peaceful">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-muted-foreground">Manage users and monitor system activity</p>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{users.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Users</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.status === 'active').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suspended</CardTitle>
                <Ban className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.status === 'suspended').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Recent Logins</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {users.filter(u => u.last_login_at && 
                    new Date(u.last_login_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                  ).length}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Management */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, view login history, and perform administrative actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2 mb-4">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users by email or name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Last Login</TableHead>
                      <TableHead>Login Count</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          Loading users...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          No users found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(user.status)}</TableCell>
                          <TableCell>
                            {user.last_login_at ? (
                              <div className="text-sm">
                                {format(new Date(user.last_login_at), 'MMM d, yyyy')}
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(user.last_login_at), 'h:mm a')}
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Never</span>
                            )}
                          </TableCell>
                          <TableCell>{user.login_count}</TableCell>
                          <TableCell>
                            {format(new Date(user.created_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              {user.status === 'active' ? (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setSelectedUser(user)}
                                    >
                                      <Ban className="w-3 h-3 mr-1" />
                                      Suspend
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Suspend User Account</DialogTitle>
                                      <DialogDescription>
                                        Suspend {user.email}'s account. They will not be able to log in until reactivated.
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4">
                                      <div>
                                        <Label htmlFor="reason">Reason (optional)</Label>
                                        <Textarea
                                          id="reason"
                                          placeholder="Enter reason for suspension..."
                                          value={suspensionReason}
                                          onChange={(e) => setSuspensionReason(e.target.value)}
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor="expiry">Expiry Date (optional)</Label>
                                        <Input
                                          id="expiry"
                                          type="datetime-local"
                                          value={suspensionExpiry}
                                          onChange={(e) => setSuspensionExpiry(e.target.value)}
                                        />
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                        Cancel
                                      </Button>
                                      <Button variant="destructive" onClick={suspendUser}>
                                        Suspend Account
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              ) : (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => reactivateUser(user.id)}
                                >
                                  <RotateCcw className="w-3 h-3 mr-1" />
                                  Reactivate
                                </Button>
                              )}

                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <KeyRound className="w-3 h-3 mr-1" />
                                    Reset Password
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Force Password Reset</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will send a password reset email to {user.email}. 
                                      The user will be required to create a new password.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => forcePasswordReset(user.id, user.email)}
                                    >
                                      Send Reset Email
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log */}
          <Card>
            <CardHeader>
              <CardTitle>Admin Activity Log</CardTitle>
              <CardDescription>
                Recent administrative actions and system events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target User</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8">
                          No audit log entries found
                        </TableCell>
                      </TableRow>
                    ) : (
                      auditLog.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(log.created_at), 'MMM d, yyyy')}
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), 'h:mm a')}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{log.admin_email}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {log.action.replace('_', ' ').toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">{log.target_email}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {log.details.reason && (
                              <div>Reason: {log.details.reason}</div>
                            )}
                            {log.details.expires_at && (
                              <div>Expires: {format(new Date(log.details.expires_at), 'MMM d, yyyy')}</div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
};

export default Admin;