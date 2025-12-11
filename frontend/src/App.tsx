import { useEffect, useState } from "react";
import { BiHistory, BiTrash } from "react-icons/bi";

export default function App() {
  const [storedHistory, setStoredHistory] = useState<any>([]);
  const [historyToggle, setHistoryToggle] = useState(false);
  const [Gemini, setGemini] = useState(true)

  useEffect(() => {
    const store = localStorage.getItem("history");
    if (store) setStoredHistory(JSON.parse(store));
  }, []);

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (query.length > 0) {
        const newHistory = [...storedHistory, query];
        setStoredHistory(newHistory);
        localStorage.setItem("history", JSON.stringify(newHistory));

        window.location.href = `https://google.com/search?q=${encodeURIComponent(
          query
        )}`;
      }
    }
  };

  const handleToggle = () => {
    setHistoryToggle(!historyToggle);
  };

  if (historyToggle) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center pt-20 px-4">
        <div className="mb-8 flex gap-4">
          <button
            onClick={handleToggle}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
          >
            Back
          </button>
        </div>

        <h1 className="text-3xl font-semibold mb-6">Your Search History</h1>
        <BiTrash onClick={() => {
          localStorage.removeItem("history")
        }} />
        <div className="w-full max-w-lg bg-white shadow rounded-lg p-6 space-y-3">
          {storedHistory.length > 0 ? (
            storedHistory.map((item: string, i: number) => (
              <div
                key={i}
                className="p-3 border-b last:border-none hover:bg-gray-100 rounded cursor-pointer"
              >
                {item}
              </div>
            ))
          ) : (
            <span className="text-gray-500">No previous history.</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">

      <div className="w-full max-w-xl flex justify-center gap-3 mt-6">
        <button className="px-4 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600">
          Home
        </button>
        <button
          onClick={handleToggle}
          className="px-4 py-2 bg-gray-700 flex gap-2 text-white rounded-lg shadow hover:bg-gray-800"
        >
          History <BiHistory className="mt-1" />
        </button>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 gap-6 w-full px-4">
        <h1 className="text-5xl font-semibold mb-6 text-gray-800">
          Your New Tab
        </h1>

        <div className="w-full max-w-xl">
          <input
            type="text"
            placeholder="Search in Google..."
            onKeyDown={handleKeyDown}
            className="w-full px-6 py-3 rounded-full bg-white border border-gray-300 shadow-sm 
                       placeholder:text-gray-500 text-black focus:outline-none focus:ring-2 
                       focus:ring-blue-500 transition"
          />
        </div>

        <div className="text-gray-600 text-sm tracking-wide">
          Made by <a href="https://github.com/TPashaxrd">Toprak Doğan</a>
        </div>

        {storedHistory.length > 0 && (
          <div className="mt-4 text-gray-700 text-sm">
            Last search:{" "}
            <span className="font-medium">
              {storedHistory[storedHistory.length - 1]}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}