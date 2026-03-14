import { Link } from "react-router-dom";
import "./Home.css";

function Home() {

return(

<div className="home">

<header className="navbar">
<h2>AI Prescription Reader</h2>

<div className="nav-buttons">
<Link to="/login">Login</Link>
<Link to="/register">Register</Link>
</div>

</header>


<section className="hero">

<h1>Understand Your Prescription Instantly</h1>

<p>
Upload a prescription and let AI extract medicines,
dosage, and explanations automatically.
</p>

<Link to="/upload">
<button className="primary-btn">
Get Started
</button>
</Link>

</section>


<section className="features">

<div className="feature-card">
<h3>Upload Prescription</h3>
<p>Upload or capture a prescription image easily.</p>
</div>

<div className="feature-card">
<h3>AI Medicine Detection</h3>
<p>Extract medicines, dosage, and frequency.</p>
</div>

<div className="feature-card">
<h3>Clear Explanation</h3>
<p>Understand medicines in simple language.</p>
</div>

</section>

</div>

)

}

export default Home