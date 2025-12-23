"use client";
import { useState, useEffect } from "react";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    pintrx: "",
    digi_username: "",
    digi_key: "",
  });

  // Ambil daftar user saat halaman dimuat
  const fetchUsers = async () => {
    const res = await fetch("/api/admin/users");
    const result = await res.json();
    if (result.success) setUsers(result.data);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const result = await res.json();
    alert(result.message);
    if (result.success) {
      setFormData({ username: "", password: "", pintrx: "", digi_username: "", digi_key: "" });
      fetchUsers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Hapus user ini?")) return;
    const res = await fetch(`/api/admin/users?id=${id}`, { method: "DELETE" });
    const result = await res.json();
    if (result.success) fetchUsers();
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white">
      <h1 className="text-2xl font-bold mb-6">User Management (Admin)</h1>
      
      {/* Form Tambah User */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 bg-gray-800 p-6 rounded-lg">
        <input type="text" placeholder="Username" className="p-2 rounded bg-gray-700" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
        <input type="password" placeholder="Password Login" className="p-2 rounded bg-gray-700" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
        <input type="text" placeholder="PIN Transaksi" className="p-2 rounded bg-gray-700" value={formData.pintrx} onChange={(e) => setFormData({...formData, pintrx: e.target.value})} required />
        <input type="text" placeholder="Digiflazz Username" className="p-2 rounded bg-gray-700" value={formData.digi_username} onChange={(e) => setFormData({...formData, digi_username: e.target.value})} required />
        <input type="text" placeholder="Digiflazz API Key" className="p-2 rounded bg-gray-700" value={formData.digi_key} onChange={(e) => setFormData({...formData, digi_key: e.target.value})} required />
        <button type="submit" className="bg-blue-600 p-2 rounded hover:bg-blue-700 md:col-span-2">Tambah User Baru</button>
      </form>

      {/* Tabel Daftar User */}
      <table className="w-full text-left bg-gray-800 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-700">
            <th className="p-3">Username</th>
            <th className="p-3">Digi User</th>
            <th className="p-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u: any) => (
            <tr key={u._id} className="border-b border-gray-700">
              <td className="p-3">{u.username}</td>
              <td className="p-3">{u.digi_username}</td>
              <td className="p-3">
                <button onClick={() => handleDelete(u._id)} className="text-red-500 hover:underline">Hapus</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}