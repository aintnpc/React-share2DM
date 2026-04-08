import { useEffect } from 'react';

export default function Login() {
  useEffect(() => {
    window.location.href = 'https://dashboard.clozet.my';
  }, []);

  return null;
}
