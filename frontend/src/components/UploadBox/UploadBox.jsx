import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./UploadBox.css";

function UploadBox(){

const [image,setImage] = useState(null)
const navigate = useNavigate()

function handleFile(e){

const file = e.target.files[0]

if(file){
setImage(URL.createObjectURL(file))
}

}

function processPrescription(){

// later backend will be called here

navigate("/results")

}

return(

<div className="upload-box">

<label className="upload-area">

<input
type="file"
onChange={handleFile}
hidden
/>

<div className="upload-text">

<p>Drag & Drop Prescription</p>
<span>or click to browse</span>

</div>

</label>

{image && (

<img
src={image}
alt="preview"
className="preview"
/>

)}

<button
className="process-btn"
onClick={processPrescription}
>

Process Prescription

</button>

</div>

)

}

export default UploadBox