import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { useAuth } from '../context/AuthContext';

function GoogleLoginButton() {
  const { login } = useAuth();

  return (
    <GoogleLogin
      onSuccess={(credentialResponse) => {
        const decoded = jwtDecode(credentialResponse.credential);

        login({
          uid: decoded.sub,        // 👈 ESTE es el UID
          name: decoded.name,
          email: decoded.email,
          picture: decoded.picture,
        });
      }}
      onError={() => {
        console.log('Error al iniciar sesión');
      }}
    />
  );
}

export default GoogleLoginButton;
