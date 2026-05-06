import React, { useState } from 'react';
import { CreditCard, PlusCircle, Search } from 'lucide-react';
import { authorizedFetch } from '../../api/apiClient';
import '../../styles/Dashboard.css';

const AdminDues = () => {
  const [message, setMessage] = useState(null);
  const [citizenId, setCitizenId] = useState('');
  const [properties, setProperties] = useState([]);
  const [formData, setFormData] = useState({
  property_id: '',
  type: 'Water',
  amount: '',
  due_date: '',
  status: 'unpaid',
  content: ''
 });
 const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
 };
  const handleSubmit = async (e) => {
  e.preventDefault();

  if (!formData.property_id) {
    setMessage({ type: "error", text: "Please select a property" });
    return;
  }

  try {
    const res = await authorizedFetch("http://localhost:5000/api/dues", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error || "Failed to assign due" });
      return;
    }

    // SUCCESS MESSAGE
    setMessage({ type: "success", text: "Due assigned successfully!" });

    // reset form
    setFormData({
      property_id: '',
      type: 'Water',
      amount: '',
      due_date: '',
      status: 'unpaid',
      content: ''
    });

  } catch (err) {
    console.error(err);
    setMessage({ type: "error", text: "Network error" });
  }
};

  const handleSearch = async () => {
  if (!citizenId) return;

  try {
    const res = await authorizedFetch(`http://localhost:5000/api/citizens/${citizenId}/properties`);
    const data = await res.json();

    if (!res.ok) {
      alert(data.error);
      return;
    }

    //setProperties(data.properties);
    setProperties(data.properties || []);

  if (data.properties && data.properties.length > 0) {
  setFormData(prev => ({
    ...prev,
    property_id: data.properties[0].property_id
  }));
}
  } catch (err) {
    console.error(err);
    alert("Error fetching properties");
  }
};
  return (
    <div className="container fade-in">
      <div className="citizen-welcome mb-8">
        <h1>Manage Municipal Dues</h1>
        <p>Assign and control taxes, utility bills, and service fees for citizens' properties.</p>
      </div>

      {/* Assign New Due Section */}
      <div className="flex items-center gap-2 mb-4">
        <PlusCircle size={24} color="var(--primary-color)" />
        <h2 className="board-title">Assign New Due / Bill</h2>
      </div>
     
     {message && (
  <div
    style={{
      width: "fit-content",
      padding: "5px 10px",
      marginBottom: "8px",
      borderRadius: "6px",
      color: "white",
      backgroundColor: message.type === "success" ? "green" : "red"
    }}
  >
    {message.text}
  </div>
)}
      <div className="glass-panel text-left">
        <form onSubmit={handleSubmit}>
          <div className="grid md:grid-cols-2 gap-4">
            
            <div className="form-group mb-0">
              <label className="form-label">Search Citizen ID</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input type="text" className="form-control" placeholder="E.g., LB-1001"
                value={citizenId}
                 onChange={(e) => setCitizenId(e.target.value)}
                 style={{ flex: 1 }} />
                <button type="button"  onClick={handleSearch} className="btn btn-outline" style={{ padding: '0 15px' }}><Search size={18} /></button>
              </div>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Select Citizen's Property</label>
              <select className="form-control" name="property_id" value={formData.property_id} onChange={handleChange}>
                 <option value="">-- Select Property --</option>
                  {properties.map((prop) => (
                <option key={prop.property_id} value={prop.property_id}>
                  Property ID {prop.property_id}: {prop.type} ({prop.location})
                </option>
                  ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Due / Bill Type</label>
              <select className="form-control" value={formData.type} name="type" onChange={handleChange}  >
                <option value="Water">Water Bill</option>
                <option value="Electricity">Electricity / Generator</option>
                <option value="Garbage">Garbage / Cleanliness Fee</option>
                <option value="House Dues">Annual House Tax</option>
                <option value="Permit">Permit / Licensing Fee</option>
                <option value="Other">Other Penalty / Fee</option>
              </select>
            </div>
            
            <div className="form-group mb-0">
              <label className="form-label">Amount ($)</label>
              <input type="number" step="0.01" className="form-control" placeholder="0.00" value={formData.amount} name="amount" onChange={handleChange} />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Due Date (Deadline)</label>
              <input type="date" className="form-control" value={formData.due_date} name="due_date" onChange={handleChange} />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Initial Status</label>
              <select className="form-control" value={formData.status} name="status" onChange={handleChange}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </div>
          </div>

          <div className="form-group mt-4">
            <label className="form-label">Description / Notes</label>
            <textarea className="form-control" rows="2" placeholder="E.g., Water bill for the month of May 2026..." value={formData.content} name="content" onChange={handleChange}></textarea>
          </div>

          <div className="flex justify-end mt-4">
            <button type="submit" className="btn btn-primary" >
              <CreditCard size={18} style={{ marginRight: '8px', display: 'inline' }}/>
              Assign Due to Property
            </button>
          </div>
        </form>
      </div>

    </div>
  );
};

export default AdminDues;
