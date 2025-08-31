import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const ThemeToggle = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { profile } = useAuth();

  useEffect(() => {
    // Load theme from local storage and database
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
    
    if (profile?.id) {
      loadUserPreference();
    }
  }, [profile?.id]);

  const loadUserPreference = async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('theme')
        .eq('user_id', profile?.id)
        .single();

      if (data && !error) {
        setTheme(data.theme as 'light' | 'dark');
        applyTheme(data.theme as 'light' | 'dark');
        localStorage.setItem('theme', data.theme);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    }
  };

  const applyTheme = (newTheme: 'light' | 'dark') => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const saveUserPreference = async (newTheme: 'light' | 'dark') => {
    if (!profile?.id) return;

    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: profile.id,
          theme: newTheme
        });

      if (error) {
        console.error('Error saving theme preference:', error);
      }
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    saveUserPreference(newTheme);
  };

  return (
    <div className="flex items-center space-x-2">
      <Button
        variant={theme === 'light' ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleTheme('light')}
        className="p-2"
      >
        <Sun className="h-4 w-4" />
      </Button>
      <Button
        variant={theme === 'dark' ? 'default' : 'outline'}
        size="sm"
        onClick={() => toggleTheme('dark')}
        className="p-2"
      >
        <Moon className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default ThemeToggle;
