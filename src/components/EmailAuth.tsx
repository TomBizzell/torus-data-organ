
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";

const EmailAuth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    let timer: number;
    if (cooldownTime > 0) {
      timer = window.setInterval(() => {
        setCooldownTime((time) => Math.max(0, time - 1));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [cooldownTime]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldownTime > 0) {
      toast({
        title: "Please wait",
        description: `You can try again in ${cooldownTime} seconds.`,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });

        if (signUpError) throw signUpError;

        toast({
          title: "Sign up successful",
          description: "Please check your email to verify your account.",
        });
      } else {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        toast({
          title: "Login successful",
          description: "You have been successfully logged in.",
        });

        navigate('/');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      
      // Handle rate limiting error specifically
      if (error.message?.includes('over_email_send_rate_limit')) {
        const seconds = parseInt(error.message.match(/after (\d+) seconds/)?.[1] || '40');
        setCooldownTime(seconds);
        toast({
          title: "Too Many Attempts",
          description: `Please wait ${seconds} seconds before trying again.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Authentication Failed",
          description: error.message || "An error occurred during authentication. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleAuth} className="space-y-4">
        <div className="space-y-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <Button
          type="submit"
          className="w-full"
          disabled={loading || cooldownTime > 0}
        >
          {loading ? "Processing..." : cooldownTime > 0 
            ? `Wait ${cooldownTime}s` 
            : (isSignUp ? "Sign Up" : "Login")}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setCooldownTime(0); // Reset cooldown when switching modes
          }}
          className="text-sm"
        >
          {isSignUp
            ? "Already have an account? Login"
            : "Don't have an account? Sign Up"}
        </Button>
      </div>
    </div>
  );
};

export default EmailAuth;
