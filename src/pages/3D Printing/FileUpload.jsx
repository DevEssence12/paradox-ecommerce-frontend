import { useState } from "react";
import axios from "axios";

export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [email, setEmail] = useState("");
  const [randomNumber, setRandomNumber] = useState("");

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleRandomNumberChange = (e) => {
    setRandomNumber(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file || !email || !randomNumber) {
      alert("All fields are required!");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("email", email);
    formData.append("randomNumber", randomNumber);

    try {
      await axios.post(`http://localhost:8080/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      alert("Email sent to admin successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to send email.");
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto bg-white shadow-md rounded text-red-900">
      <h2 className="text-xl font-semibold mb-4 ">Send STL File to Admin</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={handleEmailChange}
        className="mb-2 p-2 border w-full"
      />
      <input
        type="number"
        placeholder="Enter a random number"
        value={randomNumber}
        onChange={handleRandomNumberChange}
        className="mb-2 p-2 border w-full"
      />
      <input
        type="file"
        accept=".stl"
        onChange={handleFileChange}
        className="mb-2 p-2 border w-full"
      />
      <button
        onClick={handleSubmit}
        className="bg-blue-500 text-white p-2 rounded"
      >
        Send File
      </button>
    </div>
  );
}
