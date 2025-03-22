
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const ResetPasswordForm = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const { resetPassword } = useAuth();

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await resetPassword(email);
      setSubmitted(true);
    } catch (error) {
      // Error is handled in the resetPassword function
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {submitted ? (
        <div className="text-center">
          <p className="text-green-600 mb-4">
            If an account exists with that email, we've sent you a password reset link.
          </p>
          <p className="text-gray-500">
            Please check your email inbox and follow the instructions.
          </p>
        </div>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Sending instructions...' : 'Send reset instructions'}
          </Button>
        </form>
      )}
    </>
  );
};

export default ResetPasswordForm;
