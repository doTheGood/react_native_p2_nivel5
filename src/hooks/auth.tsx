import React, { createContext, useCallback, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-community/async-storage';
import api from '../services/api';

interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
}

interface IAuthState {
  token: string;
  user: User;
}

interface ISignInCredentials {
  email: string;
  password: string;
}

interface IAuthContextData {
  user: User;
  loading: boolean;
  signIn(credentials: ISignInCredentials): Promise<void>;
  signOut(): void;
}

const AuthContext = createContext<IAuthContextData>({} as IAuthContextData);

const AuthProvider: React.FC = ({ children }) => {
  const [data, setData] = useState<IAuthState>({} as IAuthState);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoragedData(): Promise<void> {
      const [token, user] = await AsyncStorage.multiGet([
        '@GoBarber:token',
        '@GoBarber:user'
      ]);
      if(token[1] && user[1]) {
        setData({ token: token[1], user: JSON.parse(user[1])});
      }

      setLoading(false);

    };

    loadStoragedData();

  }, [])

  const signIn = useCallback(async ({ email, password }) => {
    const response = await api.post('sessions', {
      email,
      password,
    });

    const { token, user } = response.data;

    await AsyncStorage.multiSet([
      ['@GoBarber:token',token],
      ['@GoBarber:user',JSON.stringify(user)],
    ])

    setData({ token, user });
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.multiRemove(['@GoBarber:token','@GoBarber:user']);
    setData({} as IAuthState);
  }, []);

  return (
    <AuthContext.Provider value={{ user: data.user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

function useAuth(): IAuthContextData {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within am AuthProvider');
  }
  return context;
}

export { AuthProvider, useAuth };