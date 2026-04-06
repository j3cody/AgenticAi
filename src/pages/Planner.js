function Planner() {
  const plan = JSON.parse(localStorage.getItem("plan")) || [];

  return (
    <div className="bg-white p-5 rounded shadow">
      <h2 className="text-lg font-semibold mb-3">
        Today's Self-Care Plan
      </h2>

      {plan.length === 0 ? (
        <p className="text-gray-500">
          No plan generated yet. Talk to AI first.
        </p>
      ) : (
        <ul className="list-disc ml-5 space-y-2">
          {plan.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Planner;