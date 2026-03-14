import UploadBox from "../../components/UploadBox/UploadBox";
import MedicineCard from "../../components/MedicineCard/MedicineCard";
import Loader from "../../components/Loader/Loader";
import "./Home.css";

function Home() {

const medicines = [
  {
    name: "Paracetamol",
    dose: "500mg",
    frequency: "Twice daily",
    explanation: "Used for fever and pain relief"
  },
  {
    name: "Azithromycin",
    dose: "250mg",
    frequency: "Once daily",
    explanation: "Antibiotic used to treat infections"
  }
];

return (

<div className="home">

<header className="navbar">
<h2>AI Prescription Reader</h2>
</header>

<section className="upload-section">
<h3>Upload Prescription</h3>
<UploadBox/>
</section>

<section className="results-section">

<h3>Extracted Medicines</h3>

<div className="medicine-grid">

{medicines.map((med,index)=>(
<MedicineCard key={index} medicine={med}/>
))}

</div>

</section>

</div>

)

}

export default Home