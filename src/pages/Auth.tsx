
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TabsWrapper } from '@/components/TabsWrapper';
import { Button } from '@/components/ui/button';
import SignInForm from '@/components/auth/SignInForm';
import SignUpForm from '@/components/auth/SignUpForm';

const Auth = () => {
  const [activeTab, setActiveTab] = useState<string>('signin');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-md">
        <TabsWrapper value={activeTab} onValueChange={setActiveTab}>
          <CardHeader>
            <CardTitle className="text-center text-2xl font-bold">RoomStage</CardTitle>
            <CardDescription className="text-center">
              Virtual room staging for real estate
            </CardDescription>
            <TabsList className="grid w-full grid-cols-2 mt-4">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
          </CardHeader>
          
          <CardContent>
            <TabsContent value="signin" className="mt-0">
              <SignInForm />
            </TabsContent>
            
            <TabsContent value="signup" className="mt-0">
              <SignUpForm onSuccess={() => setActiveTab('signin')} />
            </TabsContent>
          </CardContent>
          
          <CardFooter className="flex justify-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our{' '}
              <Button variant="link" className="h-auto p-0">
                Terms of Service
              </Button>{' '}
              and{' '}
              <Button variant="link" className="h-auto p-0">
                Privacy Policy
              </Button>
            </p>
          </CardFooter>
        </TabsWrapper>
      </Card>
    </div>
  );
};

export default Auth;
