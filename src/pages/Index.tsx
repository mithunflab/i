
import { useAuth } from "../contexts/AuthContext";
import DeveloperDashboard from "../components/admin/DeveloperDashboard";
import UserDashboard from "../components/user/UserDashboard";
import LoginForm from "../components/LoginForm";

const Index = () => {
  const { user, profile } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  // Check user role - if admin/developer show developer dashboard, otherwise show user dashboard
  return profile?.role === 'admin' ? <DeveloperDashboard /> : <UserDashboard />;
};

export default Index;
