import { useState } from "react";
import "./UploadBox.css";

function UploadBox(){

const [image,setImage] = useState(null)

function handleFile(e){
setImage(URL.createObjectURL(e.target.files[0]))
}

return(

<div className="uploadBox">

<input type="file" onChange={handleFile}/>

{image && (
<img
src={image}
alt="preview"
className="preview"
/>
)}

<button>Process Prescription</button>

</div>

)

}

export default UploadBox