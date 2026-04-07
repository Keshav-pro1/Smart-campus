import { useEffect, useState } from "react";
import api from "../api";
import Shell from "../components/Shell";
import StatusBadge from "../components/StatusBadge";

export default function PrintPage() {
  const [file, setFile] = useState(null);
  const [copies, setCopies] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [jobs, setJobs] = useState([]);
  const [printers, setPrinters] = useState([]);

  const loadData = async () => {
    const [jobsResponse, printerResponse] = await Promise.all([
      api.get("/print/jobs"),
      api.get("/print/printers"),
    ]);
    setJobs(jobsResponse.data);
    setPrinters(printerResponse.data);
  };

  useEffect(() => {
    loadData().catch(() => {});
    const timer = setInterval(() => loadData().catch(() => {}), 4000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Please choose a PDF file");
      return;
    }

    setSubmitting(true);
    setError("");

    const payload = new FormData();
    payload.append("document", file);
    payload.append("copies", copies);

    try {
      await api.post("/print/jobs", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      setCopies(1);
      event.target.reset();
      await loadData();
    } catch (err) {
      setError(err.response?.data?.message || "Unable to submit print job");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Shell title="Smart Printing">
      <div className="two-column">
        <section className="panel">
          <h3>Upload PDF</h3>
          <p className="muted">Payment is mocked. Successful checkout immediately creates a print token.</p>
          <form className="form-grid" onSubmit={handleSubmit}>
            <label>
              PDF file
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
            <label>
              Copies
              <input
                type="number"
                min="1"
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
              />
            </label>
            {file ? (
              <div className="helper-card">
                <strong>Selected file</strong>
                <p>{file.name}</p>
              </div>
            ) : null}
            {error ? <div className="error-banner">{error}</div> : null}
            <button className="primary-btn" type="submit" disabled={submitting}>
              {submitting ? "Processing payment..." : "Pay & Print"}
            </button>
          </form>
        </section>

        <section className="panel">
          <h3>Printer Activity</h3>
          <div className="stack-list">
            {printers.map((printer) => (
              <div key={printer.id} className="list-row">
                <div>
                  <strong>{printer.name}</strong>
                  <p className="muted">{printer.id}</p>
                </div>
                <StatusBadge status={printer.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="panel">
        <h3>Your print jobs</h3>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Token</th>
                <th>File</th>
                <th>Copies</th>
                <th>Status</th>
                <th>Printer</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>{job.token}</td>
                  <td>{job.fileName}</td>
                  <td>{job.copies}</td>
                  <td>
                    <StatusBadge status={job.displayStatus} />
                  </td>
                  <td>{job.printerId || "Waiting"}</td>
                </tr>
              ))}
              {!jobs.length ? (
                <tr>
                  <td colSpan="5" className="empty-cell">
                    No print jobs yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </Shell>
  );
}
