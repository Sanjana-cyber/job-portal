import { GoogleLogin } from "@react-oauth/google";
import toast from "react-hot-toast";

/**
 * Google OAuth Login Button Component
 * Uses @react-oauth/google for seamless Google sign-in
 *
 * @param {Object} props
 * @param {Function} props.onSuccess - Callback with Google credential on success
 * @param {string} props.text - Button text variant ("signin_with" or "signup_with")
 */
const GoogleLoginBtn = ({ onSuccess, text = "signin_with" }) => {
  const handleSuccess = (credentialResponse) => {
    if (credentialResponse.credential) {
      onSuccess(credentialResponse.credential);
    }
  };

  const handleError = () => {
    toast.error("Google sign-in failed. Please try again.");
  };

  return (
    <div className="google-login-wrapper" id="google-login-btn">
      <GoogleLogin
        onSuccess={handleSuccess}
        onError={handleError}
        text={text}
        shape="pill"
        size="large"
        width="100%"
        theme="filled_black"
      />
    </div>
  );
};

export default GoogleLoginBtn;
