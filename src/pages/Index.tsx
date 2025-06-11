
import { useAuth } from "../contexts/AuthContext";
import AdminDashboard from "../components/admin/AdminDashboard";
import UserDashboard from "../components/user/UserDashboard";
import LoginForm from "../components/LoginForm";

const Index = () => {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return user.role === 'admin' ? <AdminDashboard /> : <UserDashboard />;
};

export default Index;
