import MedicineCard from "../../components/MedicineCard/MedicineCard"
import "./Results.css"

function Results(){

const medicines = [

{
name:"Paracetamol",
dose:"500mg",
frequency:"Twice daily",
explanation:"Used for fever and pain relief"
},

{
name:"Azithromycin",
dose:"250mg",
frequency:"Once daily",
explanation:"Antibiotic used to treat infections"
}

]

return(

<div className="results">

<h2>Prescription Results</h2>

<div className="medicine-grid">

{medicines.map((med,index)=>(
<MedicineCard key={index} medicine={med}/>
))}

</div>

</div>

)

}

export default Results