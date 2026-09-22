export default function DataFieldsDisclosure({ fields }) {
  return (
    <details className="data-fields-disclosure">
      <summary>
        <span>Data fields</span>
        <small>{fields.length} PDS-documented columns</small>
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
