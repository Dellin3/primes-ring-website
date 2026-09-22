export default function DatasetDownloads({ dataset }) {
  return (
    <section id="downloads" className="dataset-section" aria-labelledby="dataset-downloads-title">
      <header className="subsection-heading">
        <p>Downloads</p>
        <h2 id="dataset-downloads-title">Local observation subset</h2>
      </header>
      <div className="download-record">
        <div>
          <span>CSV · Comma-separated values</span>
          <strong>{dataset.fileName}</strong>
          <p>
            The complete local observation subset currently included in this public website repository.
          </p>
        </div>
        <a className="button button-secondary" href={dataset.file} download={dataset.fileName}>
          Download CSV
        </a>
      </div>
    </section>
  )
}
