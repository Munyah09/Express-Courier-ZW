import { Request, Response } from 'express';
import { db } from '../lib/supabase';

export const listManifests = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;
    const date = (req.query.date as string) || new Date().toISOString().split('T')[0];

    const { data, error, count } = await db
      .from('manifests')
      .select(
        `
        id,
        manifest_date,
        status,
        route:routes(name, origin, destination),
        vehicle:vehicles(registration, type),
        driver:users!driver_id(id, first_name, last_name)
      `,
        { count: 'exact' }
      )
      .eq('manifest_date', date)
      .range(offset, offset + limit - 1);

    if (error) throw error;
    res.json({ data, meta: { total: count, limit, offset } });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const getManifest = async (req: Request, res: Response) => {
  try {
    const { manifestId } = req.params;

    const { data: manifest, error: manifestError } = await db
      .from('manifests')
      .select(
        `
        *,
        route:routes(name, origin, destination),
        vehicle:vehicles(registration, type, make_model),
        driver:users!driver_id(id, first_name, last_name, phone)
      `
      )
      .eq('id', manifestId)
      .single();

    if (manifestError) throw manifestError;

    const { data: parcels, error: parcelsError } = await db
      .from('parcels')
      .select(
        `
        id,
        tracking_number,
        status,
        weight,
        sender:customers!sender_id(first_name, last_name, phone),
        receiver:customers!receiver_id(first_name, last_name, phone, landmark_address)
      `
      )
      .eq('manifest_id', manifestId);

    if (parcelsError) throw parcelsError;

    res.json({ data: { ...manifest, parcels } });
  } catch (error) {
    res.status(404).json({ error: 'Manifest not found' });
  }
};

export const createManifest = async (req: Request, res: Response) => {
  try {
    const { routeId, vehicleId, driverId, manifestDate, parcelIds } = req.body;

    if (!manifestDate) {
      return res.status(400).json({ error: 'manifestDate is required' });
    }

    const { data: manifest, error: manifestError } = await db
      .from('manifests')
      .insert({
        route_id: routeId,
        vehicle_id: vehicleId,
        driver_id: driverId,
        manifest_date: manifestDate,
        status: 'pending'
      })
      .select()
      .single();

    if (manifestError) throw manifestError;

    if (parcelIds && parcelIds.length > 0) {
      const { error: parcelError } = await db
        .from('parcels')
        .update({ manifest_id: manifest.id })
        .in('id', parcelIds);

      if (parcelError) throw parcelError;
    }

    res.status(201).json({ data: manifest });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};

export const updateManifestStatus = async (req: Request, res: Response) => {
  try {
    const { manifestId } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const { data, error } = await db
      .from('manifests')
      .update({ status })
      .eq('id', manifestId)
      .select()
      .single();

    if (error) throw error;
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
};
