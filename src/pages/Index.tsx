
import { useAuth } from "../contexts/AuthContext";
import DeveloperDashboard from "../components/admin/DeveloperDashboard";
import UserDashboard from "../components/user/UserDashboard";
import LoginForm from "../components/LoginForm";

const Index = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  // Show dashboard based on user role
  return profile?.role === 'admin' ? <DeveloperDashboard /> : <UserDashboard />;
};

export default Index;
