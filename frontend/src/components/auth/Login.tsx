import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button, Card, Label, TextInput } from 'flowbite-react';
import { HiEye, HiEyeOff } from 'react-icons/hi';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // needed for HttpOnly cookie to be set by browser
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        const ALLOWED_ROLES = ['ADMIN', 'CREWING'];
        if (!ALLOWED_ROLES.includes(data.user.role)) {
          toast.error(
            `Akses ditolak. Role '${data.user.role}' tidak diizinkan.`
          );
          return;
        }
        login(data.user);
        toast.success('Login berhasil');
        navigate('/');
      } else {
        toast.error(data.message || 'Login gagal');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('Network error. Silahkan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="w-full max-w-md">
        <div className="mb-4 text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.ico" alt="SPIL Logo" className="h-16 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Ship Personnel Management
          </h1>
          <p className="text-gray-600">Login untuk melanjutkan</p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <div>
            <div className="mb-2 block">
              <Label htmlFor="username" value="Username" />
            </div>
            <TextInput
              id="username"
              type="text"
              placeholder="Username"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="password" value="Password" />
            </div>
            <div className="relative">
              <TextInput
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="******************"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? (
                  <HiEyeOff className="h-4 w-4" />
                ) : (
                  <HiEye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            isProcessing={isLoading}
            disabled={isLoading}
            color="failure"
            className="w-full"
          >
            {isLoading ? 'Sedang masuk...' : 'Masuk'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
