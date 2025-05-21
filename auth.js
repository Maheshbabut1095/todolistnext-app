import { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useRouter } from 'next/router';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const router = useRouter();

  const handleSignUp = async () => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return alert(error.message);

    const user = data.user;

    const { error: profileError } = await supabase.from('profiles').insert({
      id: user.id,
      email: user.email,
      username: username
    });

    if (profileError) return alert('Profile insert error: ' + profileError.message);

    alert('Signup successful! Please login.');
    setIsLogin(true);
  };

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return alert(error.message);
    router.push('/');
  };

  return (
    <div className="container">
      <h1>{isLogin ? 'Login' : 'Sign Up'}</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {!isLogin && (
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
      )}

      {isLogin ? (
        <button onClick={handleLogin}>Login</button>
      ) : (
        <button onClick={handleSignUp}>Sign Up</button>
      )}

      <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: 'pointer', color: 'blue' }}>
        {isLogin ? 'Create an account' : 'Already have an account? Login'}
      </p>

      <style jsx>{`
        .container {
          max-width: 400px;
          margin: 80px auto;
          padding: 30px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 10px rgba(0,0,0,0.1);
          text-align: center;
        }
        input {
          width: 100%;
          padding: 12px;
          margin: 10px 0;
          font-size: 16px;
          border: 1px solid #ccc;
          border-radius: 6px;
        }
        button {
          width: 100%;
          padding: 12px;
          font-size: 16px;
          background-color: #2563eb;
          color: white;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }
        button:hover {
          background-color: #1d4ed8;
        }
        p {
          margin-top: 20px;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}
