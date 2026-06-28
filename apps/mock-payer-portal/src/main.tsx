import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="portal">
      <section className="form-shell">
        <header>
          <span>Northstar Health Plan</span>
          <strong>Prior Authorization Portal</strong>
        </header>
        {submitted ? (
          <div className="confirmation" data-testid="portal-confirmation">
            <h1>Submission received</h1>
            <p>Confirmation ID: PORTAL-SYN-001</p>
          </div>
        ) : (
          <form
            data-testid="prior-auth-form"
            onSubmit={(event) => {
              event.preventDefault();
              setSubmitted(true);
            }}
          >
            <label>
              Member ID
              <input name="memberId" defaultValue="SYN-MEMBER-001" />
            </label>
            <label>
              Medication
              <input name="medication" defaultValue="Fictionalimab" />
            </label>
            <label>
              Diagnosis
              <input name="diagnosis" defaultValue="Moderate-to-severe IBD" />
            </label>
            <button type="submit">Submit prior authorization</button>
          </form>
        )}
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
