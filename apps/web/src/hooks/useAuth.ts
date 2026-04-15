import { useMutation, useQuery } from '@tanstack/react-query';
import { authService } from '@/services';
import { useAuthStore } from '@/store';
import type { LoginRequest, RegisterRequest } from '@/types';

export function useAuth() {
  const { user, isAuthenticated, setUser, setLoading, logout: storeLogout } = useAuthStore();

  const { isLoading: isFetchingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    enabled: authService.isAuthenticated() && !user,
    retry: false,
    meta: {
      onSuccess: (
        data: ReturnType<typeof authService.getMe> extends Promise<infer T> ? T : never
      ) => {
        setUser(data as Parameters<typeof setUser>[0]);
      },
    },
  });

  const loginMutation = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data) => {
      setUser(data.user);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
    onSuccess: (data) => {
      setUser(data.user);
    },
  });

  const logout = () => {
    authService.logout();
    storeLogout();
  };

  return {
    user,
    isAuthenticated,
    isLoading: isFetchingUser,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    logout,
    setLoading,
  };
}
