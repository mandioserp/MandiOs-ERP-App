import { Truck, AuditLog, Supplier } from '../models/index.js';
import { assertTenantOwnership, buildTenantQuery, getTenantId } from '../utils/tenant.js';

export async function getTrucks(req, res) {
  try {
    const trucks = await Truck.find(buildTenantQuery(req));
    res.json(trucks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch trucks.' });
  }
}

export async function addTruck(req, res) {
  try {
    const { truckNumber, status, arrivalDate, dispatchDate, supplierId, driverName, driverPhone, notes, quantityLoaded, description } = req.body;
    const tenantId = getTenantId(req) || 'tenant_default_001';

    if (!truckNumber || !arrivalDate) {
      return res.status(400).json({ error: 'Please provide truck number and arrival date.' });
    }

    let supplierName = '';
    if (supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (supplier) {
        supplierName = supplier.name;
      }
    }

    const truck = await Truck.create({
      tenantId,
      truckNumber,
      status: status || 'Arrived',
      arrivalDate,
      dispatchDate: dispatchDate || '',
      supplierId: supplierId || '',
      supplierName,
      driverName: driverName || '',
      driverPhone: driverPhone || '',
      quantityLoaded: quantityLoaded !== undefined ? Number(quantityLoaded) : 0,
      description: description || notes || '',
      notes: notes || description || '',
    });

    await AuditLog.create({
      tenantId,
      userId: req.user ? req.user.id : 'system',
      userName: req.user ? req.user.name : 'System',
      userRole: req.user ? req.user.role : 'Admin',
      action: 'ADD_TRUCK',
      details: `Registered truck ${truckNumber} from supplier ${supplierName || 'N/A'}.`,
      timestamp: new Date().toISOString(),
    });

    res.status(201).json(truck);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record truck entry.' });
  }
}

export async function editTruck(req, res) {
  try {
    const { id } = req.params;
    const { truckNumber, status, arrivalDate, dispatchDate, supplierId, driverName, driverPhone, notes, quantityLoaded, description } = req.body;

    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }
    if (!assertTenantOwnership(req, truck)) return res.status(404).json({ error: 'Truck not found.' });

    let supplierName = truck.supplierName;
    if (supplierId && supplierId !== truck.supplierId) {
      const supplier = await Supplier.findById(supplierId);
      if (supplier) {
        supplierName = supplier.name;
      }
    }

    const tenantId = getTenantId(req) || truck.tenantId || 'tenant_default_001';

    const updated = await Truck.findByIdAndUpdate(id, {
      truckNumber: truckNumber || truck.truckNumber,
      status: status || truck.status,
      arrivalDate: arrivalDate || truck.arrivalDate,
      dispatchDate: dispatchDate !== undefined ? dispatchDate : truck.dispatchDate,
      supplierId: supplierId !== undefined ? supplierId : truck.supplierId,
      supplierName: supplierId !== undefined ? supplierName : truck.supplierName,
      driverName: driverName !== undefined ? driverName : truck.driverName,
      driverPhone: driverPhone !== undefined ? driverPhone : truck.driverPhone,
      quantityLoaded: quantityLoaded !== undefined ? Number(quantityLoaded) : truck.quantityLoaded,
      description: description !== undefined ? description : (notes !== undefined ? notes : truck.description),
      notes: notes !== undefined ? notes : (description !== undefined ? description : truck.notes),
    }, { new: true });

    await AuditLog.create({
      tenantId,
      userId: req.user ? req.user.id : 'system',
      userName: req.user ? req.user.name : 'System',
      userRole: req.user ? req.user.role : 'Admin',
      action: 'EDIT_TRUCK',
      details: `Updated truck ${truckNumber || truck.truckNumber} details (Status: ${status || truck.status}).`,
      timestamp: new Date().toISOString(),
    });

    res.json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update truck details.' });
  }
}

export async function deleteTruck(req, res) {
  try {
    const { id } = req.params;
    const truck = await Truck.findById(id);
    if (!truck) {
      return res.status(404).json({ error: 'Truck not found.' });
    }

    const tenantId = getTenantId(req) || truck.tenantId || 'tenant_default_001';

    await Truck.findByIdAndDelete(id);

    await AuditLog.create({
      tenantId,
      userId: req.user ? req.user.id : 'system',
      userName: req.user ? req.user.name : 'System',
      userRole: req.user ? req.user.role : 'Admin',
      action: 'DELETE_TRUCK',
      details: `Deleted truck registration ${truck.truckNumber}.`,
      timestamp: new Date().toISOString(),
    });

    res.json({ message: 'Truck registration deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete truck registration.' });
  }
}
