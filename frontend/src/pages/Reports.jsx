import { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Download, Calendar, DollarSign, Receipt, FileText } from 'lucide-react';

export default function Reports() {
  const [tab, setTab] = useState('sales');
  const [salesData, setSalesData] = useState(null);
  const [gstData, setGstData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0]; });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const params = `from=${dateFrom}&to=${dateTo}`;
      const [salesRes, gstRes] = await Promise.all([
        axios.get(`/api/reports/sales?${params}`),
        axios.get(`/api/reports/gst?${params}`)
      ]);
      setSalesData(salesRes.data.data);
      setGstData(gstRes.data.data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { fetchReports(); }, [dateFrom, dateTo]);

  const tabs = [
    { id: 'sales', label: 'Sales Report', icon: BarChart3 },
    { id: 'gst', label: 'GST Report', icon: FileText },
    { id: 'invoices', label: 'Invoice List', icon: Receipt },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-sm text-gray-500">Analyze sales, taxes, and business performance</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-white rounded-lg border p-0.5 gap-0.5">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                tab === t.id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}>
              <t.icon className="h-3.5 w-3.5" />{t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-400" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="input py-1.5 text-sm w-36" />
          <span className="text-gray-400">to</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="input py-1.5 text-sm w-36" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* Sales Report */}
          {tab === 'sales' && salesData && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Total Revenue', value: `₹${salesData.summary.totalRevenue.toLocaleString('en-IN')}`, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Total Orders', value: salesData.summary.totalOrders, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Avg Order Value', value: `₹${salesData.summary.avgOrderValue.toLocaleString('en-IN')}`, color: 'text-purple-600 bg-purple-50' },
                  { label: 'Total Tax', value: `₹${salesData.summary.totalTax.toLocaleString('en-IN')}`, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Total Discount', value: `₹${salesData.summary.totalDiscount.toLocaleString('en-IN')}`, color: 'text-red-600 bg-red-50' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-xl border p-4">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                  </div>
                ))}
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-5 py-3 border-b flex items-center justify-between">
                  <h3 className="font-semibold">Sales Transactions</h3>
                  <span className="text-sm text-gray-500">{salesData.invoices.length} invoices</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
                      <th className="px-4 py-3 font-medium">Invoice #</th>
                      <th className="px-4 py-3 font-medium">Date</th>
                      <th className="px-4 py-3 font-medium">Customer</th>
                      <th className="px-4 py-3 font-medium">Items</th>
                      <th className="px-4 py-3 font-medium">Subtotal</th>
                      <th className="px-4 py-3 font-medium">Tax</th>
                      <th className="px-4 py-3 font-medium">Total</th>
                      <th className="px-4 py-3 font-medium">Payment</th>
                      <th className="px-4 py-3 font-medium">Billed By</th>
                    </tr></thead>
                    <tbody>
                      {salesData.invoices.slice(0, 50).map(inv => (
                        <tr key={inv._id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium font-mono text-xs">{inv.invoiceNumber}</td>
                          <td className="px-4 py-3 text-gray-600">{new Date(inv.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="px-4 py-3">{inv.customerName || '—'}</td>
                          <td className="px-4 py-3">{inv.items?.length}</td>
                          <td className="px-4 py-3">₹{inv.subtotal?.toFixed(2)}</td>
                          <td className="px-4 py-3 text-gray-500">₹{inv.totalTax?.toFixed(2)}</td>
                          <td className="px-4 py-3 font-semibold">₹{inv.grandTotal?.toFixed(2)}</td>
                          <td className="px-4 py-3 capitalize">{inv.paymentMode}</td>
                          <td className="px-4 py-3 text-gray-500">{inv.billedBy?.name || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {salesData.invoices.length === 0 && <div className="text-center py-10 text-gray-400">No transactions in this period</div>}
                </div>
              </div>
            </div>
          )}

          {/* GST Report */}
          {tab === 'gst' && gstData && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                <div className="bg-white rounded-xl border p-5">
                  <p className="text-sm text-gray-500">Total Tax Collected</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">₹{gstData.totalTax.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-gray-400 mt-1">{gstData.totalInvoices} invoices</p>
                </div>
              </div>

              <div className="bg-white rounded-xl border overflow-hidden">
                <div className="px-5 py-3 border-b">
                  <h3 className="font-semibold">GST Breakdown by Rate</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
                      <th className="px-4 py-3 font-medium">GST Rate</th>
                      <th className="px-4 py-3 font-medium">Taxable Amount</th>
                      <th className="px-4 py-3 font-medium">CGST</th>
                      <th className="px-4 py-3 font-medium">SGST</th>
                      <th className="px-4 py-3 font-medium">IGST</th>
                      <th className="px-4 py-3 font-medium">Total Tax</th>
                    </tr></thead>
                    <tbody>
                      {Object.entries(gstData.gstBreakdown || {}).map(([rate, data]) => (
                        <tr key={rate} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-3 font-semibold">{rate}%</td>
                          <td className="px-4 py-3">₹{data.taxableAmount.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">₹{data.cgst.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">₹{data.sgst.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">₹{data.igst.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3 font-semibold">₹{data.total.toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {Object.keys(gstData.gstBreakdown || {}).length === 0 && <div className="text-center py-10 text-gray-400">No tax data in this period</div>}
                </div>
              </div>
            </div>
          )}

          {/* Invoice List (same as sales but different view) */}
          {tab === 'invoices' && salesData && (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="px-5 py-3 border-b"><h3 className="font-semibold">All Invoices ({salesData.invoices.length})</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="text-left text-gray-500 border-b bg-gray-50">
                    <th className="px-4 py-3 font-medium">Invoice</th>
                    <th className="px-4 py-3 font-medium">Date & Time</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Items</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr></thead>
                  <tbody>
                    {salesData.invoices.map(inv => (
                      <tr key={inv._id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-4 py-3 font-mono text-xs font-medium">{inv.invoiceNumber}</td>
                        <td className="px-4 py-3 text-gray-600">{new Date(inv.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                        <td className="px-4 py-3">{inv.customerName || '—'}</td>
                        <td className="px-4 py-3 text-gray-500">{inv.customerPhone || '—'}</td>
                        <td className="px-4 py-3">{inv.items?.length}</td>
                        <td className="px-4 py-3 font-semibold">₹{inv.grandTotal?.toFixed(2)}</td>
                        <td className="px-4 py-3 capitalize">{inv.paymentMode}</td>
                        <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${inv.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
