import "./Register.css";

function Register() {
  return (
    <div className="register">
      <h2>Create Account</h2>

      <input type="text" placeholder="Name" />
      <input type="email" placeholder="Email" />
      <input type="password" placeholder="Password" />

      <button>Register</button>
    </div>
  );
}

export default Register;