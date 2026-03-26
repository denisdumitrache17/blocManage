export const publicUserBaseSelect = {
  id: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true
};

export const publicTenantSelect = {
  id: true,
  userId: true,
  hoaId: true,
  staircaseId: true,
  firstName: true,
  lastName: true,
  phone: true,
  cnp: true,
  addressText: true,
  apartmentNumber: true,
  isApproved: true,
  staircase: { select: { id: true, name: true } },
  createdAt: true,
  updatedAt: true
};

export const publicHoaSelect = {
  id: true,
  userId: true,
  presidentName: true,
  adminName: true,
  buildingAddress: true,
  documentsUrl: true,
  createdAt: true,
  updatedAt: true,
  staircases: true
};

export const publicFirmSelect = {
  id: true,
  userId: true,
  companyName: true,
  cui: true,
  caen: true,
  adminName: true,
  phone: true,
  email: true,
  hqAddress: true,
  iban: true,
  bankName: true,
  createdAt: true,
  updatedAt: true,
  portfolios: true
};

export const publicUserSelect = {
  ...publicUserBaseSelect,
  tenant: {
    select: publicTenantSelect
  },
  hoa: {
    select: publicHoaSelect
  },
  firm: {
    select: publicFirmSelect
  }
};

export const publicFirmWithUserSelect = {
  ...publicFirmSelect,
  user: {
    select: publicUserBaseSelect
  }
};