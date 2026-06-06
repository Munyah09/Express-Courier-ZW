import { Request, Response } from 'express';
import { customerService, CreateCustomerInput } from '../services/customerService';

export const createCustomer = async (req: Request, res: Response) => {
  try {
    const input: CreateCustomerInput = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      companyName: req.body.companyName,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      email: req.body.email,
      landmarkAddress: req.body.landmarkAddress,
      physicalAddress: req.body.physicalAddress,
      gpsPoint: req.body.gpsPoint,
      customerType: req.body.customerType || 'individual',
      notes: req.body.notes
    };

    const customer = await customerService.createCustomer(input);
    res.status(201).json({ data: customer });
  } catch (error: any) {
    const msg = error?.message || error?.details || String(error);
    res.status(500).json({ error: msg });
  }
};

export const getCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const customer = await customerService.getCustomer(customerId);
    res.json({ data: customer });
  } catch (error) {
    res.status(404).json({ error: 'Customer not found' });
  }
};

export const searchCustomers = async (req: Request, res: Response) => {
  try {
    const { query } = req.query;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'query parameter is required' });
    }

    const customers = await customerService.searchCustomers(query);
    res.json({ data: customers });
  } catch (error) {
    res.status(500).json({ error: (error as any)?.message || String(error) });
  }
};

export const updateCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    const updates: Partial<CreateCustomerInput> = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      phone: req.body.phone,
      whatsapp: req.body.whatsapp,
      email: req.body.email,
      landmarkAddress: req.body.landmarkAddress,
      physicalAddress: req.body.physicalAddress,
      notes: req.body.notes
    };

    const customer = await customerService.updateCustomer(customerId, updates);
    res.json({ data: customer });
  } catch (error) {
    res.status(500).json({ error: (error as any)?.message || String(error) });
  }
};
