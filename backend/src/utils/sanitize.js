const getProfileData = (user) => user.tenant ?? user.hoa ?? user.firm ?? null;

export const sanitizeUser = (user) => {
  if (!user) {
    return null;
  }

  const { passwordHash, tenant, hoa, firm, ...safeUser } = user;

  return {
    ...safeUser,
    profile: getProfileData({ tenant, hoa, firm })
  };
};