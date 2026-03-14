import "./Login.css";

function Login(){

return(

<div className="auth-container">

<div className="auth-card">

<h2>Welcome Back</h2>

<input type="email" placeholder="Email"/>

<input type="password" placeholder="Password"/>

<button>Login</button>

<p>Create an account if you don't have one.</p>

</div>

</div>

)

}

export default Login