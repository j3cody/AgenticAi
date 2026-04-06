function History() {
  const history = JSON.parse(localStorage.getItem("history")) || [];

  return (
    <div className="bg-white p-5 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">
        Chat History
      </h2>

      {history.length === 0 ? (
        <p className="text-gray-500">No history yet.</p>
      ) : (
        history.map((msg, index) => (
          <div key={index} className="mb-2">
            <span
              className={
                msg.sender === "user"
                  ? "text-blue-600"
                  : "text-gray-800"
              }
            >
              {msg.sender}: {msg.text}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

export default History;