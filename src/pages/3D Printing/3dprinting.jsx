import FileUpload from "./FileUpload";

function Printing() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-purple-500 w-screen">
      <div className="bg-white shadow-lg rounded-2xl p-6 w-full max-w-md">
        <h1 className="text-2xl font-semibold text-center text-gray-800 mb-4">
          Upload Your STL File
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Fill in your details and submit the file.
        </p>
        <FileUpload />
      </div>
    </div>
  );
}

export default Printing;
