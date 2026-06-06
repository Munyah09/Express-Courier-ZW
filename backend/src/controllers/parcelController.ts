import { Request, Response } from 'express';
import { parcelService } from '../services/parcelService';
import { notifyParcelStatusChange } from '../services/notificationService';

export const listParcels = async (req: Request, res: Response) => {
  try {
    const limit  = Number(req.query.limit)  || 50;
    const offset = Number(req.query.offset) || 0;
    const filters = {
      status:   req.query.status   as string | undefined,
      branchId: req.query.branchId as string | undefined,
      search:   req.query.search   as string | undefined,
    };
    const { data, total } = await parcelService.listParcels(limit, offset, filters);
    res.json({ data, meta: { total, limit, offset } });
  } catch (error) {
    res.status(500).json({ error: (error as any)?.message || String(error) });
  }
};

export const createParcel = async (req: Request, res: Response) => {
  try {
    const {
      senderId, receiverId, weight, dimensions, declaredValue, insuranceAmount,
      collectionPointId, branchId, deliveryType, paymentMethod, fragile, requiresSignature,
      deliveryCharge, deliveryZone, pickupLandmark, deliveryLandmark, notes,
    } = req.body;

    if (!senderId || !receiverId) {
      return res.status(400).json({ error: 'senderId and receiverId are required' });
    }

    const parcel = await parcelService.createParcel({
      senderId, receiverId, weight, dimensions, declaredValue, insuranceAmount,
      collectionPointId, branchId, deliveryType, paymentMethod, fragile, requiresSignature,
      deliveryCharge, deliveryZone, pickupLandmark, deliveryLandmark, notes,
    });

    const handlerUserId = (req as any).user?.user?.id;
    notifyParcelStatusChange(parcel.id, 'Accepted', { handlerUserId }).catch(console.error);

    res.status(201).json({ data: parcel });
  } catch (error: any) {
    const msg = error?.message || error?.details || String(error);
    res.status(500).json({ error: msg });
  }
};

export const getParcelById = async (req: Request, res: Response) => {
  try {
    const parcel = await parcelService.getParcel(req.params.parcelId);
    res.json({ data: parcel });
  } catch {
    res.status(404).json({ error: 'Parcel not found' });
  }
};

export const getParcelByTracking = async (req: Request, res: Response) => {
  try {
    const parcel = await parcelService.getParcelByTracking(req.params.trackingNumber);
    res.json({ data: parcel });
  } catch {
    res.status(404).json({ error: 'Parcel not found' });
  }
};

export const updateParcelStatus = async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { status, notes, currentLocation, vehicleId } = req.body;

    if (!status) return res.status(400).json({ error: 'status is required' });

    const parcel = await parcelService.updateParcelStatus(parcelId, status, notes);
    const handlerUserId = (req as any).user?.user?.id;

    notifyParcelStatusChange(parcelId, status, {
      handlerUserId,
      vehicleId,
      currentLocation,
      notes,
    }).catch(console.error);

    res.json({ data: parcel });
  } catch (error) {
    res.status(500).json({ error: (error as any)?.message || String(error) });
  }
};

export const recordParcelEvent = async (req: Request, res: Response) => {
  try {
    const { parcelId } = req.params;
    const { eventType, description, gpsPoint, photoUrl } = req.body;
    const userId = (req as any).user?.user?.id;
    const event  = await parcelService.recordParcelEvent(parcelId, eventType, description, userId, undefined, gpsPoint, photoUrl);
    res.status(201).json({ data: event });
  } catch (error) {
    res.status(500).json({ error: (error as any)?.message || String(error) });
  }
};
