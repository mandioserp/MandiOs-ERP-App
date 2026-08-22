import React, { useState, useEffect } from 'react';
import api from '../utils/api.js';
import { useLanguage } from '../context/LanguageContext.jsx';
import { 
  Search, Download, Printer, ArrowLeft, ArrowUpDown, 
  ChevronRight, ShoppingBag, DollarSign, Calendar, RefreshCw, 
  User, Eye, MapPin, Layers, Briefcase, CheckCircle, Info, ExternalLink,
  PlusCircle, Truck, Package, Undo2
} from 'lucide-react';
import { openReportInNewTab } from '../utils/navigation.js';
import { downloadLotVoucherPDF } from '../utils/pdfExport.js';

export default function SoldConsignments({ user, setCurrentTab }) {
  const { t } = useLanguage();
  
  // Master lists
  const [sales, setSales] = useState([]);
  const [stockEntries, setStockEntries] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [returns, setReturns] = useState([]);
  const [businessProfile, setBusinessProfile] = useState(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState(null); // When a lot is clicked, opens Lot Details page
  const [voucherPreviewLot, setVoucherPreviewLot] = useState(null); // Professional Lot Voucher in-window preview modal
  const [selectedRows, setSelectedRows] = useState([]); // Array of sale IDs for multi-selection
  const [searchTerm, setSearchTerm] = useState('');
  
  // Lot Sheet Financial Settlement state
  const [lotFinCommType, setLotFinCommType] = useState('Percentage');
  const [lotFinCommValue, setLotFinCommValue] = useState(0);
  const [lotFinMarketFee, setLotFinMarketFee] = useState(0);
  const [lotFinExpenses, setLotFinExpenses] = useState({});
  const [savingLotFin, setSavingLotFin] = useState(false);
  const [recordingSettlement, setRecordingSettlement] = useState(false);
  const [lotFinMessage, setLotFinMessage] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [salesRes, stockRes, supRes, custRes, prodRes, auditRes, ledgerRes, expCatRes, returnsRes, bizRes] = await Promise.all([
        api.get('/sales').catch(() => ({ data: [] })),
        api.get('/stock').catch(() => ({ data: [] })),
        api.get('/suppliers').catch(() => ({ data: [] })),
        api.get('/customers').catch(() => ({ data: [] })),
        api.get('/products').catch(() => ({ data: [] })),
        api.get('/audit').catch(() => ({ data: [] })),
        api.get('/reports?type=custom').catch(() => ({ data: { ledger: [] } })), // ledger helper
        api.get('/settings/expense-categories').catch(() => ({ data: [] })),
        api.get('/returns').catch(() => ({ data: [] })),
        api.get('/settings/business').catch(() => ({ data: null }))
      ]);

      const extractArray = (data) => Array.isArray(data) ? data : (Array.isArray(data?.products) ? data.products : (Array.isArray(data?.data) ? data.data : (Array.isArray(data?.returns) ? data.returns : [])));
      setSales(extractArray(salesRes.data));
      setStockEntries(extractArray(stockRes.data));
      setSuppliers(extractArray(supRes.data));
      setCustomers(extractArray(custRes.data));
      setProducts(extractArray(prodRes.data));
      setAuditLogs(extractArray(auditRes.data));
      setLedgerEntries(extractArray(ledgerRes.data?.ledger));
      setExpenseCategories(extractArray(expCatRes.data).filter(c => c.status !== 'Inactive'));
      setReturns(extractArray(returnsRes.data));
      if (bizRes?.data) {
        setBusinessProfile(bizRes.data);
      }
    } catch (err) {
      console.error('Failed to load sold consignments details', err);
    } finally {
      setLoading(false);
    }
  };

  // Sync lot financial settlement inputs when selected lot changes
  useEffect(() => {
    if (selectedLot && stockEntries.length > 0) {
      const activeStock = stockEntries.find(s => (s.id || s._id) === selectedLot);
      if (activeStock) {
        setLotFinCommType(activeStock.supplierCommissionType || 'Percentage');
        setLotFinCommValue(activeStock.supplierCommissionValue !== undefined ? activeStock.supplierCommissionValue : 0);
        setLotFinMarketFee(activeStock.marketFeeRate !== undefined ? activeStock.marketFeeRate : (activeStock.marketFeePercentage !== undefined ? activeStock.marketFeePercentage : 0));
        setLotFinExpenses(activeStock.lotExpenses || {});
        setLotFinMessage(null);
      }
    }
  }, [selectedLot, stockEntries]);

  // Construct master Consignment Lots list (One Row Per Lot)
  const existingStockIds = new Set(stockEntries.map(s => s.id || s._id));

  const stockLotsMap = stockEntries.map(stock => {
    const stockEntryId = stock.id || stock._id;
    const lotNumber = stock.lotNumber || (stockEntryId ? stockEntryId.substring(0, 8).toUpperCase() : 'N/A');
    const supplier = suppliers.find(sup => (sup.id || sup._id) === stock.supplierId) || { name: stock.supplierName || 'Farmer Supplier', phone: stock.supplierPhone || '' };
    const product = products.find(p => (p.id || p._id) === stock.productId) || { name: stock.productName || 'Commodity Product', unit: stock.unit || 'crates', category: stock.category || '' };

    // Linked sales for this lot
    const lotSales = sales.filter(s => {
      const sStockId = s.stockEntryId ? String(s.stockEntryId) : null;
      const sLotNum = s.stockLotNumber ? String(s.stockLotNumber) : null;
      const stockIdStr = stockEntryId ? String(stockEntryId) : null;
      const stockLotNumStr = stock.lotNumber ? String(stock.lotNumber) : null;

      if (sStockId && stockIdStr) {
        return sStockId === stockIdStr;
      }
      if (sLotNum && stockLotNumStr) {
        return sLotNum === stockLotNumStr;
      }
      return false;
    });

    // Linked approved returns for this lot
    const lotReturns = returns.filter(r => {
      const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
      const stockIdStr = stockEntryId ? String(stockEntryId) : null;
      const rSaleId = r.saleId ? String(r.saleId) : null;
      const matchesStock = (rStockId && stockIdStr && rStockId === stockIdStr);
      const matchesSale = rSaleId && lotSales.some(s => String(s.id || s._id) === rSaleId);
      return (matchesStock || matchesSale) && (r.status === 'Approved') && (!r.isDeleted);
    });

    const arrivedQty = stock.totalQuantity || stock.quantity || 0;
    const rawSoldQty = lotSales.reduce((acc, s) => acc + (s.quantity || 0), 0);
    const returnedQty = lotReturns.reduce((acc, r) => acc + (Number(r.produceReturnedQty) || 0), 0);
    const totalSoldQty = Math.max(0, rawSoldQty - returnedQty);

    const totalWalkInQty = lotSales.filter(s => s.isWalkIn).reduce((acc, s) => acc + (s.quantity || 0), 0);
    const totalRegisteredQty = lotSales.filter(s => !s.isWalkIn).reduce((acc, s) => acc + (s.quantity || 0), 0);
    const remainingQty = stock.remainingQuantity !== undefined ? stock.remainingQuantity : Math.max(0, arrivedQty - totalSoldQty);

    const rawGrossTurnover = lotSales.reduce((acc, s) => acc + (s.grossSale || (s.quantity * s.saleRate) || 0), 0);
    const returnedGrossValue = lotReturns.reduce((acc, r) => acc + (Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0))), 0);
    const grossTurnover = Math.max(0, Math.round((rawGrossTurnover - returnedGrossValue) * 100) / 100);

    // Calculate raw customer commission and subtract reversed return commission
    const rawBuyerCommission = lotSales.reduce((acc, s) => acc + (s.commissionAmount || s.commission || 0), 0);
    const returnedBuyerCommission = lotReturns.reduce((acc, r) => {
      let rev = Number(r.commissionReversedAmount) || 0;
      if (!rev && Number(r.produceReturnedQty) > 0) {
        const matchingSale = lotSales.find(s => String(s.id || s._id) === String(r.saleId));
        if (matchingSale && matchingSale.quantity > 0 && matchingSale.commissionAmount > 0) {
          rev = Number(r.produceReturnedQty) * (Number(matchingSale.commissionAmount) / Number(matchingSale.quantity));
        } else {
          const commRate = parseFloat(String(r.commissionRate || 0).replace(/[^\d.]/g, '')) || 0;
          const retGross = Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0));
          rev = retGross * (commRate / 100);
        }
      }
      return acc + (rev || 0);
    }, 0);
    const totalCommission = Math.max(0, Math.round((rawBuyerCommission - returnedBuyerCommission) * 100) / 100);

    const status = remainingQty === 0 ? 'Closed' : 'Active Trading';

    // Group sales date-wise and adjust for returns
    const dateGroupsMap = lotSales.reduce((acc, sale) => {
      const sDate = sale.date || (sale.createdAt ? new Date(sale.createdAt).toISOString().split('T')[0] : 'Unknown Date');
      if (!acc[sDate]) {
        acc[sDate] = {
          date: sDate,
          sales: [],
          totalQty: 0,
          walkInQty: 0,
          registeredQty: 0,
          grossValue: 0,
          commission: 0
        };
      }
      acc[sDate].sales.push(sale);
      const qty = sale.quantity || 0;
      acc[sDate].totalQty += qty;
      if (sale.isWalkIn) {
        acc[sDate].walkInQty += qty;
      } else {
        acc[sDate].registeredQty += qty;
      }
      acc[sDate].grossValue += (sale.grossSale || (sale.quantity * sale.saleRate) || 0);
      acc[sDate].commission += (sale.commissionAmount || sale.commission || 0);
      return acc;
    }, {});

    // Deduct returns from corresponding date group
    lotReturns.forEach(r => {
      const matchingSale = lotSales.find(s => String(s.id || s._id) === String(r.saleId));
      const rDate = matchingSale?.date || r.date || 'Unknown Date';
      const rQty = Number(r.produceReturnedQty) || 0;
      const rGross = Number(r.grossReturnAmount) || (rQty * Number(r.saleRate || 0));
      let rComm = Number(r.commissionReversedAmount) || 0;
      if (!rComm && rQty > 0) {
        if (matchingSale && matchingSale.quantity > 0 && matchingSale.commissionAmount > 0) {
          rComm = rQty * (Number(matchingSale.commissionAmount) / Number(matchingSale.quantity));
        } else {
          const commRate = parseFloat(String(r.commissionRate || 0).replace(/[^\d.]/g, '')) || 0;
          rComm = rGross * (commRate / 100);
        }
      }

      if (dateGroupsMap[rDate]) {
        dateGroupsMap[rDate].totalQty = Math.max(0, dateGroupsMap[rDate].totalQty - rQty);
        dateGroupsMap[rDate].grossValue = Math.max(0, dateGroupsMap[rDate].grossValue - rGross);
        dateGroupsMap[rDate].commission = Math.max(0, Math.round((dateGroupsMap[rDate].commission - rComm) * 100) / 100);
      } else {
        const altDate = r.date || 'Unknown Date';
        if (dateGroupsMap[altDate]) {
          dateGroupsMap[altDate].totalQty = Math.max(0, dateGroupsMap[altDate].totalQty - rQty);
          dateGroupsMap[altDate].grossValue = Math.max(0, dateGroupsMap[altDate].grossValue - rGross);
          dateGroupsMap[altDate].commission = Math.max(0, Math.round((dateGroupsMap[altDate].commission - rComm) * 100) / 100);
        }
      }
    });

    const sortedDateGroups = Object.values(dateGroupsMap).sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      ...stock,
      stock,
      stockEntryId,
      lotNumber,
      arrivalDate: stock.arrivalDate || stock.date || 'N/A',
      supplier,
      product,
      arrivedQty,
      totalSoldQty,
      totalWalkInQty,
      totalRegisteredQty,
      remainingQty,
      grossTurnover,
      totalCommission,
      status,
      lotSales,
      salesCount: lotSales.length,
      dateGroups: sortedDateGroups
    };
  });

  // Append virtual lots for orphan sales if any exist
  sales.forEach(sale => {
    if (sale.stockEntryId && !existingStockIds.has(sale.stockEntryId)) {
      existingStockIds.add(sale.stockEntryId);
      const stockEntryId = sale.stockEntryId;
      const lotNumber = sale.stockLotNumber || stockEntryId.substring(0, 8).toUpperCase();
      const lotSales = sales.filter(s => s.stockEntryId === stockEntryId);
      
      const lotReturns = returns.filter(r => {
        const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
        const stockIdStr = stockEntryId ? String(stockEntryId) : null;
        const rSaleId = r.saleId ? String(r.saleId) : null;
        const matchesStock = (rStockId && stockIdStr && rStockId === stockIdStr);
        const matchesSale = rSaleId && lotSales.some(s => String(s.id || s._id) === rSaleId);
        return (matchesStock || matchesSale) && (r.status === 'Approved') && (!r.isDeleted);
      });

      const rawSoldQty = lotSales.reduce((acc, s) => acc + (s.quantity || 0), 0);
      const returnedQty = lotReturns.reduce((acc, r) => acc + (Number(r.produceReturnedQty) || 0), 0);
      const totalSoldQty = Math.max(0, rawSoldQty - returnedQty);

      const rawGrossTurnover = lotSales.reduce((acc, s) => acc + (s.grossSale || (s.quantity * s.saleRate) || 0), 0);
      const returnedGrossValue = lotReturns.reduce((acc, r) => acc + (Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0))), 0);
      const grossTurnover = Math.max(0, Math.round((rawGrossTurnover - returnedGrossValue) * 100) / 100);

      const rawBuyerCommission = lotSales.reduce((acc, s) => acc + (s.commissionAmount || s.commission || 0), 0);
      const returnedBuyerCommission = lotReturns.reduce((acc, r) => {
        let rev = Number(r.commissionReversedAmount) || 0;
        if (!rev && Number(r.produceReturnedQty) > 0) {
          const matchingSale = lotSales.find(s => String(s.id || s._id) === String(r.saleId));
          if (matchingSale && matchingSale.quantity > 0 && matchingSale.commissionAmount > 0) {
            rev = Number(r.produceReturnedQty) * (Number(matchingSale.commissionAmount) / Number(matchingSale.quantity));
          } else {
            const commRate = parseFloat(String(r.commissionRate || 0).replace(/[^\d.]/g, '')) || 0;
            const retGross = Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0));
            rev = retGross * (commRate / 100);
          }
        }
        return acc + (rev || 0);
      }, 0);
      const totalCommission = Math.max(0, Math.round((rawBuyerCommission - returnedBuyerCommission) * 100) / 100);

      const dateGroupsMap = lotSales.reduce((acc, s) => {
        const sDate = s.date || 'Unknown Date';
        if (!acc[sDate]) {
          acc[sDate] = {
            date: sDate,
            sales: [],
            totalQty: 0,
            walkInQty: 0,
            registeredQty: 0,
            grossValue: 0,
            commission: 0
          };
        }
        acc[sDate].sales.push(s);
        const qty = s.quantity || 0;
        acc[sDate].totalQty += qty;
        if (s.isWalkIn) acc[sDate].walkInQty += qty;
        else acc[sDate].registeredQty += qty;
        acc[sDate].grossValue += (s.grossSale || (s.quantity * s.saleRate) || 0);
        acc[sDate].commission += (s.commissionAmount || s.commission || 0);
        return acc;
      }, {});

      // Deduct returns from date groups
      lotReturns.forEach(r => {
        const matchingSale = lotSales.find(s => String(s.id || s._id) === String(r.saleId));
        const rDate = matchingSale?.date || r.date || 'Unknown Date';
        const rQty = Number(r.produceReturnedQty) || 0;
        const rGross = Number(r.grossReturnAmount) || (rQty * Number(r.saleRate || 0));
        let rComm = Number(r.commissionReversedAmount) || 0;
        if (!rComm && rQty > 0) {
          if (matchingSale && matchingSale.quantity > 0 && matchingSale.commissionAmount > 0) {
            rComm = rQty * (Number(matchingSale.commissionAmount) / Number(matchingSale.quantity));
          } else {
            const commRate = parseFloat(String(r.commissionRate || 0).replace(/[^\d.]/g, '')) || 0;
            rComm = rGross * (commRate / 100);
          }
        }

        if (dateGroupsMap[rDate]) {
          dateGroupsMap[rDate].totalQty = Math.max(0, dateGroupsMap[rDate].totalQty - rQty);
          dateGroupsMap[rDate].grossValue = Math.max(0, dateGroupsMap[rDate].grossValue - rGross);
          dateGroupsMap[rDate].commission = Math.max(0, Math.round((dateGroupsMap[rDate].commission - rComm) * 100) / 100);
        } else {
          const altDate = r.date || 'Unknown Date';
          if (dateGroupsMap[altDate]) {
            dateGroupsMap[altDate].totalQty = Math.max(0, dateGroupsMap[altDate].totalQty - rQty);
            dateGroupsMap[altDate].grossValue = Math.max(0, dateGroupsMap[altDate].grossValue - rGross);
            dateGroupsMap[altDate].commission = Math.max(0, Math.round((dateGroupsMap[altDate].commission - rComm) * 100) / 100);
          }
        }
      });

      stockLotsMap.push({
        stockEntryId,
        lotNumber,
        arrivalDate: sale.date || 'N/A',
        supplier: { name: sale.supplierName || 'Farmer Supplier', phone: '' },
        product: { name: sale.productName || 'Commodity', unit: 'crates' },
        arrivedQty: totalSoldQty,
        totalSoldQty,
        totalWalkInQty: lotSales.filter(s => s.isWalkIn).reduce((acc, s) => acc + (s.quantity || 0), 0),
        totalRegisteredQty: lotSales.filter(s => !s.isWalkIn).reduce((acc, s) => acc + (s.quantity || 0), 0),
        remainingQty: 0,
        grossTurnover,
        totalCommission,
        status: 'Closed',
        lotSales,
        salesCount: lotSales.length,
        dateGroups: Object.values(dateGroupsMap)
      });
    }
  });

  // Filter Lot Records
  const filteredLots = stockLotsMap.filter(lot => {
    // Quick search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const lotMatch = lot.lotNumber?.toLowerCase().includes(term) || lot.stockEntryId?.toLowerCase().includes(term);
      const prodMatch = lot.product?.name?.toLowerCase().includes(term);
      const supMatch = lot.supplier?.name?.toLowerCase().includes(term);
      const salesMatch = lot.lotSales.some(s => 
        (s.customerName || s.walkInName || '').toLowerCase().includes(term) ||
        (s.invoiceNumber || s.id || '').toLowerCase().includes(term)
      );
      if (!lotMatch && !prodMatch && !supMatch && !salesMatch) return false;
    }

    return true;
  });

  // Open lot in new window
  const handleOpenLotWindow = (stockEntryId) => {
    openReportInNewTab('lot-details', { lotId: stockEntryId });
  };

  // Check / Uncheck all rows
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(filteredLots.map(l => l.stockEntryId));
    } else {
      setSelectedRows([]);
    }
  };

  // Check / Uncheck individual row
  const handleSelectRow = (id) => {
    if (selectedRows.includes(id)) {
      setSelectedRows(selectedRows.filter(rId => rId !== id));
    } else {
      setSelectedRows([...selectedRows, id]);
    }
  };

  // Reset search
  const resetFilters = () => {
    setSearchTerm('');
  };

  // Export Lots to CSV
  const handleExportCSV = () => {
    const dataToExport = filteredLots.filter(l => selectedRows.length === 0 || selectedRows.includes(l.stockEntryId));
    if (dataToExport.length === 0) {
      alert('No data to export.');
      return;
    }

    const headers = [
      'Lot Number', 'Arrival Date', 'Commodity', 'Supplier', 'Arrived Qty', 
      'Total Sold Qty', 'Walk-In Sold Qty', 'Registered Sold Qty', 'Remaining Stock', 
      'Gross Sales Turnover (Rs.)', 'Commission (Rs.)', 'Lot Status'
    ];

    const rows = dataToExport.map(l => [
      l.lotNumber,
      l.arrivalDate,
      l.product?.name || '',
      l.supplier?.name || '',
      l.arrivedQty,
      l.totalSoldQty,
      l.totalWalkInQty,
      l.totalRegisteredQty,
      l.remainingQty,
      l.grossTurnover,
      l.totalCommission,
      l.status
    ]);

    const csvContent = [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `consignment_lots_ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Trigger Print of the lot list
  const handlePrintList = () => {
    const printWindow = window.open('', '_blank');
    const dataToPrint = filteredLots.filter(l => selectedRows.length === 0 || selectedRows.includes(l.stockEntryId));

    let html = `
      <html>
      <head>
        <title>Mandi Trade Ledger - Sold Consignment Lots Report</title>
        <style>
          body { font-family: 'Inter', sans-serif; padding: 20px; color: #333; }
          h2 { text-transform: uppercase; border-bottom: 2px solid #4F46E5; padding-bottom: 10px; color: #4F46E5; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 10px; }
          th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          th { background-color: #f2f2f2; font-weight: bold; }
          .text-right { text-align: right; }
          .footer { margin-top: 30px; font-size: 10px; text-align: center; opacity: 0.7; }
        </style>
      </head>
      <body>
        <h2>🥦 Consignment Lots Ledger Master Sheet</h2>
        <p>Report Generated on: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Lot Number</th>
              <th>Arrival Date</th>
              <th>Commodity</th>
              <th>Farmer Supplier</th>
              <th class="text-right">Arrived Qty</th>
              <th class="text-right">Total Sold Qty</th>
              <th class="text-right">Remaining Stock</th>
              <th class="text-right">Gross Turnover</th>
              <th class="text-right">Commission</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
    `;

    let totalArrived = 0;
    let totalSold = 0;
    let totalGross = 0;
    let totalComm = 0;

    dataToPrint.forEach(l => {
      totalArrived += l.arrivedQty;
      totalSold += l.totalSoldQty;
      totalGross += l.grossTurnover;
      totalComm += l.totalCommission;

      html += `
        <tr>
          <td>${l.lotNumber}</td>
          <td>${l.arrivalDate}</td>
          <td>${l.product?.name || 'Commodity'}</td>
          <td>${l.supplier?.name || 'Supplier'}</td>
          <td class="text-right">${l.arrivedQty}</td>
          <td class="text-right">${l.totalSoldQty}</td>
          <td class="text-right">${l.remainingQty}</td>
          <td class="text-right">Rs. ${(l.grossTurnover || 0).toLocaleString()}</td>
          <td class="text-right">Rs. ${(l.totalCommission || 0).toLocaleString()}</td>
          <td>${l.status}</td>
        </tr>
      `;
    });

    html += `
          <tr style="font-weight: bold; background-color: #f9f9f9;">
            <td colspan="4">GRAND TOTALS</td>
            <td class="text-right">${totalArrived}</td>
            <td class="text-right">${totalSold}</td>
            <td>-</td>
            <td class="text-right">Rs. ${(totalGross || 0).toLocaleString()}</td>
            <td class="text-right">Rs. ${(totalComm || 0).toLocaleString()}</td>
            <td>-</td>
          </tr>
        </tbody>
      </table>
      <div class="footer">
        Lahore Sabzi & Fruit Mandi Commission Brokerage Platform • Authorized Copy
      </div>
      </body>
      </html>
    `;

    printHTMLInExistingWindow(html);
  };

  const printHTMLInExistingWindow = (html) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.top = '-9999px';
    iframe.style.left = '-9999px';
    iframe.style.width = '800px';
    iframe.style.height = '1000px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      try {
        win.focus();
        win.print();
      } catch (err) {
        console.error("Print error in hidden iframe:", err);
      }
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 2000);
    }, 400);
  };

  const generateVoucherInnerBody = (lot) => {
    if (!lot) return '';
    const lotSales = lot.lotSales || sales.filter(s => s.stockEntryId === lot.stockEntryId);
    const activeStock = lot.stock || stockEntries.find(s => (s.id || s._id) === lot.stockEntryId) || {};
    const supplierObj = lot.supplier || {};

    const lotReturns = returns.filter(r => {
      const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
      const targetId = String(lot.stockEntryId || lot.id || lot._id);
      return (rStockId && targetId && rStockId === targetId) && (r.status === 'Approved') && (!r.isDeleted);
    });

    let rawQtySum = 0;
    let rawGrossSum = 0;
    let lotCommSum = 0;
    let lotDiscSum = 0;
    let lotNetSum = 0;

    const salesRowsHtml = lotSales.map(s => {
      const qty = s.quantity || 0;
      const invNum = s.invoiceNumber || (s.id || s._id || '').substring(0, 8).toUpperCase();
      const gross = s.grossSale || (qty * (s.saleRate || 0)) || 0;
      const comm = s.commissionAmount || s.commission || 0;
      const disc = s.discount || 0;
      const net = s.netSale || s.totalAmount || (gross - comm - disc);

      rawQtySum += qty;
      rawGrossSum += gross;
      lotCommSum += comm;
      lotDiscSum += disc;
      lotNetSum += net;

      return `
        <tr>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">INV-${invNum}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${s.date || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${s.customerName || s.walkInName || 'Walk-In'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0;">${s.isWalkIn ? 'Walk-In' : 'Registered'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">${qty}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">Rs. ${(s.saleRate || 0).toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">Rs. ${gross.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">Rs. ${comm.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right;">Rs. ${disc.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #E2E8F0; text-align: right; font-weight: 700;">Rs. ${net.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const totalRetQty = lotReturns.reduce((acc, r) => acc + (Number(r.produceReturnedQty) || 0), 0);
    const totalRetGross = lotReturns.reduce((acc, r) => acc + (Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0))), 0);

    const lotGrossSum = Math.max(0, Math.round((rawGrossSum - totalRetGross) * 100) / 100);
    const lotQtySum = Math.max(0, rawQtySum - totalRetQty);

    const returnsRowsHtml = lotReturns.map(r => {
      const rGross = Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0));
      return `
        <tr style="color: #DC2626; background: #FEF2F2;">
          <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.returnNumber || 'RET'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.date || 'N/A'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA;">${r.customerName || 'Customer Return'}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA;">Produce Return</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right;">-${r.produceReturnedQty || 0}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right;">Rs. ${(r.saleRate || 0).toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right; font-weight: bold;">-Rs. ${rGross.toLocaleString()}</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right;">-</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right;">-</td>
          <td style="padding: 8px; border-bottom: 1px solid #FECACA; text-align: right; font-weight: 700;">-Rs. ${rGross.toLocaleString()}</td>
        </tr>
      `;
    }).join('');

    const commType = activeStock.supplierCommissionType || 'Percentage';
    const commVal = activeStock.supplierCommissionValue || 0;
    
    let suppCommAmt = 0;
    if (commType === 'Percentage') suppCommAmt = lotGrossSum * (commVal / 100);
    else if (commType === 'Per Unit') suppCommAmt = lotQtySum * commVal;
    else if (commType === 'Fixed Amount') suppCommAmt = commVal;

    const marketFeeRate = Number(activeStock.marketFeeRate || activeStock.marketFeePercentage || 0);
    let marketFeeAmt = 0;
    if (activeStock.marketFeeAmount) {
      marketFeeAmt = Number(activeStock.marketFeeAmount);
    } else if (marketFeeRate > 0) {
      marketFeeAmt = Math.round((lotGrossSum * (marketFeeRate / 100)) * 100) / 100;
    }

    const lotExpObj = activeStock.lotExpenses || {};
    let expRowsHtml = '';
    let totalExpAmt = 0;

    Object.entries(lotExpObj).forEach(([catName, amt]) => {
      const val = Number(amt) || 0;
      if (val > 0) {
        totalExpAmt += val;
        expRowsHtml += `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; border-bottom: 1px dashed #CBD5E1;">
            <span>${catName}:</span>
            <strong>Rs. ${val.toLocaleString()}</strong>
          </div>
        `;
      }
    });

    const totalDeductions = Math.round((suppCommAmt + marketFeeAmt + totalExpAmt) * 100) / 100;
    const netPayableToSupplier = Math.round((lotGrossSum - totalDeductions) * 100) / 100;

    const bizName = businessProfile?.businessName || businessProfile?.name || 'Sabzi & Fruit Mandi Trade Brokerage';
    const bizOwner = businessProfile?.ownerName ? `Proprietor: ${businessProfile.ownerName}` : '';
    const bizPhone = [businessProfile?.mobileNumber, businessProfile?.whatsAppNumber].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' / ');
    const bizAddr = [businessProfile?.address, businessProfile?.city].filter(Boolean).join(', ') || 'Mandi OS Platform, Pakistan';
    const bizCode = businessProfile?.businessCode || businessProfile?.arthiCode || 'MR-01';

    return `
      <div style="font-family: 'Inter', system-ui, sans-serif; color: #1E293B;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #E2E8F0; padding-bottom: 15px; margin-bottom: 20px;">
          <div>
            <div style="display: flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 900; color: #4F46E5;">
              <img src="${businessProfile?.logo || '/mandi_logo.jpg'}" alt="Logo" style="height: 36px; border-radius: 4px; object-fit: contain;" onError="this.style.display='none'" />
              <span>${bizName.toUpperCase()}</span>
            </div>
            <div style="margin: 3px 0 0 0; color: #334155; font-size: 11px; font-weight: 600;">
              ${bizOwner ? `<span>${bizOwner}</span> • ` : ''}
              ${bizPhone ? `<span>📞 ${bizPhone}</span> • ` : ''}
              <span>📍 ${bizAddr}</span>
            </div>
            <p style="margin: 2px 0 0 0; color: #64748B; font-size: 10px; font-family: monospace;">Arthi Reg Code: <strong>${bizCode}</strong></p>
          </div>
          <div style="text-align: right;">
            <h2 style="margin: 0; font-size: 15px; color: #1E293B; text-transform: uppercase; font-weight: 900;">CONSIGNMENT LOT SETTLEMENT VOUCHER</h2>
            <p style="margin: 4px 0 0 0; font-size: 12px;">Lot No: <span style="background: #EEF2F6; padding: 4px 10px; border-radius: 6px; font-weight: 800; font-family: monospace;">#${lot.lotNumber}</span></p>
            <p style="margin: 2px 0 0 0; font-size: 10px; color: #64748B;">Issued: ${new Date().toLocaleDateString()}</p>
          </div>
        </div>

        <div style="display: grid; grid-template-cols: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 10px; font-size: 11px;">
            <h3 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 10px; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; font-weight: 800;">Consignment & Supplier Profile</h3>
            <p style="margin: 3px 0;"><strong>Supplier Name:</strong> ${supplierObj.name || lot.supplierName || 'N/A'}</p>
            <p style="margin: 3px 0;"><strong>Contact Phone:</strong> ${supplierObj.phone || 'N/A'}</p>
            <p style="margin: 3px 0;"><strong>Commodity Produce:</strong> ${lot.productName}</p>
            <p style="margin: 3px 0;"><strong>Arrival Date:</strong> ${activeStock.date || activeStock.arrivalDate || 'N/A'}</p>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 12px; border-radius: 10px; font-size: 11px;">
            <h3 style="margin: 0 0 8px 0; text-transform: uppercase; font-size: 10px; color: #64748B; border-bottom: 1px solid #E2E8F0; padding-bottom: 4px; font-weight: 800;">Inventory Disposal Summary</h3>
            <p style="margin: 3px 0;"><strong>Initial Received Qty:</strong> ${activeStock.quantity || lot.arrivedQty || 0} units</p>
            <p style="margin: 3px 0;"><strong>Disposed / Sold Qty:</strong> ${lotQtySum} units</p>
            <p style="margin: 3px 0;"><strong>Remaining Balance:</strong> ${activeStock.remainingQuantity !== undefined ? activeStock.remainingQuantity : Math.max(0, (activeStock.quantity || 0) - lotQtySum)} units</p>
            <p style="margin: 3px 0;"><strong>Settlement Status:</strong> ${activeStock.isSettled ? '<span style="color: #059669; font-weight: 800;">✓ Recorded to Payables</span>' : '<span style="color: #D97706; font-weight: 700;">Pending Settlement</span>'}</p>
          </div>
        </div>

        <h3 style="text-transform: uppercase; font-size: 11px; border-bottom: 2px solid #E2E8F0; padding-bottom: 5px; margin-bottom: 8px; color: #334155; font-weight: 800;">Customer Trades & Invoices Log</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 20px;">
          <thead>
            <tr style="background: #F8FAFC; text-transform: uppercase; font-size: 9px; color: #64748B; border-bottom: 2px solid #E2E8F0;">
              <th style="padding: 8px; text-align: left;">Invoice No</th>
              <th style="padding: 8px; text-align: left;">Date</th>
              <th style="padding: 8px; text-align: left;">Buyer Name</th>
              <th style="padding: 8px; text-align: left;">Buyer Type</th>
              <th style="padding: 8px; text-align: right;">Qty</th>
              <th style="padding: 8px; text-align: right;">Rate</th>
              <th style="padding: 8px; text-align: right;">Gross Value</th>
              <th style="padding: 8px; text-align: right;">Comm.</th>
              <th style="padding: 8px; text-align: right;">Discount</th>
              <th style="padding: 8px; text-align: right;">Net Value</th>
            </tr>
          </thead>
          <tbody>
            ${salesRowsHtml || '<tr><td colspan="10" style="padding: 12px; text-align: center; color: #94A3B8;">No sales recorded for this lot yet.</td></tr>'}
            ${returnsRowsHtml}
            <tr style="font-weight: 800; background: #EEF2F6; border-top: 2px solid #CBD5E1;">
              <td colspan="4" style="padding: 8px;">NET TOTALS FOR LOT #${lot.lotNumber} (Sales - Returns)</td>
              <td style="padding: 8px; text-align: right;">${lotQtySum}</td>
              <td style="padding: 8px; text-align: right;">-</td>
              <td style="padding: 8px; text-align: right;">Rs. ${lotGrossSum.toLocaleString()}</td>
              <td style="padding: 8px; text-align: right;">Rs. ${lotCommSum.toLocaleString()}</td>
              <td style="padding: 8px; text-align: right;">Rs. ${lotDiscSum.toLocaleString()}</td>
              <td style="padding: 8px; text-align: right; color: #4F46E5;">Rs. ${(lotGrossSum - lotDiscSum).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        <div style="border: 2px solid #6366F1; background: #EEF2FF; border-radius: 12px; padding: 15px; margin-top: 20px;">
          <h3 style="margin: 0 0 10px 0; color: #4338CA; font-size: 12px; text-transform: uppercase; font-weight: 900; border-bottom: 1px solid #C7D2FE; padding-bottom: 5px;">Supplier Settlement & Deductions Breakdown</h3>
          <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0;">
            <span>Gross Consignment Sales Value (Credit):</span>
            <strong>Rs. ${lotGrossSum.toLocaleString()}</strong>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #C7D2FE;">
            <span>Supplier Brokerage Commission (${commVal} ${commType === 'Percentage' ? '%' : commType === 'Per Unit' ? 'per unit' : 'fixed'}):</span>
            <strong style="color: #DC2626;">- Rs. ${Math.round(suppCommAmt).toLocaleString()}</strong>
          </div>
          
          ${marketFeeAmt > 0 ? `
            <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-bottom: 1px dashed #C7D2FE;">
              <span>Market / Sarkari Fee (${marketFeeRate}%):</span>
              <strong style="color: #DC2626;">- Rs. ${Math.round(marketFeeAmt).toLocaleString()}</strong>
            </div>
          ` : ''}

          ${expRowsHtml ? `
            <div style="margin: 8px 0; padding-left: 10px; font-size: 10px; color: #475569;">
              <div style="font-weight: bold; margin-bottom: 4px;">Lot Expense Deductions:</div>
              ${expRowsHtml}
            </div>
          ` : ''}

          <div style="display: flex; justify-content: space-between; font-size: 11px; padding: 4px 0; border-top: 1px solid #C7D2FE; margin-top: 5px;">
            <span>Total Supplier Deductions:</span>
            <strong style="color: #DC2626;">- Rs. ${totalDeductions.toLocaleString()}</strong>
          </div>

          <div style="display: flex; justify-content: space-between; font-weight: 900; font-size: 14px; padding: 8px 0; color: #1E1B4B; border-top: 2px solid #6366F1; margin-top: 6px;">
            <span>NET PAYABLE TO SUPPLIER:</span>
            <span style="color: #059669;">Rs. ${netPayableToSupplier.toLocaleString()}</span>
          </div>
        </div>

        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px;">
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #94A3B8; margin-bottom: 5px; height: 25px;"></div>
            <span style="font-size: 10px; font-weight: 700; color: #475569;">Mandi Clerk Signature</span>
          </div>
          <div style="text-align: center; width: 180px;">
            <div style="border-bottom: 1px solid #94A3B8; margin-bottom: 5px; height: 25px;"></div>
            <span style="font-size: 10px; font-weight: 700; color: #475569;">Authorized Stamp & Signature</span>
          </div>
        </div>
      </div>
    `;
  };

  const buildVoucherHTML = (lot) => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Professional Lot Voucher - Lot #${lot?.lotNumber || ''}</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; padding: 25px; margin: 0; background: #fff; color: #1E293B; }
          @media print {
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        ${generateVoucherInnerBody(lot)}
      </body>
      </html>
    `;
  };

  // Trigger print of an individual Lot inspector report
  const handlePrintLot = (lot) => {
    if (!lot) return;
    setVoucherPreviewLot(lot);
    setTimeout(() => {
      window.print();
    }, 200);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-3">
        <div className="w-10 h-10 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest opacity-60">Loading Sold Consignments Archives...</p>
      </div>
    );
  }

  // Find lot details view if a lot has been inspected
  const lotDetails = selectedLot ? stockLotsMap.find(l => l.stockEntryId === selectedLot) : null;
  const lotSalesList = lotDetails ? (lotDetails.lotSales || []) : [];
  const lotReturnsList = selectedLot ? returns.filter(r => {
    const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
    const sId = String(selectedLot);
    const rSaleId = r.saleId ? String(r.saleId) : null;
    const matchesStock = (rStockId && sId && rStockId === sId);
    const matchesSale = rSaleId && lotSalesList.some(s => String(s.id || s._id) === rSaleId);
    return (matchesStock || matchesSale) && (r.status === 'Approved') && (!r.isDeleted);
  }) : [];
  
  // Derive Lot Financial Settlement Calculations
  const rawLotGrossSales = lotSalesList.reduce((acc, curr) => acc + (Number(curr.grossSale) || (Number(curr.quantity || 0) * Number(curr.saleRate || 0)) || 0), 0);
  const rawLotQtySold = lotSalesList.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  
  const lotReturnedGross = lotReturnsList.reduce((acc, curr) => acc + (Number(curr.grossReturnAmount) || (Number(curr.produceReturnedQty || 0) * Number(curr.saleRate || 0))), 0);
  const lotReturnedQty = lotReturnsList.reduce((acc, curr) => acc + (Number(curr.produceReturnedQty) || 0), 0);

  // Net lot gross sales & net sold crates after deducting returned stock value
  const lotGrossSales = Math.max(0, Math.round((rawLotGrossSales - lotReturnedGross) * 100) / 100);
  const lotQtySold = Math.max(0, rawLotQtySold - lotReturnedQty);

  const rawLotBuyerComm = lotSalesList.reduce((acc, curr) => acc + (Number(curr.commissionAmount) || Number(curr.commission) || 0), 0);
  const lotReturnedBuyerComm = lotReturnsList.reduce((acc, r) => {
    let rev = Number(r.commissionReversedAmount) || 0;
    if (!rev && Number(r.produceReturnedQty) > 0) {
      const matchingSale = lotSalesList.find(s => String(s.id || s._id) === String(r.saleId));
      if (matchingSale && matchingSale.quantity > 0 && matchingSale.commissionAmount > 0) {
        rev = Number(r.produceReturnedQty) * (Number(matchingSale.commissionAmount) / Number(matchingSale.quantity));
      } else {
        const commRate = parseFloat(String(r.commissionRate || 0).replace(/[^\d.]/g, '')) || 0;
        const retGross = Number(r.grossReturnAmount) || (Number(r.produceReturnedQty || 0) * Number(r.saleRate || 0));
        rev = retGross * (commRate / 100);
      }
    }
    return acc + (rev || 0);
  }, 0);
  const lotBuyerComm = Math.max(0, Math.round((rawLotBuyerComm - lotReturnedBuyerComm) * 100) / 100);

  const commValNum = Number(lotFinCommValue) || 0;
  let computedSupplierCommDeduction = 0;
  if (lotFinCommType === 'Percentage') {
    computedSupplierCommDeduction = lotGrossSales * (commValNum / 100);
  } else if (lotFinCommType === 'Per Unit') {
    computedSupplierCommDeduction = lotQtySold * commValNum;
  } else if (lotFinCommType === 'Fixed Amount') {
    computedSupplierCommDeduction = commValNum;
  }
  computedSupplierCommDeduction = Math.round(computedSupplierCommDeduction * 100) / 100;

  // Market / Sarkari Fee calculation (Percentage of Gross Sales)
  const marketFeeRateNum = Number(lotFinMarketFee) || 0;
  const computedMarketFeeDeduction = Math.round((lotGrossSales * (marketFeeRateNum / 100)) * 100) / 100;

  const totalBrokerCommission = Math.round((lotBuyerComm + computedSupplierCommDeduction) * 100) / 100;

  let computedTotalExpenses = 0;
  if (lotFinExpenses && typeof lotFinExpenses === 'object') {
    Object.values(lotFinExpenses).forEach(val => {
      const num = Number(val);
      if (!isNaN(num) && num > 0) {
        computedTotalExpenses += num;
      }
    });
  }
  computedTotalExpenses = Math.round(computedTotalExpenses * 100) / 100;

  const computedTotalDeductions = Math.round((computedSupplierCommDeduction + computedMarketFeeDeduction + computedTotalExpenses) * 100) / 100;
  const computedNetPayable = Math.round((lotGrossSales - computedTotalDeductions) * 100) / 100;

  // Save lot financials handler
  const handleSaveLotFinancials = async () => {
    if (!selectedLot) return;
    if (lotDetails?.isSettled) {
      setLotFinMessage({ text: 'This consignment lot is already settled & recorded to payables. Settlement configuration is locked.', type: 'error' });
      return;
    }
    setSavingLotFin(true);
    setLotFinMessage(null);
    try {
      const res = await api.put(`/stock/${selectedLot}/lot-financials`, {
        supplierCommissionType: lotFinCommType,
        supplierCommissionValue: Number(lotFinCommValue) || 0,
        marketFeeRate: Number(lotFinMarketFee) || 0,
        lotExpenses: lotFinExpenses
      });
      setLotFinMessage({ text: 'Supplier Lot Settlement configuration saved successfully!', type: 'success' });
      // Refresh stock entries list
      const stockRes = await api.get('/stock');
      setStockEntries(stockRes.data || []);
    } catch (err) {
      setLotFinMessage({ text: err.response?.data?.error || 'Failed to save lot financial settlement', type: 'error' });
    } finally {
      setSavingLotFin(false);
    }
  };

  // Record lot settlement handler (calculates applicable amount, adds to Outstanding Payables & Supplier Supply Value)
  const handleRecordLotSettlement = async () => {
    if (!selectedLot) return;
    if (lotDetails?.isSettled) {
      alert('This consignment lot settlement has already been recorded to Outstanding Payables and Supplier Supply Value.');
      return;
    }
    setRecordingSettlement(true);
    setLotFinMessage(null);
    try {
      const res = await api.post(`/stock/${selectedLot}/record-settlement`, {
        supplierCommissionType: lotFinCommType,
        supplierCommissionValue: Number(lotFinCommValue) || 0,
        marketFeeRate: Number(lotFinMarketFee) || 0,
        lotExpenses: lotFinExpenses
      });
      setLotFinMessage({ 
        text: res.data.message || `Successfully recorded Rs. ${res.data.applicableAmount?.toLocaleString()} to Outstanding Payables and Supplier Supply Value!`, 
        type: 'success' 
      });
      // Refresh stock entries and master data
      await fetchData();
    } catch (err) {
      setLotFinMessage({ 
        text: err.response?.data?.error || 'Failed to record lot settlement', 
        type: 'error' 
      });
    } finally {
      setRecordingSettlement(false);
    }
  };
  
  // Calculate inventory movement timeline for details view
  const lotInventoryMovements = [];
  if (lotDetails && lotDetails.stock) {
    // Start with stock entry arrival
    lotInventoryMovements.push({
      date: lotDetails.stock.date,
      type: 'Arrival',
      qty: lotDetails.stock.quantity,
      runningQty: lotDetails.stock.quantity,
      partyName: lotDetails.supplier.name || 'Farmer Supplier',
      ref: `RECV-${lotDetails.stockEntryId?.substring(0, 5)}`
    });

    let running = lotDetails.stock.quantity;
    // Stagger sales sorted by date/createdAt
    const sortedLotSales = [...lotSalesList].sort((a, b) => new Date(a.createdAt || a.date) - new Date(b.createdAt || b.date));
    
    sortedLotSales.forEach(s => {
      running -= s.quantity;
      lotInventoryMovements.push({
        date: s.date,
        type: 'Sale',
        qty: -s.quantity,
        runningQty: running,
        partyName: s.customerName || s.walkInName || 'Walk-In',
        ref: `INV-${(s.id || s._id).substring(0, 5)}`
      });
    });
  }

  // Get matching ledger entries for details view
  const lotLedgerEntries = ledgerEntries.filter(l => l.description?.includes(selectedLot) || l.partyId === lotDetails?.stock?.supplierId);

  // Get audit logs for details view
  const lotAuditLogs = auditLogs.filter(a => a.details?.includes(selectedLot) || (lotDetails?.id && a.details?.includes(lotDetails.id)));

  return (
    <>
      <div className="space-y-6 max-w-7xl mx-auto pb-12 no-print-main">
      
      {/* Dynamic Tab Switching depending on if we are in Lot Inspector view */}
      {!selectedLot ? (
        <>
          {/* Dashboard Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                🥦 Sold Consignments Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Audit, track, export, and print completed consignment sales across all stock lots and suppliers
              </p>
            </div>
            
            {/* Master Actions */}
            <div className="flex items-center gap-2.5">
              {/* commented code for sold consigment ledger report */}
              {/* <button
                onClick={() => openReportInNewTab('consignment-report')}
                className="flex items-center space-x-1.5 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
              >
                <Printer size={15} />
                <span>Print Ledger Report</span>
              </button> */}
              
              <button
                onClick={handleExportCSV}
                className="flex items-center space-x-1.5 bg-[#4F46E5] hover:bg-opacity-90 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/10"
              >
                <Download size={15} />
                <span>Export Ledger (CSV)</span>
              </button>
            </div>
          </div>

          {/* Quick Search & Filters Header */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Quick Search */}
              <div className="flex-1 flex items-center px-4 py-2.5 rounded-xl bg-[#F8FAFC] dark:bg-[#0F172A] border border-slate-200 dark:border-slate-800">
                <Search size={15} className="text-slate-500 dark:text-slate-400 mr-2 shrink-0" />
                <input
                  type="text"
                  placeholder="Quick search products, suppliers, customers, lots..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs w-full font-medium"
                />
                {searchTerm && (
                  <button onClick={() => setSearchTerm('')} className="text-xs text-slate-400 hover:text-slate-600 font-extrabold">✕</button>
                )}
              </div>

              <button
                onClick={resetFilters}
                className="flex items-center justify-center gap-1 px-3 py-2.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-wider shrink-0"
              >
                <RefreshCw size={12} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Sold Consignments Master Data Table */}
          <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl overflow-hidden shadow-sm">
            
            {selectedRows.length > 0 && (
              <div className="bg-[#4F46E5]/10 px-6 py-3 flex items-center justify-between border-b border-[#4F46E5]/20">
                <span className="text-xs font-bold text-[#4F46E5] dark:text-indigo-400 uppercase tracking-wider">
                  {selectedRows.length} lots selected for bulk actions
                </span>
                <div className="flex gap-2.5">
                  <button
                    onClick={handlePrintList}
                    className="bg-white dark:bg-[#1E293B] text-[10px] font-black uppercase tracking-wider border border-slate-200 dark:border-slate-800 px-3 py-1.5 rounded-lg hover:scale-105 transition-all"
                  >
                    Print Selected Lots
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="bg-[#4F46E5] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg hover:scale-105 transition-all"
                  >
                    Export Selected (CSV)
                  </button>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200 dark:border-slate-800">
                    <th className="py-4 px-6 text-center w-12" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.length === filteredLots.length && filteredLots.length > 0} 
                        onChange={handleSelectAll}
                        className="rounded text-[#4F46E5] focus:ring-[#4F46E5] h-3.5 w-3.5"
                      />
                    </th>
                    <th className="py-4 px-4 font-extrabold">Consignment Lot #</th>
                    <th className="py-4 px-4 font-extrabold">Arrival Date</th>
                    <th className="py-4 px-4 font-extrabold">Commodity Product</th>
                    <th className="py-4 px-4 font-extrabold">Farmer Supplier</th>
                    <th className="py-4 px-4 font-extrabold text-right">Arrived Qty</th>
                    <th className="py-4 px-4 font-extrabold text-right">Total Sold Qty</th>
                    <th className="py-4 px-4 font-extrabold text-right">Remaining Stock</th>
                    <th className="py-4 px-4 font-extrabold text-right text-emerald-600 dark:text-emerald-400">Gross Turnover</th>
                    <th className="py-4 px-4 font-extrabold text-right text-indigo-500">Commission</th>
                    <th className="py-4 px-4 font-extrabold text-center">Status</th>
                    <th className="py-4 px-6 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredLots.length > 0 ? (
                    filteredLots.map((lot) => {
                      const isChecked = selectedRows.includes(lot.stockEntryId);
                      return (
                        <tr 
                          key={lot.stockEntryId} 
                          onClick={() => setSelectedLot(lot.stockEntryId)}
                          className={`cursor-pointer hover:bg-indigo-50/40 dark:hover:bg-[#0F172A]/50 transition-all ${
                            isChecked ? 'bg-[#4F46E5]/5' : ''
                          }`}
                          title="Click row to inspect lot details"
                        >
                          {/* Row Checkbox */}
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => handleSelectRow(lot.stockEntryId)}
                              className="rounded text-[#4F46E5] focus:ring-[#4F46E5] h-3.5 w-3.5"
                            />
                          </td>

                          {/* Lot Number */}
                          <td className="py-4 px-4">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-black text-slate-900 dark:text-white bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-2.5 py-1 rounded-lg">
                                #{lot.lotNumber}
                              </span>
                            </div>
                            <div className="text-[9px] opacity-60 font-mono mt-1">
                              {lot.salesCount} invoice(s) recorded
                            </div>
                          </td>

                          {/* Arrival Date */}
                          <td className="py-4 px-4 font-semibold text-slate-600 dark:text-slate-300">
                            {lot.arrivalDate}
                          </td>

                          {/* Commodity */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800 dark:text-white">
                              {lot.product?.name || 'Commodity'}
                            </div>
                            <div className="text-[9px] opacity-60 uppercase mt-0.5">
                              {lot.product?.category || 'General'}
                            </div>
                          </td>

                          {/* Supplier */}
                          <td className="py-4 px-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {lot.supplier?.name || 'Unknown Supplier'}
                            </div>
                            <div className="text-[9px] opacity-60 font-mono mt-0.5">
                              {lot.supplier?.phone || 'No Contact'}
                            </div>
                          </td>

                          {/* Arrived Quantity */}
                          <td className="py-4 px-4 text-right font-black text-slate-900 dark:text-white">
                            {lot.arrivedQty} <span className="text-[9px] opacity-60 font-normal">{lot.product?.unit || 'units'}</span>
                          </td>

                          {/* Total Sold Quantity */}
                          <td className="py-4 px-4 text-right">
                            <div className="font-black text-indigo-600 dark:text-indigo-400">
                              {lot.totalSoldQty} <span className="text-[9px] opacity-60 font-normal">{lot.product?.unit || 'units'}</span>
                            </div>
                            <div className="text-[8px] font-bold text-slate-400 mt-0.5">
                              Walk-In: {lot.totalWalkInQty} | Reg: {lot.totalRegisteredQty}
                            </div>
                          </td>

                          {/* Remaining Stock */}
                          <td className="py-4 px-4 text-right">
                            <span className={`font-black ${lot.remainingQty > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                              {lot.remainingQty} <span className="text-[9px] opacity-60 font-normal">{lot.product?.unit || 'units'}</span>
                            </span>
                          </td>

                          {/* Gross Turnover */}
                          <td className="py-4 px-4 text-right font-black text-emerald-600 dark:text-emerald-400">
                            Rs. {(lot.grossTurnover || 0).toLocaleString()}
                          </td>

                          {/* Commission */}
                          <td className="py-4 px-4 text-right font-black text-indigo-600 dark:text-indigo-400">
                            Rs. {(lot.totalCommission || 0).toLocaleString()}
                          </td>

                          {/* Status */}
                          <td className="py-4 px-4 text-center">
                            <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${
                              lot.status === 'Closed' 
                                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' 
                                : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                            }`}>
                              {lot.status}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => handleOpenLotWindow(lot.stockEntryId)}
                                className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all cursor-pointer"
                                title="See Date-Wise Consignment Sales Breakdown in New Window"
                              >
                                <ExternalLink size={12} />
                                <span>See Date Wise</span>
                              </button>
                              <button
                                onClick={() => setSelectedLot(lot.stockEntryId)}
                                className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition-all cursor-pointer"
                                title="Inspect In-Page"
                              >
                                <Eye size={13} />
                              </button>
                            </div>
                          </td>

                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="12" className="py-12 px-6 text-center text-slate-500 text-xs">
                        <Info size={24} className="mx-auto mb-2 opacity-40 text-indigo-400" />
                        No consignment lots found matching the search criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>
        </>
      ) : (
        /* ================= LOT INSPECTOR VIEW (Selected Lot Details) ================= */
        <div className="space-y-6 animate-fade-in">
          
          {/* Header & Print Panel */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <button 
                onClick={() => setSelectedLot(null)}
                className="flex items-center space-x-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-bold uppercase tracking-wider mb-2"
              >
                <ArrowLeft size={14} />
                <span>Back to Master Sold Consignments</span>
              </button>
              <h2 className="text-xl font-black uppercase tracking-wider flex items-center gap-2">
                📂 Lot Sheet Inspection: #{lotDetails?.lotNumber}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                Consignment Batch Master Code: {lotDetails?.stockEntryId}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleRecordLotSettlement}
                disabled={recordingSettlement || lotDetails?.isSettled || (computedNetPayable <= 0 && lotGrossSales <= 0)}
                className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md ${
                  lotDetails?.isSettled
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
                title="Calculate net payable and post final settlement (Bikri Parchi) to Supplier Khata & Outstanding Payables"
              >
                <CheckCircle size={15} />
                <span>
                  {recordingSettlement
                    ? 'Settling...'
                    : (lotDetails?.isSettled
                        ? `✓ Settled in Payables (Rs. ${(lotDetails?.settledAmount || computedNetPayable || 0).toLocaleString()})`
                        : 'Submit to Payables (Bikri Parchi)')}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setVoucherPreviewLot(lotDetails)}
                className="flex items-center space-x-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-500/15"
              >
                <Printer size={15} />
                <span>Print Professional Lot Voucher</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const lotSales = lotDetails?.lotSales || sales.filter(s => s.stockEntryId === lotDetails?.stockEntryId);
                  const lotReturns = lotReturnsList || returns.filter(r => {
                    const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
                    const targetId = String(lotDetails?.stockEntryId || lotDetails?.id || lotDetails?._id);
                    return (rStockId && targetId && rStockId === targetId) && (r.status === 'Approved') && (!r.isDeleted);
                  });
                  downloadLotVoucherPDF({
                    lot: lotDetails,
                    lotSales,
                    lotReturns,
                    supplier: lotDetails?.supplier,
                    stock: lotDetails?.stock || stockEntries.find(s => (s.id || s._id) === lotDetails?.stockEntryId)
                  });
                }}
                className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-rose-600/15"
              >
                <Download size={15} />
                <span>Download PDF Voucher</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of inspected Lot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Consignment Product</span>
              <h3 className="text-base font-black text-slate-800 dark:text-white mt-1 uppercase flex items-center gap-1.5">
                🥦 {lotDetails?.productName || lotDetails?.product?.name || 'Produce'}
              </h3>
              <p className="text-[10px] opacity-60 uppercase mt-0.5">Category: {lotDetails?.product?.category || 'General'}</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Original Quantity</span>
              <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">
                {lotDetails?.stock?.quantity !== undefined ? lotDetails.stock.quantity : (lotDetails?.arrivedQty || 0)} <span className="text-xs opacity-50 font-semibold">{lotDetails?.product?.unit || 'crates'}</span>
              </h3>
              <p className="text-[10px] opacity-60 uppercase mt-0.5">Disposed: {lotQtySold} units</p>
            </div>

            <div className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Broker Commissions</span>
              <h3 className="text-base font-black text-[#4F46E5] dark:text-indigo-400 mt-1">
                Rs. {totalBrokerCommission.toLocaleString()}
              </h3>
              <p className="text-[10px] opacity-60 uppercase mt-0.5">
                Buyer: Rs. {lotBuyerComm.toLocaleString()} | Supp: Rs. {Math.round(computedSupplierCommDeduction).toLocaleString()}
              </p>
            </div>

            <div className="p-4 bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-sm">
              <span className="text-[9px] text-slate-500 font-extrabold uppercase tracking-widest block">Remaining Balance</span>
              <h3 className="text-base font-black text-slate-800 dark:text-white mt-1">
                {lotDetails?.stock?.remainingQuantity !== undefined ? lotDetails.stock.remainingQuantity : (lotDetails?.remainingQty !== undefined ? lotDetails.remainingQty : 0)} <span className="text-xs opacity-50 font-semibold">{lotDetails?.product?.unit || 'crates'}</span>
              </h3>
              <p className="text-[10px] opacity-60 uppercase mt-0.5">Status: {(lotDetails?.stock?.remainingQuantity === 0 || lotDetails?.remainingQty === 0) ? 'Closed' : 'Active'}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column - Detailed Sales & Supplier Profile */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Supplier Profile Card */}
              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Farmer Supplier Portfolio
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-semibold">
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Supplier Name</span>
                    <span className="text-sm font-bold">{lotDetails?.supplier?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Supplier Mobile</span>
                    <span className="text-sm font-bold text-[#4F46E5] dark:text-indigo-400 font-mono">{lotDetails?.supplier?.phone || 'No Phone'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Total Mandi Supplies</span>
                    <span className="text-sm font-bold">Rs. {(lotDetails?.supplier?.totalSupplied || 0).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Configurable Supplier Settlement & Deductions Card */}
              <div className="bg-white dark:bg-[#1E293B] border border-indigo-500/20 dark:border-indigo-500/30 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#4F46E5] dark:text-indigo-400 flex items-center gap-2">
                      ⚙️ Supplier Settlement & Expense Deductions Configuration
                    </h3>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Configure supplier commission & additional lot expenses. Deductions here adjust supplier payable balance.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveLotFinancials}
                    disabled={savingLotFin || lotDetails?.isSettled}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 ${
                      lotDetails?.isSettled
                        ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300 dark:border-slate-700 opacity-70'
                        : 'bg-[#4F46E5] hover:bg-opacity-90 disabled:opacity-50 text-white cursor-pointer'
                    }`}
                    title={lotDetails?.isSettled ? "Settlement configuration is locked (Lot already settled & recorded to payables)" : "Save Settlement Configuration"}
                  >
                    {savingLotFin ? 'Saving...' : (lotDetails?.isSettled ? '✓ Configuration Locked (Settled)' : 'Save Settlement Configuration')}
                  </button>
                </div>

                {lotFinMessage && (
                  <div className={`p-3 rounded-xl text-xs font-bold ${
                    lotFinMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                  }`}>
                    {lotFinMessage.text}
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* 1. Supplier Commission Inputs */}
                  <div className="space-y-3 bg-slate-50 dark:bg-[#0F172A]/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider block mb-2">
                        1. Supplier Commission Rule
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">Commission Type</label>
                          <select
                            disabled={lotDetails?.isSettled}
                            value={lotFinCommType}
                            onChange={(e) => setLotFinCommType(e.target.value)}
                            className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-[#4F46E5] disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            <option value="Percentage">Percentage (%)</option>
                            <option value="Per Unit">Fixed Per Unit</option>
                            <option value="Fixed Amount">Fixed Amount</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 mb-1">
                            Value ({lotFinCommType === 'Percentage' ? '%' : 'Rs.'})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            disabled={lotDetails?.isSettled}
                            value={lotFinCommValue}
                            onChange={(e) => setLotFinCommValue(e.target.value)}
                            className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-2 text-xs font-bold outline-none focus:border-[#4F46E5] disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="e.g. 5"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      Commission Deduction: <span className="text-rose-500 font-extrabold">Rs. {computedSupplierCommDeduction.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 2. Market / Sarkari Fee (%) Input */}
                  <div className="space-y-3 bg-slate-50 dark:bg-[#0F172A]/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          2. Market / Sarkari Fee
                        </span>
                        <span className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                          Percentage (%)
                        </span>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 mb-1">
                          Market / Sarkari Fee Rate (%)
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            disabled={lotDetails?.isSettled}
                            value={lotFinMarketFee}
                            onChange={(e) => setLotFinMarketFee(e.target.value)}
                            className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-xl pl-3 pr-8 py-2 text-xs font-bold outline-none focus:border-[#4F46E5] disabled:opacity-60 disabled:cursor-not-allowed"
                            placeholder="e.g. 1.5 or 2"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">%</span>
                        </div>
                        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1">
                          Applied as % of Gross Sales value (مارکیٹ فیس)
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      Market Fee Deduction: <span className="text-rose-500 font-extrabold">Rs. {computedMarketFeeDeduction.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* 3. Dynamic Expense Categories Inputs */}
                  <div className="space-y-3 bg-slate-50 dark:bg-[#0F172A]/40 p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          3. Additional Expense Deductions
                        </span>
                        <span className="text-[9px] text-indigo-500 font-bold">Via Settings</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 max-h-28 overflow-y-auto pr-1">
                        {expenseCategories.length > 0 ? (
                          expenseCategories.map(cat => (
                            <div key={cat.id || cat._id}>
                              <label className="block text-[10px] font-bold text-slate-500 mb-0.5 truncate" title={cat.name}>
                                {cat.name}
                              </label>
                              <input
                                type="number"
                                min="0"
                                placeholder="0"
                                disabled={lotDetails?.isSettled}
                                value={lotFinExpenses[cat.name] !== undefined ? lotFinExpenses[cat.name] : ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setLotFinExpenses(prev => ({
                                    ...prev,
                                    [cat.name]: val
                                  }));
                                }}
                                className="w-full bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-bold outline-none focus:border-[#4F46E5] disabled:opacity-60 disabled:cursor-not-allowed"
                              />
                            </div>
                          ))
                        ) : (
                          <p className="text-[10px] text-slate-400 italic col-span-2">No active expense categories loaded.</p>
                        )}
                      </div>
                    </div>

                    <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                      Additional Expenses: <span className="text-rose-500 font-extrabold">Rs. {computedTotalExpenses.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Real-time Settlement Summary Banner */}
                <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 border border-indigo-500/20 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs font-bold items-center">
                  <div>
                    <span className="block text-[9px] text-slate-500 uppercase">Gross Sales Value (خام بکری)</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">Rs. {lotGrossSales.toLocaleString()}</span>
                    {lotReturnedGross > 0 && (
                      <span className="block text-[9px] text-rose-500 font-semibold mt-0.5">
                        (Raw: Rs. {rawLotGrossSales.toLocaleString()} - Return: Rs. {lotReturnedGross.toLocaleString()})
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="block text-[9px] text-rose-500 uppercase">Comm. & Market Fee</span>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      Comm: Rs. {computedSupplierCommDeduction.toLocaleString()}
                      {marketFeeRateNum > 0 && (
                        <span className="block text-[10px] font-semibold text-rose-500/80">Fee ({marketFeeRateNum}%): Rs. {computedMarketFeeDeduction.toLocaleString()}</span>
                      )}
                    </span>
                  </div>

                  <div>
                    <span className="block text-[9px] text-rose-500 uppercase">Total Supplier Deductions</span>
                    <span className="text-sm font-black text-rose-600 dark:text-rose-400">- Rs. {computedTotalDeductions.toLocaleString()}</span>
                  </div>

                  <div>
                    <span className="block text-[9px] text-emerald-600 dark:text-emerald-400 uppercase">Net Payable to Supplier</span>
                    <span className="text-base font-black text-emerald-600 dark:text-emerald-400">Rs. {computedNetPayable.toLocaleString()}</span>
                  </div>

                  <div className="flex lg:justify-end">
                    <button
                      type="button"
                      onClick={handleRecordLotSettlement}
                      disabled={recordingSettlement || lotDetails?.isSettled || (computedNetPayable <= 0 && lotGrossSales <= 0)}
                      className={`w-full lg:w-auto px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                        lotDetails?.isSettled
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <CheckCircle size={14} />
                      <span>
                        {recordingSettlement 
                          ? 'Settling...' 
                          : (lotDetails?.isSettled ? `✓ Settled in Payables (Rs. ${(lotDetails?.settledAmount || computedNetPayable || 0).toLocaleString()})` : 'Submit to Payables (Bikri Parchi)')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Returned Stock Log (Minus of Returned Stock Value) */}
              {lotReturnsList.length > 0 && (
                <div className="bg-white dark:bg-[#1E293B] border border-rose-500/30 rounded-2xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-rose-500/20 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-2">
                      ↩️ Returned Stock Value Deductions ({lotReturnsList.length} Returns)
                    </h3>
                    <span className="text-xs font-black text-rose-600 dark:text-rose-400">
                      Total Returned Deducted: - Rs. {lotReturnedGross.toLocaleString()} ({lotReturnedQty} Crates)
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold uppercase text-[9px] border-b border-rose-200 dark:border-rose-900/50">
                          <th className="py-2.5 px-3">Return #</th>
                          <th className="py-2.5 px-3">Date</th>
                          <th className="py-2.5 px-3">Customer</th>
                          <th className="py-2.5 px-3 text-right">Returned Qty</th>
                          <th className="py-2.5 px-3 text-right">Sale Rate</th>
                          <th className="py-2.5 px-3 text-right text-rose-600">Gross Return Minus</th>
                          <th className="py-2.5 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-rose-100 dark:divide-rose-900/30">
                        {lotReturnsList.map(ret => (
                          <tr key={ret.id || ret._id} className="hover:bg-rose-50/40 dark:hover:bg-rose-950/20 text-[11px]">
                            <td className="py-2.5 px-3 font-mono font-bold">{ret.returnNumber}</td>
                            <td className="py-2.5 px-3 font-mono text-[10px]">{ret.date}</td>
                            <td className="py-2.5 px-3 font-semibold">{ret.customerName}</td>
                            <td className="py-2.5 px-3 text-right font-bold">{ret.produceReturnedQty} Crates</td>
                            <td className="py-2.5 px-3 text-right">Rs. {ret.saleRate || 0}</td>
                            <td className="py-2.5 px-3 text-right font-black text-rose-600 dark:text-rose-400">
                              - Rs. {(Number(ret.grossReturnAmount) || (Number(ret.produceReturnedQty || 0) * Number(ret.saleRate || 0))).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="text-[9px] px-2 py-0.5 rounded font-bold bg-emerald-500/10 text-emerald-600">
                                Produce Restocked
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Lot Sales Detailed Log */}
              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Customer Sales Allocation History ({lotSalesList.length} trades)
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-bold uppercase text-[9px] border-b border-slate-200 dark:border-slate-800">
                        <th className="py-3 px-4 font-bold">Invoice ID</th>
                        <th className="py-3 px-4 font-bold">Buyer</th>
                        <th className="py-3 px-4 font-bold">Buyer Type</th>
                        <th className="py-3 px-4 font-bold text-right">Quantity</th>
                        <th className="py-3 px-4 font-bold text-right">Rate</th>
                        <th className="py-3 px-4 font-bold text-right">Gross Sale</th>
                        <th className="py-3 px-4 font-bold text-right">Comm.</th>
                        <th className="py-3 px-4 font-bold text-right">Discount</th>
                        <th className="py-3 px-4 font-bold text-right text-indigo-500">Net Receivable</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {lotSalesList.map(s => {
                        const invNum = s.invoiceNumber || (s.id || s._id || '').substring(0, 8).toUpperCase();
                        const gross = s.grossSale || (s.quantity * s.saleRate) || 0;
                        const comm = s.commissionAmount || s.commission || 0;
                        const disc = s.discount || 0;
                        const net = s.netSale || s.totalAmount || (gross - comm - disc);

                        return (
                          <tr key={s.id || s._id} className="hover:bg-slate-50/50 dark:hover:bg-[#0F172A]/30 transition-all text-[11px]">
                            <td className="py-3.5 px-4 font-bold font-mono">INV-{invNum}</td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold">{s.customerName || s.walkInName || 'Walk-In Buyer'}</div>
                              {s.isWalkIn && s.walkInMobile && (
                                <div className="text-[9px] opacity-60 font-mono mt-0.5">{s.walkInMobile}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                                s.isWalkIn ? 'bg-amber-500/15 text-amber-500' : 'bg-indigo-500/15 text-indigo-500'
                              }`}>
                                {s.customerType || (s.isWalkIn ? 'Walk-In' : 'Registered')}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right font-bold">{s.quantity}</td>
                            <td className="py-3.5 px-4 text-right">Rs. {s.saleRate}</td>
                            <td className="py-3.5 px-4 text-right">Rs. {(gross || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-emerald-500 font-bold">Rs. {(comm || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right">Rs. {(disc || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right text-[#4F46E5] dark:text-indigo-400 font-bold">Rs. {(net || 0).toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Right Column - Inventory Movements & Audits */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Chronological Inventory Movement */}
              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  Chronological Inventory Movement Flow
                </h3>
                
                <div className="relative pl-6 space-y-4 border-l-2 border-dashed border-slate-200 dark:border-slate-800 ml-2 pt-2 pb-2">
                  {lotInventoryMovements.map((move, i) => (
                    <div key={i} className="relative">
                      {/* Circle indicator */}
                      <span className={`absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-[#1E293B] flex items-center justify-center text-[7px] font-bold text-white shadow ${
                        move.type === 'Arrival' ? 'bg-emerald-500' : 'bg-[#4F46E5]'
                      }`}>
                        {move.type === 'Arrival' ? 'IN' : 'OT'}
                      </span>
                      
                      <div className="text-xs">
                        <div className="flex justify-between items-start font-bold">
                          <span className={move.type === 'Arrival' ? 'text-emerald-500' : 'text-slate-800 dark:text-slate-200'}>
                            {move.type} ({move.qty > 0 ? `+${move.qty}` : move.qty} units)
                          </span>
                          <span className="text-[9px] opacity-50 font-mono">{move.date}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">
                          Party: {move.partyName} <span className="opacity-60">({move.ref})</span>
                        </p>
                        <p className="text-[9px] text-[#4F46E5] dark:text-indigo-400 font-bold mt-1 uppercase">
                          Running Balance: {move.runningQty} units
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lot Activity Log and Ledger */}
              <div className="bg-white dark:bg-[#1E293B] border border-slate-200 dark:border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-2">
                  System Audit Logs (Lots/Vouchers)
                </h3>
                {lotAuditLogs.length > 0 ? (
                  <div className="space-y-3 max-h-56 overflow-y-auto">
                    {lotAuditLogs.map(log => (
                      <div key={log.id || log._id} className="p-3 bg-slate-50 dark:bg-[#0F172A]/50 border border-slate-100 dark:border-slate-800/80 rounded-xl text-[11px] space-y-1">
                        <div className="flex justify-between text-[9px] font-bold text-slate-500">
                          <span>User: {log.userName} ({log.userRole})</span>
                          <span>{new Date(log.timestamp).toLocaleDateString()}</span>
                        </div>
                        <p className="font-semibold text-slate-700 dark:text-slate-300">{log.action}</p>
                        <p className="opacity-75">{log.details}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500 italic text-center py-4">
                    No matching activity logs recorded for this stock batch.
                  </p>
                )}
              </div>

            </div>

          </div>

        </div>
      )}
      </div>

      {/* In-Page Professional Lot Voucher Preview Modal */}
      {voucherPreviewLot && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto printable-modal-wrapper">
          {/* Print Style block for current window print */}
          <style>{`
            @media print {
              @page {
                size: auto;
                margin: 8mm;
              }

              /* Hide main layout, sidebars, headers, and modal controls */
              .no-print-main, aside, header, nav, footer, button, .no-print-in-modal {
                display: none !important;
              }

              html, body, #root {
                background: white !important;
                color: black !important;
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                margin: 0 !important;
                padding: 0 !important;
              }

              .printable-modal-wrapper {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                height: auto !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                box-shadow: none !important;
                border: none !important;
                overflow: visible !important;
                z-index: 999999 !important;
              }

              .printable-modal-wrapper .bg-slate-100,
              .printable-modal-wrapper .dark\\:bg-\\[\\#0F172A\\],
              .printable-modal-wrapper .bg-white,
              .printable-modal-wrapper .dark\\:bg-\\[\\#1E293B\\] {
                background: white !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
                max-height: none !important;
                overflow: visible !important;
              }

              #printable-voucher-modal-area {
                position: relative !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 5px !important;
                background: white !important;
                color: black !important;
                box-shadow: none !important;
                border: none !important;
                page-break-inside: avoid !important;
                page-break-before: avoid !important;
                page-break-after: avoid !important;
              }
            }
          `}</style>

          <div className="bg-white dark:bg-[#1E293B] rounded-3xl max-w-4xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-slate-50 dark:bg-[#0F172A] border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 no-print-in-modal">
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-[#4F46E5] bg-indigo-500/10 px-2.5 py-1 rounded-lg">
                  In-Page Voucher Preview
                </span>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                  Professional Consignment Lot Voucher — Lot #{voucherPreviewLot.lotNumber}
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    window.print();
                  }}
                  className="flex items-center space-x-1.5 bg-[#4F46E5] hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all cursor-pointer"
                >
                  <Printer size={14} />
                  <span>Print Voucher</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const lotSales = voucherPreviewLot.lotSales || sales.filter(s => s.stockEntryId === voucherPreviewLot.stockEntryId);
                    const lotReturns = returns.filter(r => {
                      const rStockId = r.stockEntryId ? String(r.stockEntryId) : null;
                      const targetId = String(voucherPreviewLot.stockEntryId || voucherPreviewLot.id || voucherPreviewLot._id);
                      return (rStockId && targetId && rStockId === targetId) && (r.status === 'Approved') && (!r.isDeleted);
                    });
                    downloadLotVoucherPDF({
                      lot: voucherPreviewLot,
                      lotSales,
                      lotReturns,
                      supplier: voucherPreviewLot.supplier,
                      stock: voucherPreviewLot.stock || stockEntries.find(s => (s.id || s._id) === voucherPreviewLot.stockEntryId)
                    });
                  }}
                  className="flex items-center space-x-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-all"
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setVoucherPreviewLot(null)}
                  className="px-3 py-2 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-300 transition-all"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Modal Body Preview Container */}
            <div className="p-6 overflow-y-auto flex-1 bg-slate-100 dark:bg-[#0F172A]">
              <div 
                id="printable-voucher-modal-area"
                className="bg-white text-slate-900 p-8 rounded-2xl shadow-lg border border-slate-200 max-w-3xl mx-auto space-y-6 text-xs"
                dangerouslySetInnerHTML={{ __html: generateVoucherInnerBody(voucherPreviewLot) }}
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}
