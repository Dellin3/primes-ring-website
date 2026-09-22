export default function EvidenceDock() {
  const products = [
    { label: 'Stationary roots', status: 'Not published' },
    { label: 'Branch records', status: 'Not published' },
    { label: 'Diagnostics', status: 'Not published' },
    { label: 'Reconstruction', status: 'Not published' },
  ]

  return (
    <section className="evidence-dock" aria-labelledby="derived-products-title">
      <header>
        <p className="eyebrow">Evidence plane</p>
        <h2 id="derived-products-title">Derived Research Products</h2>
      </header>
      <table className="evidence-dock-table">
        <thead>
          <tr>
            <th scope="col">Product</th>
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.label}>
              <td>{product.label}</td>
              <td>{product.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  )
}
