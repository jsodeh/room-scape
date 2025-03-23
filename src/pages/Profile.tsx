
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ProfileForm from '@/components/profile/ProfileForm';
import { TabsWrapper } from '@/components/TabsWrapper';
import ProjectsList from '@/components/projects/ProjectsList';
import { useAuth } from '@/context/AuthContext';
import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the tab structure for TypeScript
interface ProfileTab {
  id: string;
  label: string;
}

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  const tabs: ProfileTab[] = [
    { id: "account", label: "Account" },
    { id: "projects", label: "Projects" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "account":
        return <ProfileForm user={user} />;
      case "projects":
        // No props needed for ProjectsList component
        return <ProjectsList />;
      default:
        return <ProfileForm user={user} />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 py-16 px-4 container mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold">Your Profile</h1>
            
            {/* Admin Panel Link */}
            <Link to="/admin/furniture">
              <Button variant="outline" className="gap-2">
                <Shield className="h-4 w-4" />
                Resource Admin
              </Button>
            </Link>
          </div>
          
          {user ? (
            <TabsWrapper
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              renderContent={renderTabContent}
            />
          ) : (
            <div className="text-center py-10">
              <p>Please sign in to view your profile.</p>
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Profile;
