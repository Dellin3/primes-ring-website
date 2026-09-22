import { useMemo, useState } from 'react'

export default function DataFieldsPanel({ fields, publishedColumns = [] }) {
  const [expanded, setExpanded] = useState(false)
  const publishedSourceColumns = useMemo(
    () => new Set(publishedColumns.map((column) => column.source_column)),
    [publishedColumns],
  )
  return (
    <details
      className="data-fields-panel"
      onToggle={(event) => setExpanded(event.currentTarget.open)}
    >
      <summary aria-expanded={expanded}>
        <span>Data fields</span>
        <small>
          {fields.length} PDS-documented · {publishedColumns.length} in exact web derivative
        </small>
      </summary>
      <div className="data-field-list">
        {fields.map((field) => (
          <article key={field.column_number}>
            <div>
              <span>Column {field.column_number}</span>
              <h3>{field.user_facing_name || field.source_column_name}</h3>
              <code>{field.source_column_name}</code>
            </div>
            <p>
              {field.meaning
                || 'Definition not currently documented in the local provenance package.'}
            </p>
            <dl>
              <div>
                <dt>Unit</dt>
                <dd>{field.unit || 'Not documented'}</dd>
              </div>
              <div>
                <dt>Type</dt>
                <dd>{field.data_type}</dd>
              </div>
              <div>
                <dt>Provenance</dt>
                <dd>{field.provenance_status || 'Not documented'}</dd>
              </div>
              <div>
                <dt>Interactive viewer</dt>
                <dd>
                  {publishedSourceColumns.has(field.source_column_name)
                    ? 'Published in exact web derivative'
                    : 'Source documentation only'}
                </dd>
              </div>
              {field.reference_time && (
                <div>
                  <dt>Reference time</dt>
                  <dd>{field.reference_time}</dd>
                </div>
              )}
            </dl>
          </article>
        ))}
      </div>
    </details>
  )
}
