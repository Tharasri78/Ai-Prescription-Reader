import UploadBox from "../../components/UploadBox/UploadBox";
import "./Upload.css";

function Upload() {

  return (

    <div className="upload-page">

      <h2>Upload Prescription</h2>

      <p>Select a prescription image to analyze</p>

      <UploadBox />

    </div>

  );

}

export default Upload;