import { useEffect, useState } from "react";

const API_BASE = `${import.meta.env.VITE_API_URL}/api/pdfs/`;
export default function PDFManager() {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [error, setError] = useState("");

  const fetchPdfs = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Couldn't load the PDF list.");
      setPdfs(await res.json());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file || !title.trim()) {
      setError("Give it a title and choose a PDF file first.");
      return;
    }
    const formData = new FormData();
    formData.append("title", title.trim());
    formData.append("file", file);

    setUploading(true);
    try {
      const res = await fetch(API_BASE, { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed. Check the file is a PDF.");
      setTitle("");
      setFile(null);
      e.target.reset();
      setError("");
      fetchPdfs();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc) => {
    if (!window.confirm(`Delete "${doc.title}"? This can't be undone.`)) return;
    try {
      const res = await fetch(`${API_BASE}${doc.id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed.");
      setPdfs((prev) => prev.filter((p) => p.id !== doc.id));
      if (previewDoc?.id === doc.id) setPreviewDoc(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownload = (doc) => {

    const link = document.createElement("a");
    link.href = doc.download_url;
    link.setAttribute("download", `${doc.title}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={styles.page}>
      <h1 style={styles.heading}>PDF Library</h1>

      <form onSubmit={handleUpload} style={styles.form}>
        <input
          type="text"
          placeholder="Document title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={styles.input}
        />
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files[0] || null)}
          style={styles.input}
        />
        <button type="submit" disabled={uploading} style={styles.primaryBtn}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>

      {error && <p style={styles.error}>{error}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : pdfs.length === 0 ? (
        <p style={styles.empty}>No PDFs saved yet. Upload one above.</p>
      ) : (
        <ul style={styles.list}>
          {pdfs.map((doc) => (
            <li key={doc.id} style={styles.row}>
              <div>
                <p style={styles.title}>{doc.title}</p>
                <p style={styles.meta}>
                  {doc.size_kb ? `${doc.size_kb} KB` : ""} · uploaded{" "}
                  {new Date(doc.uploaded_at).toLocaleDateString()}
                </p>
              </div>
              <div style={styles.actions}>
                <button onClick={() => setPreviewDoc(doc)} style={styles.btn}>
                  Preview
                </button>
                <button onClick={() => handleDownload(doc)} style={styles.btn}>
                  Download
                </button>
                <button
                  onClick={() => handleDelete(doc)}
                  style={{ ...styles.btn, color: "#b42318", borderColor: "#f3a5a0" }}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {previewDoc && (
        <div style={styles.overlay} onClick={() => setPreviewDoc(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <span style={styles.title}>{previewDoc.title}</span>
              <button onClick={() => setPreviewDoc(null)} style={styles.closeBtn}>
                Close
              </button>
            </div>
            <iframe
              src={previewDoc.file_url}
              title={previewDoc.title}
              style={styles.iframe}
            />
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  page: { maxWidth: 720, margin: "0 auto", padding: 24, fontFamily: "system-ui, sans-serif" },
  heading: { fontSize: 20, fontWeight: 600, marginBottom: 16 },
  form: { display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" },
  input: { flex: 1, minWidth: 160, padding: "8px 10px", border: "1px solid #d0d5dd", borderRadius: 6 },
  primaryBtn: {
    padding: "8px 16px",
    background: "#1d4ed8",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  error: { color: "#b42318", marginBottom: 12 },
  empty: { color: "#667085" },
  list: { listStyle: "none", padding: 0, border: "1px solid #eaecf0", borderRadius: 8 },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    borderBottom: "1px solid #eaecf0",
  },
  title: { fontWeight: 500, margin: 0 },
  meta: { fontSize: 13, color: "#667085", margin: 0 },
  actions: { display: "flex", gap: 8 },
  btn: {
    padding: "6px 12px",
    background: "#fff",
    border: "1px solid #d0d5dd",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
  },
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 50,
  },
  modal: {
    background: "#fff",
    width: "90%",
    maxWidth: 900,
    height: "85vh",
    borderRadius: 8,
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 16px",
    borderBottom: "1px solid #eaecf0",
  },
  closeBtn: { border: "none", background: "none", cursor: "pointer", fontSize: 14, color: "#667085" },
  iframe: { flex: 1, width: "100%", border: "none" },
};