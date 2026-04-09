export default function Badge({ type, label }) {
  return <span className={`badge badge-${type}`}>{label || type}</span>
}

export function StatusBadge({ status }) {
  const labels = {
    vacant: 'Vacant', occupied: 'Occupied', cleaning: 'Cleaning',
    maintenance: 'Maintenance', active: 'Active', checked_out: 'Checked Out',
    pending: 'Pending', partial: 'Partial', paid: 'Paid',
  }
  return <span className={`badge badge-${status}`}>{labels[status] || status}</span>
}
