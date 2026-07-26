export const countryId =
  Number(localStorage.getItem("country_id")) || 1;

export const isBurkina = countryId === 1;
export const isCoteIvoire = countryId === 2;