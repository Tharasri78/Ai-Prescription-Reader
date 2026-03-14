import "./MedicineCard.css"

function MedicineCard({medicine}){

return(

<div className="card">

<h3>{medicine.name}</h3>

<p><strong>Dose:</strong> {medicine.dose}</p>

<p><strong>Frequency:</strong> {medicine.frequency}</p>

<p className="explanation">{medicine.explanation}</p>

</div>

)

}

export default MedicineCard